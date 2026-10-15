import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { entitlementCookie, hashSaju, verifyEntitlement, type SajuAccessInput } from "../../../../../lib/paymentAccess";
import { calculateMyeongunManseryeok } from "../../../../../lib/manseryeok";
import { claimPremiumReport, getPremiumReport, releasePremiumReport, savePremiumReport } from "../../../../../lib/premiumReportStore";

export const runtime = "nodejs";
const REPORT_KEY = "business-v1";

type Report = {
  headline: string;
  overview: string;
  sections: { title: string; summary: string; points: string[]; advice: string }[];
  actionPlan: string[];
  disclaimer: string;
};

function valid(value: unknown): value is Report {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<Report>;
  return typeof report.headline === "string" && typeof report.overview === "string" &&
    Array.isArray(report.sections) && report.sections.length === 6 &&
    report.sections.every((section) => section && typeof section.title === "string" &&
      typeof section.summary === "string" && typeof section.advice === "string" &&
      Array.isArray(section.points) && section.points.length >= 3 &&
      section.points.every((point) => typeof point === "string")) &&
    Array.isArray(report.actionPlan) && report.actionPlan.length >= 4 &&
    report.actionPlan.every((item) => typeof item === "string") &&
    typeof report.disclaimer === "string";
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  let claimId: string | null = null;
  let orderId = "";
  try {
    const body = await request.json();
    const saju = body?.saju as SajuAccessInput | undefined;
    if (!saju || ![saju.name, saju.birth, saju.time, saju.gender, saju.calendar].every((v) => typeof v === "string" && v.trim())) {
      return json({ error: "재물·사업운 상세 분석에 필요한 사주 정보를 입력해 주세요." }, 400);
    }
    const entitlement = verifyEntitlement(request.cookies.get(entitlementCookie.name)?.value);
    if (!entitlement) return json({ error: "유효한 상세 사주 이용권이 없습니다. 이용코드로 다시 로그인해 주세요." }, 401);
    const sajuHash = hashSaju(saju);
    if (sajuHash !== entitlement.sajuHash) return json({ error: "결제한 본인의 사주 정보가 일치하지 않습니다." }, 403);
    orderId = entitlement.orderId;

    const existing = await getPremiumReport(orderId, REPORT_KEY, sajuHash);
    if (existing !== null) {
      if (!valid(existing)) throw new Error("저장된 재물·사업운 보고서 형식이 올바르지 않습니다.");
      return json({ ok: true, result: existing, saved: true, expiresAt: entitlement.exp });
    }

    claimId = await claimPremiumReport(orderId, REPORT_KEY);
    if (!claimId) return json({ error: "재물·사업운 상세 분석을 생성 중입니다. 잠시 후 다시 시도해 주세요." }, 409);
    const savedDuringWait = await getPremiumReport(orderId, REPORT_KEY, sajuHash);
    if (savedDuringWait !== null) {
      if (!valid(savedDuringWait)) throw new Error("저장된 보고서 형식이 올바르지 않습니다.");
      return json({ ok: true, result: savedDuringWait, saved: true, expiresAt: entitlement.exp });
    }

    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    const m = calculateMyeongunManseryeok({ birth: saju.birth!, time: saju.time!, calendar: saju.calendar! });
    const prompt = `당신은 한국어로 재물·사업운을 깊이 있게 설명하는 명운의 사주 해석 AI입니다.
이 보고서는 기존 종합 사주와 구분되는 재물·사업 전문 심층 리포트입니다.
실제 만세력 계산 결과를 근거로 활용하되, 계산되지 않은 대운·특정 사건·수익을 지어내지 마세요.
전통 명리 해석은 참고용이며 재무·투자·사업 성공을 예언하거나 보장하지 않습니다.
쉬운 존댓말로 쓰고, 일반적인 성향 설명을 반복하지 마세요.

[본인 정보]
이름: ${saju.name}
생년월일: ${saju.birth}
출생시간: ${saju.time}
성별: ${saju.gender}
달력: ${saju.calendar}

[만세력 계산값]
연주: ${m.pillars.year.pillar}, 월주: ${m.pillars.month.pillar}, 일주: ${m.pillars.day.pillar}, 시주: ${m.pillars.hour?.pillar ?? "미상"}
일간: ${m.dayMaster.stem} (${m.dayMaster.element})
오행: 목 ${m.fiveElements.목}, 화 ${m.fiveElements.화}, 토 ${m.fiveElements.토}, 금 ${m.fiveElements.금}, 수 ${m.fiveElements.수}
신강·신약 참고값: ${m.strength.level}, ${m.strength.reason}
용신·희신 참고값: ${m.yongshin?.yongshin ?? "미산출"}, ${m.yongshin?.heesin ?? "미산출"}
천간 십성: 연 ${m.pillars.year.tenGodStem}, 월 ${m.pillars.month.tenGodStem}, 일 ${m.pillars.day.tenGodStem}, 시 ${m.pillars.hour?.tenGodStem ?? "미상"}
지지 십성: 연 ${m.pillars.year.tenGodBranch}, 월 ${m.pillars.month.tenGodBranch}, 일 ${m.pillars.day.tenGodBranch}, 시 ${m.pillars.hour?.tenGodBranch ?? "미상"}

[구성]
headline: 전체 핵심을 한 문장으로.
overview: 전체 재물·사업 흐름과 의사결정 성향을 5~7문장으로.
sections: 아래 6개 주제를 정확히 순서대로. 각 summary 5~7문장, points 구체적인 항목 4개, advice 2~4문장.
1. 재물의 축적과 지출 관리
2. 수입 구조와 돈을 다루는 판단 방식
3. 사업 적성과 독립·협업 방식
4. 거래·계약·현금흐름 위험 관리
5. 직업·사업 방향과 성장 전략
6. 앞으로 준비할 기회와 주의할 점
각 섹션에서 만세력 근거와 현실적인 실행 조언을 연결하세요. 전문용어는 쉬운 말로 풀이하세요.
actionPlan: 실행 가능한 우선순위 행동 5개.
disclaimer: 참고용 AI 명리 해석이며 실제 재무·법률·투자 판단에는 객관적인 정보와 전문가 조언이 필요하다는 안내.
반드시 아래 형태의 JSON 객체 하나만 반환하세요.
{"headline":"문장","overview":"설명","sections":[{"title":"재물의 축적과 지출 관리","summary":"설명","points":["항목1","항목2","항목3","항목4"],"advice":"조언"}],"actionPlan":["행동1","행동2","행동3","행동4","행동5"],"disclaimer":"안내"}
sections는 반드시 6개를 모두 채우세요.`;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.5,
      max_output_tokens: 6500,
      text: { format: { type: "json_object" } },
      input: prompt,
    });
    const result: unknown = JSON.parse(response.output_text);
    if (!valid(result)) throw new Error("AI 재물·사업운 분석 결과 형식이 올바르지 않습니다.");
    const stored = await savePremiumReport(orderId, REPORT_KEY, sajuHash, result);
    if (!valid(stored)) throw new Error("저장된 재물·사업운 보고서 형식이 올바르지 않습니다.");
    return json({ ok: true, result: stored, saved: false, expiresAt: entitlement.exp });
  } catch (error) {
    console.error("premium business report API error:", error);
    return json({ error: "재물·사업운 상세 분석을 일시적으로 처리하지 못했습니다. 이용권은 유지되며 잠시 후 다시 시도해 주세요." }, 500);
  } finally {
    if (claimId && orderId) {
      try { await releasePremiumReport(orderId, REPORT_KEY, claimId); }
      catch (error) { console.error("premium business report lock release error:", error); }
    }
  }
}
