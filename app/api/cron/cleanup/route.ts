
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_TABLES = [
  "myeongun_payment_pending",
  "myeongun_reopen_access",
  "myeongun_premium_results",
  "myeongun_premium_reports",
  "myeongun_compatibility_premium_usage",
  "myeongun_compatibility_premium_reports",
  "myeongun_premium_generation_lock",
  "myeongun_premium_report_locks",
  "myeongun_reopen_rate_limit",
];

function response(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  return Boolean(
    secret &&
      request.headers.get("authorization") ===
        `Bearer ${secret}`
  );
}

function deletionEnabled() {
  return process.env.CLEANUP_EXECUTE_ENABLED === "true";
}

async function run(
  request: NextRequest,
  execute: boolean
) {
  if (!authorized(request)) {
    return response({ error: "Unauthorized" }, 401);
  }

  if (!process.env.DATABASE_URL) {
    return response(
      { error: "Database not configured" },
      503
    );
  }

  if (execute && !deletionEnabled()) {
    return response(
      {
        error: "Deletion is disabled",
        deletionPerformed: false,
      },
      403
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const schema = await sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY(${REQUIRED_TABLES})
    `;

    const columns = new Map<string, Set<string>>();

    for (const row of schema) {
      const table = String(row.table_name);

      if (!columns.has(table)) {
        columns.set(table, new Set());
      }

      columns.get(table)!.add(
        String(row.column_name)
      );
    }

    const needs: Record<string, string[]> = {
      myeongun_payment_pending: [
        "order_id",
        "expires_at",
      ],
      myeongun_reopen_access: [
        "order_id",
        "approved_at",
        "expires_at",
      ],
      myeongun_premium_results: [
        "order_id",
      ],
      myeongun_premium_reports: [
        "order_id",
      ],
      myeongun_compatibility_premium_usage: [
        "order_id",
        "expires_at",
      ],
      myeongun_compatibility_premium_reports: [
        "order_id",
        "expires_at",
      ],
      myeongun_premium_generation_lock: [
        "order_id",
      ],
      myeongun_premium_report_locks: [
        "order_id",
      ],
      myeongun_reopen_rate_limit: [
        "window_ends_at",
      ],
    };

    const missing = Object.entries(needs).flatMap(
      ([table, names]) =>
        names
          .filter(
            (name) =>
              !columns.get(table)?.has(name)
          )
          .map(
            (name) => `${table}.${name}`
          )
    );

    if (missing.length > 0) {
      return response(
        {
          error: "Schema verification failed",
          deletionPerformed: false,
          missing,
        },
        409
      );
    }

    if (!execute) {
      const rows = await sql`
        SELECT
          (
            SELECT COUNT(*)::int
            FROM myeongun_payment_pending
            WHERE expires_at <=
              NOW() - INTERVAL '24 hours'
          ) AS expired_pending,

          (
            SELECT COUNT(*)::int
            FROM myeongun_reopen_access
            WHERE approved_at IS NOT NULL
              AND approved_at <=
                NOW() - INTERVAL '30 days'
              AND expires_at <= NOW()
          ) AS approved_orders_due,

          (
            SELECT COUNT(*)::int
            FROM myeongun_reopen_access
            WHERE approved_at IS NULL
          ) AS orders_missing_approval_date,

          (
            SELECT COUNT(*)::int
            FROM myeongun_compatibility_premium_reports
            WHERE expires_at <= NOW()
          ) AS expired_compatibility_reports,

          (
            SELECT COUNT(*)::int
            FROM myeongun_compatibility_premium_usage
            WHERE expires_at <= NOW()
          ) AS expired_compatibility_usage,

          (
            SELECT COUNT(*)::int
            FROM myeongun_reopen_rate_limit
            WHERE window_ends_at <= NOW()
          ) AS expired_rate_limits
      `;

      return response({
        mode: "preview-only",
        deletionPerformed: false,
        automaticDeletionEnabled:
          deletionEnabled(),
        counts: rows[0],
      });
    }

    const rows = await sql`
      WITH eligible AS MATERIALIZED (
        SELECT order_id
        FROM myeongun_reopen_access
        WHERE approved_at IS NOT NULL
          AND approved_at <=
            NOW() - INTERVAL '30 days'
          AND expires_at <= NOW()
      ),

      d_result AS (
        DELETE FROM myeongun_premium_results
        WHERE order_id IN (
          SELECT order_id FROM eligible
        )
        RETURNING order_id
      ),

      d_reports AS (
        DELETE FROM myeongun_premium_reports
        WHERE order_id IN (
          SELECT order_id FROM eligible
        )
        RETURNING order_id
      ),

      d_compat_reports AS (
        DELETE FROM myeongun_compatibility_premium_reports
        WHERE order_id IN (
          SELECT order_id FROM eligible
        )
        OR expires_at <= NOW()
        RETURNING order_id
      ),

      d_compat_usage AS (
        DELETE FROM myeongun_compatibility_premium_usage
        WHERE order_id IN (
          SELECT order_id FROM eligible
        )
        OR expires_at <= NOW()
        RETURNING order_id
      ),

      d_generation_locks AS (
        DELETE FROM myeongun_premium_generation_lock
        WHERE order_id IN (
          SELECT order_id FROM eligible
        )
        RETURNING order_id
      ),

      d_report_locks AS (
        DELETE FROM myeongun_premium_report_locks
        WHERE order_id IN (
          SELECT order_id FROM eligible
        )
        RETURNING order_id
      ),

      d_pending AS (
        DELETE FROM myeongun_payment_pending
        WHERE expires_at <=
          NOW() - INTERVAL '24 hours'
        RETURNING order_id
      ),

      d_reopen AS (
        DELETE FROM myeongun_reopen_access
        WHERE order_id IN (
          SELECT order_id FROM eligible
        )
        RETURNING order_id
      ),

      d_rate_limits AS (
        DELETE FROM myeongun_reopen_rate_limit
        WHERE window_ends_at <= NOW()
        RETURNING 1
      )

      SELECT
        (
          SELECT COUNT(*)::int
          FROM d_reopen
        ) AS deleted_reopen,

        (
          SELECT COUNT(*)::int
          FROM d_result
        ) AS deleted_results,

        (
          SELECT COUNT(*)::int
          FROM d_reports
        ) AS deleted_reports,

        (
          SELECT COUNT(*)::int
          FROM d_compat_reports
        ) AS deleted_compatibility_reports,

        (
          SELECT COUNT(*)::int
          FROM d_compat_usage
        ) AS deleted_compatibility_usage,

        (
          SELECT COUNT(*)::int
          FROM d_generation_locks
        ) AS deleted_generation_locks,

        (
          SELECT COUNT(*)::int
          FROM d_report_locks
        ) AS deleted_report_locks,

        (
          SELECT COUNT(*)::int
          FROM d_pending
        ) AS deleted_pending,

        (
          SELECT COUNT(*)::int
          FROM d_rate_limits
        ) AS deleted_rate_limits
    `;

    return response({
      mode: "execute",
      deletionPerformed: true,
      automaticDeletionEnabled:
        deletionEnabled(),
      counts: rows[0],
    });
  } catch (error) {
    console.error(
      "Privacy cleanup failed:",
      error
    );

    return response(
      {
        error: "Cleanup failed",
        deletionPerformed: false,
      },
      500
    );
  }
}

export async function GET(request: NextRequest) {
  // Vercel Cron 요청은 GET으로 실행됩니다.
  // 실제 삭제는 별도 환경변수가 활성화된 경우에만 허용합니다.
  return run(request, deletionEnabled());
}

export async function POST(request: NextRequest) {
  return run(request, true);
}
