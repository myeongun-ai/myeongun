import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 개인정보 보관기간 정리 API.
 * CRON_SECRET 인증 필수. CLEANUP_EXECUTE=true가 아니면 조회만 합니다.
 * 결제 승인일이 없는 기존 주문은 자동 삭제하지 않습니다.
 * 결제 준비 정보는 30분 뒤 사용 불가, 실제 삭제는 만료 24시간 후입니다.
 * 실제 삭제 쿼리는 하나의 DB 트랜잭션으로 실행합니다.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const sql = neon(process.env.DATABASE_URL);
  const execute = process.env.CLEANUP_EXECUTE === "true";

  try {
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
          'myeongun_premium_generation_lock',
          'myeongun_premium_report_locks',
          'myeongun_reopen_rate_limit'
        )
    `;

    const columns = new Map<string, Set<string>>();
    for (const row of schema) {
      const table = String(row.table_name);
      if (!columns.has(table)) columns.set(table, new Set<string>());
      columns.get(table)!.add(String(row.column_name));
    }
    const exists = (name: string) => columns.has(name);
    const approved = columns.get("myeongun_reopen_access")?.has("approved_at") === true;

    const count = async (table: string, query: () => Promise<unknown>) => {
      if (!exists(table)) return null;
      const rows = (await query()) as Array<{ n: number | string }>;
      return Number(rows[0]?.n ?? 0);
    };

    const before = {
      expiredPending: await count("myeongun_payment_pending", () => sql`
        SELECT COUNT(*)::int AS n FROM myeongun_payment_pending WHERE expires_at <= NOW()
      `),
      pendingEligibleForDeletion: await count("myeongun_payment_pending", () => sql`
        SELECT COUNT(*)::int AS n FROM myeongun_payment_pending
        WHERE expires_at <= NOW() - INTERVAL '24 hours'
      `),
      eligibleApprovedOrders: approved
        ? await count("myeongun_reopen_access", () => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_reopen_access
            WHERE approved_at IS NOT NULL AND approved_at <= NOW() - INTERVAL '30 days'
          `)
        : null,
      missingApprovalDate: await count("myeongun_reopen_access", () =>
        approved
          ? sql`SELECT COUNT(*)::int AS n FROM myeongun_reopen_access WHERE approved_at IS NULL`
          : sql`SELECT COUNT(*)::int AS n FROM myeongun_reopen_access`
      ),
      expiredGenerationLocks: await count("myeongun_premium_generation_lock", () => sql`
        SELECT COUNT(*)::int AS n FROM myeongun_premium_generation_lock WHERE locked_until <= NOW()
      `),
      expiredReportLocks: await count("myeongun_premium_report_locks", () => sql`
        SELECT COUNT(*)::int AS n FROM myeongun_premium_report_locks WHERE locked_until <= NOW()
      `),
      expiredRateLimits: await count("myeongun_reopen_rate_limit", () => sql`
        SELECT COUNT(*)::int AS n FROM myeongun_reopen_rate_limit WHERE window_ends_at <= NOW()
      `),
    };

    if (!execute) {
      return NextResponse.json(
        {
          mode: "preview",
          deletionPerformed: false,
          approvalDateColumnPresent: approved,
          counts: before,
          message: "읽기 전용 점검입니다. 승인일이 확인되지 않은 주문은 삭제하지 않습니다.",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Neon HTTP 드라이버의 트랜잭션에 모든 DELETE를 함께 전달합니다.
    const statements: Array<ReturnType<typeof sql>> = [];

    if (approved) {
      if (exists("myeongun_premium_results")) statements.push(sql`
        DELETE FROM myeongun_premium_results p
        WHERE EXISTS (
          SELECT 1 FROM myeongun_reopen_access r
          WHERE r.order_id = p.order_id
            AND r.approved_at IS NOT NULL
            AND r.approved_at <= NOW() - INTERVAL '30 days'
        )
      `);
      if (exists("myeongun_premium_reports")) statements.push(sql`
        DELETE FROM myeongun_premium_reports p
        WHERE EXISTS (
          SELECT 1 FROM myeongun_reopen_access r
          WHERE r.order_id = p.order_id
            AND r.approved_at IS NOT NULL
            AND r.approved_at <= NOW() - INTERVAL '30 days'
        )
      `);
      if (exists("myeongun_compatibility_premium_usage")) statements.push(sql`
        DELETE FROM myeongun_compatibility_premium_usage p
        WHERE EXISTS (
          SELECT 1 FROM myeongun_reopen_access r
          WHERE r.order_id = p.order_id
            AND r.approved_at IS NOT NULL
            AND r.approved_at <= NOW() - INTERVAL '30 days'
        )
      `);
      if (exists("myeongun_premium_report_locks")) statements.push(sql`
        DELETE FROM myeongun_premium_report_locks p
        WHERE p.locked_until <= NOW()
          AND EXISTS (
            SELECT 1 FROM myeongun_reopen_access r
            WHERE r.order_id = p.order_id
              AND r.approved_at IS NOT NULL
              AND r.approved_at <= NOW() - INTERVAL '30 days'
          )
      `);
      if (exists("myeongun_premium_generation_lock")) statements.push(sql`
        DELETE FROM myeongun_premium_generation_lock p
        WHERE p.locked_until <= NOW()
          AND EXISTS (
            SELECT 1 FROM myeongun_reopen_access r
            WHERE r.order_id = p.order_id
              AND r.approved_at IS NOT NULL
              AND r.approved_at <= NOW() - INTERVAL '30 days'
          )
      `);
      statements.push(sql`
        DELETE FROM myeongun_reopen_access
        WHERE approved_at IS NOT NULL
          AND approved_at <= NOW() - INTERVAL '30 days'
      `);
    }

    if (exists("myeongun_payment_pending")) statements.push(sql`
      DELETE FROM myeongun_payment_pending
      WHERE expires_at <= NOW() - INTERVAL '24 hours'
    `);
    if (exists("myeongun_premium_generation_lock")) statements.push(sql`
      DELETE FROM myeongun_premium_generation_lock WHERE locked_until <= NOW()
    `);
    if (exists("myeongun_premium_report_locks")) statements.push(sql`
      DELETE FROM myeongun_premium_report_locks WHERE locked_until <= NOW()
    `);
    if (exists("myeongun_reopen_rate_limit")) statements.push(sql`
      DELETE FROM myeongun_reopen_rate_limit WHERE window_ends_at <= NOW()
    `);

    if (statements.length > 0) {
      await sql.transaction(statements);
    }

    return NextResponse.json(
      {
        mode: "execute",
        deletionPerformed: statements.length > 0,
        approvalDateColumnPresent: approved,
        countsBefore: before,
        message: "트랜잭션 처리가 완료되었습니다. 승인일 미확인 주문은 보존했습니다.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Cleanup failed; transaction not confirmed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
