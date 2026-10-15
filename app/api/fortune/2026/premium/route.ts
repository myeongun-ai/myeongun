import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { entitlementCookie, hashSaju, verifyEntitlement, type SajuAccessInput } from "../../../../../lib/paymentAccess";
import { calculateMyeongunManseryeok } from "../../../../../lib/manseryeok";
import { claimPremiumReport, getPremiumReport, releasePremiumReport, savePremiumReport } from "../../../../../lib/premiumReportStore";

export const runtime = "nodejs";

type Section = { title: string; summary: string; points: string[]; advice: string };
type NewYearReport = {
  headline: string;
  overview: string;
  sections: Section[];
  months: { year: number; month: number; title: string; summary: string; advice: string }[];
  actionPlan: string[];
  disclaimer: string;
};

function isReport(value: unknown): value is NewYearReport {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<NewYearReport>;
  return typeof r.headline === "string" && typeof r.overview === "string" &&
    Array.isArray(r.sections) && r.sections.length === 8 &&
    r.sections.every((s) => s && typeof s.title === "string" && typeof s.summary === "string" &&
      typeof s.advice === "string" && Array.isArray(s.points) && s.points.length >= 3 &&
      s.points.every((p) => typeof p === "string")) &&
    Array.isArray(r.months) && r.months.every((m) => m && Number.isInteger(m.year) &&
      Number.isInteger(m.month) && typeof m.title === "string" &&
      typeof m.summary === "string" && typeof m.advice === "string") &&
    Array.isArray(r.actionPlan) && r.actionPlan.length >= 4 &&
    r.actionPlan.every((a) => typeof a === "string") && typeof r.disclaimer === "string";
}

