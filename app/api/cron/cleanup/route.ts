import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 개인정보 정리 API
 *
 * 현재는 조회 전용입니다.
 * 실제 DELETE 기능은 의도적으로 포함하지 않았습니다.
 *
 * 결제 복구 및 보관기간 검증이 완료되기 전까지
 * 고객 개인정보를 자동 삭제하지 않습니다.
 */

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const sql = neon(databaseUrl);

    const schema = await sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN (
          'myeongun_payment_pending',
          'myeongun_reopen_access',
          'myeongun_premium_results',
          'myeongun_premium_reports',
          'myeongun_compatibility_premium_usage',
          'myeongun_compatibility_premium_reports',
          'myeongun_premium_generation_lock',
          'myeongun_premium_report_locks',
          'myeongun_reopen_rate_limit'
        )
    `;

    const columns = new Map<string, Set<string>>();

    for (const row of schema) {
      const table = String(row.table_name);

      if (!columns.has(table)) {
        columns.set(table, new Set<string>());
      }

      columns.get(table)!.add(String(row.column_name));
    }

    const has = (table: string, ...required: string[]) =>
      required.every(
        (column) => columns.get(table)?.has(column) === true
      );

    const count = async (
      query: () => PromiseLike<Record<string, any>[]>
    ) => {
      const rows = await query();
      return Number(rows[0]?.n ?? 0);
    };

    const counts = {
      expiredPending: has(
        "myeongun_payment_pending",
        "expires_at"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_payment_pending
            WHERE expires_at <= NOW()
          `)
        : null,

      pendingOlderThan24HoursAfterExpiry: has(
        "myeongun_payment_pending",
        "expires_at"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_payment_pending
            WHERE expires_at <= NOW() - INTERVAL '24 hours'
          `)
        : null,

      approvedOrdersOlderThan30Days: has(
        "myeongun_reopen_access",
        "approved_at"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_reopen_access
            WHERE approved_at IS NOT NULL
              AND approved_at <= NOW() - INTERVAL '30 days'
          `)
        : null,

      ordersMissingApprovalDate: has(
        "myeongun_reopen_access",
        "approved_at"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_reopen_access
            WHERE approved_at IS NULL
          `)
        : null,

      expiredCompatibilityReports: has(
        "myeongun_compatibility_premium_reports",
        "expires_at"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_compatibility_premium_reports
            WHERE expires_at <= NOW()
          `)
        : null,

      expiredCompatibilityUsage: has(
        "myeongun_compatibility_premium_usage",
        "expires_at"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_compatibility_premium_usage
            WHERE expires_at <= NOW()
          `)
        : null,

      expiredGenerationLocks: has(
        "myeongun_premium_generation_lock",
        "locked_until"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_premium_generation_lock
            WHERE locked_until <= NOW()
          `)
        : null,

      expiredReportLocks: has(
        "myeongun_premium_report_locks",
        "locked_until"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_premium_report_locks
            WHERE locked_until <= NOW()
          `)
        : null,

      expiredRateLimits: has(
        "myeongun_reopen_rate_limit",
        "window_ends_at"
      )
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n
            FROM myeongun_reopen_rate_limit
            WHERE window_ends_at <= NOW()
          `)
        : null,
    };

    return NextResponse.json(
      {
        mode: "preview-only",
        deletionPerformed: false,
        automaticDeletionEnabled: false,
        cleanupExecuteSettingIgnored: true,
        counts,
        notes: [
          "개인정보 정리 대상 조회 전용입니다.",
          "실제 개인정보 삭제는 수행하지 않습니다.",
          "결제 전 임시 정보는 만료 후 24시간 경과 건수를 별도 집계합니다.",
          "결제 승인 및 복구 가능성을 검증하기 전에는 임시 정보를 삭제하지 않습니다.",
          "7일 이용권 만료와 개인정보 보관기간은 별개입니다.",
          "30일 경과 주문은 자동 삭제 승인 대상이 아닙니다.",
          "결제 거래 기록은 조회하거나 삭제하지 않습니다.",
          "null은 해당 테이블 또는 컬럼을 확인하지 못했다는 뜻입니다.",
        ],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("개인정보 정리 대상 조회 오류:", error);

    return NextResponse.json(
      { error: "Cleanup preview failed" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}