import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 개인정보 정리 API - 검토용, 읽기 전용.
 *
 * 이 버전은 데이터베이스에서 어떤 기록이 정리 대상인지 집계만 합니다.
 * DELETE 쿼리는 포함하지 않습니다. 자동 실행/실제 삭제 활성화 전에
 * 보관기간, 예외 처리, DB 스키마와 법적 의무를 별도 검증해야 합니다.
 *
 * CRON_SECRET을 Authorization: Bearer <secret> 헤더로 전달해야 합니다.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
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
      if (!columns.has(table)) columns.set(table, new Set<string>());
      columns.get(table)!.add(String(row.column_name));
    }
    const has = (table: string, ...required: string[]) =>
      required.every((column) => columns.get(table)?.has(column) === true);
    const count = async (query: () => PromiseLike<Record<string, any>[]>) => {
      const rows = await query();
      return Number(rows[0]?.n ?? 0);
    };

    // 삭제 후보 수만 확인합니다. 실제 DELETE는 이 파일에 없습니다.
    const counts = {
      expiredPending: has("myeongun_payment_pending", "expires_at")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_payment_pending
            WHERE expires_at <= NOW()
          `)
        : null,
      pendingOlderThan24HoursAfterExpiry: has("myeongun_payment_pending", "expires_at")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_payment_pending
            WHERE expires_at <= NOW() - INTERVAL '24 hours'
          `)
        : null,
      approvedOrdersOlderThan30Days: has("myeongun_reopen_access", "approved_at")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_reopen_access
            WHERE approved_at IS NOT NULL
              AND approved_at <= NOW() - INTERVAL '30 days'
          `)
        : null,
      ordersMissingApprovalDate: has("myeongun_reopen_access", "approved_at")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_reopen_access
            WHERE approved_at IS NULL
          `)
        : null,
      expiredCompatibilityReports: has("myeongun_compatibility_premium_reports", "expires_at")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_compatibility_premium_reports
            WHERE expires_at <= NOW()
          `)
        : null,
      expiredCompatibilityUsage: has("myeongun_compatibility_premium_usage", "expires_at")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_compatibility_premium_usage
            WHERE expires_at <= NOW()
          `)
        : null,
      expiredGenerationLocks: has("myeongun_premium_generation_lock", "locked_until")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_premium_generation_lock
            WHERE locked_until <= NOW()
          `)
        : null,
      expiredReportLocks: has("myeongun_premium_report_locks", "locked_until")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_premium_report_locks
            WHERE locked_until <= NOW()
          `)
        : null,
      expiredRateLimits: has("myeongun_reopen_rate_limit", "window_ends_at")
        ? await count(() => sql`
            SELECT COUNT(*)::int AS n FROM myeongun_reopen_rate_limit
            WHERE window_ends_at <= NOW()
          `)
        : null,
    };

    return NextResponse.json(
      {
        mode: "preview-only",
        deletionPerformed: false,
        cleanupExecuteSettingIgnored: true,
        counts,
        notes: [
          "조회 전용입니다. 개인정보를 삭제하지 않습니다.",
          "null은 테이블 또는 필요한 컬럼이 확인되지 않아 집계하지 못했다는 뜻입니다.",
          "30일 경과 주문 수는 삭제 승인 수가 아닙니다. 보관 정책과 법적 예외 검토가 필요합니다.",
          "만료된 심화 궁합 결과와 이용 기록을 별도 집계합니다.",
          "결제 거래 기록은 조회하거나 삭제하지 않습니다.",
        ],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Cleanup preview failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