function respond(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function koreaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

export async function POST(request: NextRequest) {
  let claimId: string | null = null;
  let orderId = "";
  let reportKey = "";
  try {
    const body = await request.json();
    const saju = body?.saju as SajuAccessInput | undefined;
    if (!saju || ![saju.name, saju.birth, saju.time, saju.gender, saju.calendar]
      .every((v) => typeof v === "string" && v.trim())) {
      return respond({ error: "신년운세 상세 분석에 필요한 정보를 모두 입력해 주세요." }, 400);
    }
    const entitlement = verifyEntitlement(request.cookies.get(entitlementCookie.name)?.value);
    if (!entitlement) return respond({ error: "유효한 상세 사주 이용권이 없습니다. 이용코드로 다시 로그인해 주세요." }, 401);
    const sajuHash = hashSaju(saju);
    if (sajuHash !== entitlement.sajuHash) return respond({ error: "결제한 본인의 사주 정보가 일치하지 않습니다." }, 403);
    orderId = entitlement.orderId;

    const today = koreaToday();
    const targetYear = today.month >= 9 ? today.year + 1 : today.year;
    const remainingMonths = targetYear > today.year
      ? Array.from({ length: 12 - today.month + 1 }, (_, i) => today.month + i)
      : [];
    reportKey = `newyear-${targetYear}-v1`;
    const restoreOnly = body?.restoreOnly === true;
    const existing = await getPremiumReport(orderId, reportKey, sajuHash);
    if (existing !== null) {
      if (!isReport(existing)) throw new Error("저장된 신년운세 보고서 형식이 올바르지 않습니다.");
      return respond({ ok: true, result: existing, targetYear, saved: true, expiresAt: entitlement.exp });
    }
    if (restoreOnly) return respond({ error: "저장된 신년운세 상세 보고서가 없습니다. 유효한 이용권으로 유료 상세 분석을 처음 실행하면 보고서가 저장됩니다.", code: "REPORT_NOT_FOUND" }, 404);
    claimId = await claimPremiumReport(orderId, reportKey);
    if (!claimId) return respond({ error: "신년운세 상세 분석을 생성 중입니다. 잠시 후 다시 시도해 주세요." }, 409);
    const savedDuringWait = await getPremiumReport(orderId, reportKey, sajuHash);
    if (savedDuringWait !== null) {
      if (!isReport(savedDuringWait)) throw new Error("저장된 보고서 형식이 올바르지 않습니다.");
      return respond({ ok: true, result: savedDuringWait, targetYear, saved: true, expiresAt: entitlement.exp });
    }
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    const m = calculateMyeongunManseryeok({ birth: saju.birth!, time: saju.time!, calendar: saju.calendar! });
    const monthsInstruction = remainingMonths.length
      ? `${today.year}년 ${remainingMonths.join(", ")}월 각각의 참고용 월별 흐름을 months 배열에 정확히 ${remainingMonths.length}개 작성하세요. year=${today.year}, month는 지정된 숫자를 사용하세요. 현재 이전 달은 포함하지 마세요.`
      : "months는 빈 배열로 작성하세요.";
    const prompt = `당신은 명운의 한국어 신년운세 심층 보고서를 작성하는 AI입니다.
전통 명리 관점의 참고 해석을 제공하되 미래 사건, 금전적 성과, 건강 결과를 단정하지 마세요.
제공된 만세력에서 실제로 계산되지 않은 세운·월운·대운·절기 경계의 정밀 계산값을 지어내지 마세요.
${targetYear}년 연간 흐름을 주제로 하고, 연도 변화의 기준이 명리학에서는 통상 입춘이라는 점을 주의하세요.
아래 사주 기본값을 참고하여 개인에게 유용한 구체적이고 현실적인 조언을 쉬운 존댓말로 작성하세요.

이름: ${saju.name}, 생년월일: ${saju.birth}, 시간: ${saju.time}, 성별: ${saju.gender}, 달력: ${saju.calendar}
연주: ${m.pillars.year.pillar}, 월주: ${m.pillars.month.pillar}, 일주: ${m.pillars.day.pillar}, 시주: ${m.pillars.hour?.pillar ?? "미상"}
일간: ${m.dayMaster.stem} (${m.dayMaster.element}), 신강·신약: ${m.strength.level}
오행: 목 ${m.fiveElements.목}, 화 ${m.fiveElements.화}, 토 ${m.fiveElements.토}, 금 ${m.fiveElements.금}, 수 ${m.fiveElements.수}
용신·희신 참고: ${m.yongshin?.yongshin ?? "미산출"}, ${m.yongshin?.heesin ?? "미산출"}
천간 십성: 연 ${m.pillars.year.tenGodStem}, 월 ${m.pillars.month.tenGodStem}, 일 ${m.pillars.day.tenGodStem}

headline: ${targetYear}년의 전체 핵심 한 문장.
overview: 5~7문장으로 전체 해석.
sections: 아래 주제 순서로 정확히 8개. 각 summary는 4~6문장, points는 구체적인 조언 4개, advice는 2~3문장.
1. ${targetYear}년 전체 흐름과 준비 방향
2. 재물운과 수입·지출 관리
3. 직업운과 사업·일의 기회
4. 인간관계와 가족·협업
5. 애정운과 대인 소통
6. 건강·생활 리듬과 자기 관리 (의학적 진단 금지)
7. 상반기와 하반기의 준비 전략 (정밀 월운 계산인 것처럼 주장 금지)
8. 기회와 주의점 및 실행 우선순위
${monthsInstruction}
월별 해석은 확정적 사건 예측이 아닌 생활 점검과 준비 방향이며, 각 월 summary 3~5문장, advice 2~3문장.
actionPlan: 실천할 수 있는 행동 5개.
disclaimer: 명리 해석은 참고용이고 실제 투자·사업·건강·법률 판단에는 객관적 정보와 전문가 상담이 필요하다는 안내.
반드시 다음 키를 가진 JSON 객체 하나만 반환하세요: headline, overview, sections, months, actionPlan, disclaimer.
sections 항목 형태: {"title":"제목","summary":"설명","points":["항목1","항목2","항목3","항목4"],"advice":"조언"}.
months 항목 형태: {"year":${today.year},"month":10,"title":"월별 제목","summary":"설명","advice":"조언"}.
반드시 sections는 8개, months는 지정한 달만 모두 작성하세요.`;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-4.1-mini", temperature: 0.5, max_output_tokens: 8500,
      text: { format: { type: "json_object" } }, input: prompt,
    });
    const result: unknown = JSON.parse(response.output_text);
    if (!isReport(result)) throw new Error("AI 신년운세 보고서 형식이 올바르지 않습니다.");
    const r = result as NewYearReport;
    if (r.months.length !== remainingMonths.length ||
      r.months.some((v, i) => v.year !== today.year || v.month !== remainingMonths[i])) {
      throw new Error("월별 운세의 연도 또는 월 구성이 올바르지 않습니다.");
    }
    const stored = await savePremiumReport(orderId, reportKey, sajuHash, result);
    if (!isReport(stored)) throw new Error("저장된 신년운세 보고서 형식이 올바르지 않습니다.");
    return respond({ ok: true, result: stored, targetYear, saved: false, expiresAt: entitlement.exp });
  } catch (error) {
    console.error("premium new year report API error:", error);
    return respond({ error: "신년운세 상세 분석을 일시적으로 처리하지 못했습니다. 이용권은 유지되며 잠시 후 다시 시도해 주세요." }, 500);
  } finally {
    if (claimId && orderId && reportKey) {
      try { await releasePremiumReport(orderId, reportKey, claimId); }
      catch (error) { console.error("premium new year report lock release error:", error); }
    }
  }
}
