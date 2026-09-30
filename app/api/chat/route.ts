import OpenAI from "openai";
import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { calculateMyeongunManseryeok } from "../../../lib/manseryeok";
import {
  entitlementCookie,
  hashSaju,
  verifyEntitlement,
} from "../../../lib/paymentAccess";

type Saju = {
  name?: string;
  birth?: string;
  time?: string;
  gender?: string;
  calendar?: string;
};

type AIUsagePayload = {
  v: 1;
  scope: "free" | "paid";
  key: string;
  used: number;
  exp: number;
};

type AIUsageState = {
  paid: boolean;
  limit: number;
  used: number;
  remaining: number;
  expiresAt: number;
};

const FREE_AI_LIMIT = 3;
const PAID_AI_LIMIT = 20;
const FREE_AI_COOKIE = "myeongun_ai_free_usage";
const PAID_AI_COOKIE = "myeongun_ai_paid_usage";
const FREE_AI_SECONDS = 60 * 60 * 24 * 365;

function getAIUsageSigningKey() {
  const tossSecret = process.env.TOSS_SECRET_KEY;

  if (!tossSecret) {
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  }

  return createHmac("sha256", tossSecret)
    .update("myeongun-ai-usage-v1")
    .digest();
}

function signAIUsage(encoded: string) {
  return createHmac("sha256", getAIUsageSigningKey())
    .update(encoded)
    .digest("base64url");
}

function createAIUsageToken(payload: AIUsagePayload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );

  return `${encoded}.${signAIUsage(encoded)}`;
}

function verifyAIUsageToken(
  token: string | undefined,
  scope: AIUsagePayload["scope"],
  key: string
) {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signAIUsage(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AIUsagePayload;

    if (payload.v !== 1) return null;
    if (payload.scope !== scope) return null;
    if (payload.key !== key) return null;
    if (!Number.isFinite(payload.used) || payload.used < 0) return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getAIUsage(req: NextRequest, saju: Saju) {
  const now = Math.floor(Date.now() / 1000);
  const entitlementToken = req.cookies.get(entitlementCookie.name)?.value;
  const entitlement = verifyEntitlement(entitlementToken);

  const isPaid =
    Boolean(entitlement) &&
    entitlement?.sajuHash === hashSaju(saju);

  const scope: AIUsagePayload["scope"] = isPaid ? "paid" : "free";
  const limit = isPaid ? PAID_AI_LIMIT : FREE_AI_LIMIT;
  const key = isPaid
    ? `${entitlement?.orderId || ""}:${entitlement?.sajuHash || ""}`
    : "free-browser-v1";
  const expiresAt = isPaid
    ? Number(entitlement?.exp || now)
    : now + FREE_AI_SECONDS;
  const cookieName = isPaid ? PAID_AI_COOKIE : FREE_AI_COOKIE;

  const saved = verifyAIUsageToken(
    req.cookies.get(cookieName)?.value,
    scope,
    key
  );

  const used = Math.min(saved?.used || 0, limit);

  const usage: AIUsageState = {
    paid: isPaid,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    expiresAt: saved?.exp || expiresAt,
  };

  return {
    usage,
    scope,
    key,
    cookieName,
    expiresAt: saved?.exp || expiresAt,
  };
}

function setAIUsageCookie(
  response: NextResponse,
  info: ReturnType<typeof getAIUsage>,
  used: number
) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AIUsagePayload = {
    v: 1,
    scope: info.scope,
    key: info.key,
    used,
    exp: info.expiresAt,
  };

  response.cookies.set(info.cookieName, createAIUsageToken(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(1, info.expiresAt - now),
  });
}

function isMyeongunRelatedQuestion(question: string) {
  const q = question.replace(/\s+/g, " ").trim();

  const patterns = [
    /(사주|운세|재물운|사업운|직업운|취업운|이직운|연애운|결혼운|궁합|건강운|금전운|시험운|승진운|대운|세운|오행|십성|용신|희신|만세력)/i,
    /(재물|사업|직업|취업|이직|연애|결혼|인간관계|돈|금전|건강|시험|승진).*(운|흐름|사주|어떻게|궁금|좋|나쁘)/i,
    /(올해|내년|2026년|2027년).*(운|사업|재물|직업|취업|이직|연애|결혼|돈|관계)/i,
    /(환불|취소|결제|결재|결제내역|중복결제|결제오류|결제실패|영수증|승인번호|주문번호|토스)/i,
    /(이용|사용|서비스|사이트|홈페이지|명운).*(방법|어떻게|문의|안내|오류|문제|안됨|안 돼|안되|가능|기간|횟수)/i,
    /(어떻게).*(이용|사용|결제|결재|환불|취소|재열람|다시보기)/i,
    /(재열람|다시보기|다시 보기|상세 사주|결제한 사주|이용코드|이용 코드)/i,
    /(무료 상담|무료 ai|ai 상담|상담 횟수|남은 횟수|몇 회|몇회|3회|20회|7일|9,900원|9900원)/i,
    /(고객센터|고객 센터|문의처|이메일|메일|개인정보|탈퇴|환불정책|환불 정책)/i,
  ];

  return patterns.some((pattern) => pattern.test(q));
}

function isServiceQuestion(question: string) {
  const q = question.replace(/\s+/g, " ").trim();

  const sajuPatterns = [
    /(사주|운세|재물운|사업운|직업운|취업운|이직운|연애운|결혼운|궁합|건강운|금전운|시험운|승진운|대운|세운|오행|십성|용신|희신)/i,
    /(올해|내년|2026년|2027년).*(운|사업|재물|직업|취업|이직|연애|결혼|돈|관계)/i,
    /(운이|운은|운을|운세가|사주가|사주를).*(어떻게|어떤|좋|나쁘|궁금)/i,
  ];

  const servicePatterns = [
    /(환불|취소|결제|결재|결제내역|결제 내역|중복결제|중복 결제|결제오류|결제 오류|결제실패|결제 실패|영수증|승인번호|주문번호|토스)/i,
    /(이용|사용|서비스|사이트|홈페이지).*(방법|어떻게|문의|안내|오류|문제|안됨|안 돼|안되|가능|기간|횟수)/i,
    /(어떻게).*(이용|사용|결제|결재|환불|취소|재열람|다시보기)/i,
    /(재열람|다시보기|다시 보기|상세 사주|결제한 사주).*(방법|어떻게|어디|안|못|확인|보기|열람|기간)/i,
    /(무료 상담|무료 ai|ai 상담|상담 횟수|남은 횟수|몇 회|몇회|3회|20회|7일|9,900원|9900원)/i,
    /(고객센터|고객 센터|문의처|이메일|메일|개인정보|탈퇴|환불정책|환불 정책)/i,
  ];

  if (servicePatterns.some((pattern) => pattern.test(q))) {
    return true;
  }

  if (sajuPatterns.some((pattern) => pattern.test(q))) {
    return false;
  }

  // 사주 상담 의도가 명확하지 않은 일반적인 이용 질문은
  // 고객 서비스 문의로 처리해 무료/유료 사주 상담 횟수를 차감하지 않습니다.
  return true;
}

function getServicePrompt(question: string) {
  return `
당신은 '명운' 서비스의 고객 이용 안내 AI입니다.
사용자의 질문은 사주풀이가 아니라 명운 서비스 이용 문의입니다.
가능한 내용은 AI가 먼저 직접 설명하고 해결 방법을 안내하세요.
사람이 실제 결제내역이나 환불 접수 내용을 확인해야 하는 경우에만 이메일 문의를 안내하세요.

[사용자 질문]
${question}

[확인된 명운 서비스 정보]
- 무료 사주를 이용할 수 있으며, 개인 사주를 바탕으로 하는 AI 사주 상담은 무료로 3회 이용할 수 있습니다.
- 결제·환불·재열람·이용코드·이용방법·서비스 오류 등 명운 서비스 이용에 관한 일반 상담은 횟수 제한 없이 언제든 이용할 수 있으며 사주 관련 AI 상담 횟수에서 차감하지 않습니다.
- 상세 사주 분석은 9,900원입니다.
- 상세 사주 결제 후 7일 동안 개인 사주를 바탕으로 하는 사주 관련 AI 상담을 최대 20회 이용할 수 있습니다.
- 상세 사주 결제가 완료되면 결제 이용코드가 발급됩니다.
- 결제 이용코드는 결제한 상세 사주를 다시 열람할 때 반드시 필요하므로 결제 완료 즉시 고객이 별도로 저장하고 기억해야 합니다.
- 개인정보 보호 및 보안을 위해 명운에서는 고객의 결제 이용코드를 확인하거나 복구해 드릴 수 없습니다.
- 이용코드를 분실하면 결제한 상세 사주의 재열람이 어려울 수 있습니다.
- 고객의 이용코드 분실로 인한 재열람 제한은 서비스 오류에 해당하지 않으며, 이용코드 분실만을 사유로 한 환불은 제한될 수 있습니다.
- 결제한 상세 사주는 명운의 '결제 사주 재열람' 기능에서 결제 당시 정보와 결제 이용코드를 이용해 다시 열람할 수 있습니다.
- 명운에는 회원 로그인이나 계정 기반 로그인 기능이 없습니다.
- 따라서 로그인, 계정 로그인, 로그인 후 결제내역 확인, 로그인 후 최근 이용내역 확인 같은 존재하지 않는 기능을 안내하지 마세요.
- 유료 상세 사주 분석은 이용자가 입력한 생년월일, 출생시간 등의 정보를 바탕으로 분석 결과를 온라인으로 제공하는 디지털 콘텐츠 서비스입니다.

[실제 결제 방법]
- 결제 방법은 아래 순서대로 진행합니다.
- 먼저 명운의 '무료 사주'에서 생년월일, 출생시간 등 필요한 정보를 입력합니다.
- 입력 후 무료 사주 결과를 확인합니다.
- 무료 사주 결과 아래의 '상세 사주 전체보기 9,900원 결제하기' 버튼을 눌러 결제를 진행합니다.
- 결제가 완료되면 상세 사주를 확인할 수 있고 결제 이용코드가 발급됩니다.
- 결제 이용코드는 재열람에 반드시 필요하며 명운에서 확인하거나 복구해 드릴 수 없으므로 결제 완료 즉시 별도로 저장해야 합니다.
- 결제 후 7일 동안 사주 관련 AI 상담을 최대 20회 이용할 수 있습니다.
- 일반 서비스 상담은 결제 여부와 관계없이 횟수 제한 없이 언제든 이용할 수 있습니다.

[환불 및 취소 정책]
- 결제 후 아직 유료 상세 분석 결과가 제공되지 않은 경우에는 결제 취소 또는 환불을 요청할 수 있습니다.
- 유료 상세 분석 결과가 정상적으로 제공되어 디지털 콘텐츠 이용이 시작된 이후에는 관련 법령에서 정한 경우를 제외하고 단순 변심에 의한 환불이 제한될 수 있습니다.
- 결제가 완료되었으나 시스템 오류 등으로 유료 상세 분석 결과가 정상적으로 제공되지 않은 경우에는 확인 후 재제공 또는 환불을 진행합니다.
- 환불은 결제 내역과 서비스 이용 여부를 확인한 후 처리합니다.
- 환불 승인 후 실제 환급 시점은 결제수단 및 카드사·금융기관의 처리 일정에 따라 차이가 있을 수 있습니다.
- 실제 환불 접수 또는 고객의 개별 결제내역 확인이 필요한 경우 이메일 ordi79134@daum.net 으로 안내하세요.
- 환불 접수나 개별 문의 수단으로 전화번호를 안내하지 마세요.
- 자세한 정책 위치를 안내할 때는 개발 경로 '/refund'를 그대로 보여주지 말고 '명운 홈페이지 하단의 환불정책'이라고 표현하세요.

[답변 원칙]
- 절대로 사주, 만세력, 오행, 십성, 운세, 2026년 흐름을 근거로 서비스 문의에 답하지 마세요.
- "사주상", "운의 흐름", "기운" 같은 표현을 사용하지 마세요.
- 사용자의 질문에 먼저 직접 답하고, 가능한 해결 방법을 순서대로 설명하세요.
- 위에 확인된 서비스 정보와 환불정책만 사실처럼 말하세요.
- 확인되지 않은 결제 승인 상태, 실제 결제 여부, 환불 완료 여부를 임의로 만들어내지 마세요.
- AI가 답할 수 있는 일반적인 이용방법은 이메일로 떠넘기지 말고 직접 설명하세요.
- 결제 방법을 묻는 경우에는 첫 문장을 '결제 방법은 아래 순서대로 진행해 주세요.'로 시작하고 반드시 위의 '실제 결제 방법' 순서대로 안내하세요.
- 결제 방법 답변의 마지막에는 '결제 후 7일 동안 사주 관련 AI 상담을 최대 20회 이용할 수 있으며, 결제·환불·재열람·이용코드·이용방법·서비스 오류 등의 일반 서비스 상담은 횟수 제한 없이 언제든 이용할 수 있습니다.'라는 의미를 반드시 포함하세요.
- 재열람 방법이나 이용코드를 묻는 경우에는 위의 확인된 명운 서비스 정보만 사용하고, 존재하지 않는 메뉴나 절차를 만들어내지 마세요.
- 결제 방법이나 재열람을 안내할 때는 '개인정보 보호 및 보안을 위해 명운에서는 이용코드를 확인하거나 복구해 드릴 수 없으므로, 결제 완료 후 반드시 별도로 저장해 주세요.'라는 의미를 분명히 안내하세요.
- 이용코드 분실에 관해서는 '분실만을 사유로 한 환불은 제한될 수 있습니다'라고 안내하고, 법률상 무조건 환불 불가라고 단정하지 마세요.
- 사주 관련 AI 상담과 일반 서비스 상담을 혼동하지 마세요. 사주 관련 AI 상담은 무료 3회 또는 상세 사주 결제 후 7일간 최대 20회이며, 일반 서비스 상담은 횟수 제한 없이 언제든 이용할 수 있다고 정확히 구분하세요.
- 실제 거래내역 확인, 실제 환불 접수처럼 AI가 확인할 수 없는 경우에만 이메일 문의를 안내하세요.
- 명운에는 로그인 기능이 없으므로 어떠한 경우에도 고객에게 로그인을 요구하거나 로그인 메뉴를 안내하지 마세요.
- 짧고 친절한 한국어 존댓말로 답하세요.
- 별도의 01~05 사주 상담 형식을 사용하지 마세요.
- 마크다운 표는 사용하지 마세요.
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const action = String(body?.action || "chat").trim();
    const question = String(body?.question || "").trim();
    const saju = (body?.saju || null) as Saju | null;
    const targetYear = Number(body?.targetYear || 2026);

    if (
      !saju?.name ||
      !saju?.birth ||
      !saju?.time ||
      !saju?.gender ||
      !saju?.calendar
    ) {
      return NextResponse.json(
        {
          error:
            "AI 상담을 이용하려면 생년월일, 출생시간, 성별, 달력 기준을 모두 입력해주세요.",
        },
        { status: 403 }
      );
    }

    const usageInfo = getAIUsage(req, saju);

    if (action === "status") {
      return NextResponse.json(
        { ok: true, usage: usageInfo.usage },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: "질문을 입력해주세요.", usage: usageInfo.usage },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });
    if (!isMyeongunRelatedQuestion(question)) {
      return NextResponse.json({
        answer:
          "죄송하지만 명운 AI 상담은 사주 상담 및 명운 서비스 이용과 관련된 문의만 답변드릴 수 있습니다.\n\n사주·재물·사업·직업·인간관계·운세 또는 결제·환불·재열람·이용방법 등에 대해 질문해 주세요.",
        usage: usageInfo.usage,
        inquiryType: "other",
      });
    }

    const serviceQuestion = isServiceQuestion(question);

    if (serviceQuestion) {
      const response = await client.responses.create({
        model: "gpt-5.6-luna",
        input: getServicePrompt(question),
      });

      const answer = String(response.output_text || "").trim();

      if (!answer) {
        return NextResponse.json(
          { error: "서비스 안내 답변을 생성하지 못했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          answer,
          usage: usageInfo.usage,
          inquiryType: "service",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (usageInfo.usage.remaining <= 0) {
      return NextResponse.json(
        {
          error: usageInfo.usage.paid
            ? "AI 사주 상담 20회를 모두 사용했습니다. 결제·환불·재열람·이용방법 같은 서비스 문의는 계속 이용할 수 있습니다."
            : "무료 AI 사주 상담 3회를 모두 사용했습니다. 결제·환불·재열람·이용방법 같은 서비스 문의는 계속 이용할 수 있습니다.",
          usage: usageInfo.usage,
          inquiryType: "saju",
        },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    }

    const manseryeok = calculateMyeongunManseryeok({
      birth: saju.birth,
      time: saju.time,
      calendar: saju.calendar,
    });

    const formatHiddenStems = (
      pillar: typeof manseryeok.pillars.year
    ) =>
      pillar.hiddenStems
        .map((item) => `${item.stem}(${item.tenGod})`)
        .join(" · ");

    const prompt = `
당신은 '명운 AI'라는 한국어 사주 상담 서비스의 상담 AI입니다.

현재 서비스 기준 연도는 ${targetYear}년입니다.
사용자가 "올해"라고 말하면 반드시 ${targetYear}년으로 해석하세요.

[사용자 입력 정보]
이름: ${saju.name || "고객"}
생년월일: ${saju.birth}
출생시간: ${saju.time}
성별: ${saju.gender}
달력 기준: ${saju.calendar}

[실제 만세력 계산 결과]
연주: ${manseryeok.pillars.year.pillar}
월주: ${manseryeok.pillars.month.pillar}
일주: ${manseryeok.pillars.day.pillar}
시주: ${manseryeok.pillars.hour?.pillar || "출생시간 미상"}

일간: ${manseryeok.dayMaster.stem}
오행: ${manseryeok.dayMaster.element}
음양: ${manseryeok.dayMaster.yinYang}

오행 분포:
목 ${manseryeok.fiveElements.목}
화 ${manseryeok.fiveElements.화}
토 ${manseryeok.fiveElements.토}
금 ${manseryeok.fiveElements.금}
수 ${manseryeok.fiveElements.수}

신강·신약:
${manseryeok.strength.level}
점수: ${manseryeok.strength.score}
이유: ${manseryeok.strength.reason}

참고용 용신·희신:
용신: ${manseryeok.yongshin?.yongshin || "미산출"}
희신: ${manseryeok.yongshin?.heesin || "미산출"}
이유: ${manseryeok.yongshin?.reason || "참고값 미산출"}

지지 십성:
연지 ${manseryeok.pillars.year.tenGodBranch}
월지 ${manseryeok.pillars.month.tenGodBranch}
일지 ${manseryeok.pillars.day.tenGodBranch}
시지 ${manseryeok.pillars.hour?.tenGodBranch || "출생시간 미상"}

지장간:
연지 ${formatHiddenStems(manseryeok.pillars.year)}
월지 ${formatHiddenStems(manseryeok.pillars.month)}
일지 ${formatHiddenStems(manseryeok.pillars.day)}
시지 ${
      manseryeok.pillars.hour
        ? formatHiddenStems(manseryeok.pillars.hour)
        : "출생시간 미상"
    }

[사용자 질문]
${question}

[답변 원칙]
- 반드시 자연스러운 한국어 존댓말로 답변하세요.
- 위 만세력 계산값을 실제 해석 근거로 사용하세요.
- 일간, 오행, 신강·신약, 십성, 지장간, 참고용 용신·희신을 질문과 연결해 설명하세요.
- 제공되지 않은 대운이나 신살 등을 임의로 만들어내지 마세요.
- 사용자가 "올해"라고 하면 ${targetYear}년 기준으로 설명하세요.
- 미래를 확정적으로 예언하지 마세요.
- 투자 수익, 사업 성공, 취업 성공, 결혼 성사 등을 보장하지 마세요.
- 건강 관련 질문은 질병 진단이나 치료 지시가 아니라 생활관리 관점에서만 답변하세요.
- 법률, 투자, 의료처럼 중요한 의사결정은 사주만으로 단정하지 마세요.
- 사용자의 질문에 먼저 직접 답하고, 그 다음 사주 근거를 설명하세요.
- 지나치게 길지 않게 쓰되 실질적인 도움이 되도록 구체적으로 작성하세요.
- 마크다운 표는 사용하지 마세요.
- 제목 기호 ##, ###는 사용하지 마세요.
- 필요한 경우 짧은 소제목과 번호 목록은 사용할 수 있습니다.

[답변 출력 형식 - 반드시 지킬 것]
아래 5개 제목을 반드시 모두 출력하세요.
제목의 번호, 띄어쓰기, 문구를 임의로 바꾸거나 생략하지 마세요.
각 제목은 반드시 한 줄을 단독으로 사용하세요.
각 제목 아래에 해당 내용을 작성하세요.
5개 제목 외에 별도의 큰 제목은 만들지 마세요.

01 핵심 답변
사용자의 질문에 대한 결론을 먼저 3~5문장으로 직접 답하세요.

02 사주 근거
일간, 오행, 신강·신약, 십성, 지장간, 참고용 용신·희신 중 질문과 관련된 근거를 구체적으로 설명하세요.
근거가 되는 핵심 요소를 3~5개 정도 짧은 목록으로 정리하세요.

03 ${targetYear}년 흐름과 질문 주제 연결
${targetYear}년의 흐름을 사용자의 질문 주제와 연결해 설명하세요.
확정적인 예언이 아니라 가능성, 선택, 준비 방향 중심으로 작성하세요.

04 시기별 또는 상황별 주의점
상반기·하반기 또는 상황별로 주의할 점을 구체적으로 설명하세요.
필요하면 짧은 목록을 사용하세요.

05 지금부터 할 수 있는 실전 조언
사용자가 실제로 적용할 수 있는 행동 조언을 4~6개 제시하세요.
마지막에는 전체 상담 내용을 2~3문장으로 짧게 정리하세요.
`;

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: prompt,
    });

    const answer = String(response.output_text || "").trim();

    if (!answer) {
      return NextResponse.json(
        { error: "AI 상담 답변을 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    const nextUsed = Math.min(
      usageInfo.usage.used + 1,
      usageInfo.usage.limit
    );

    const nextUsage: AIUsageState = {
      ...usageInfo.usage,
      used: nextUsed,
      remaining: Math.max(0, usageInfo.usage.limit - nextUsed),
    };

    const jsonResponse = NextResponse.json(
      {
        answer,
        usage: nextUsage,
        inquiryType: "saju",
        profile: {
          name: saju.name || "",
          birth: saju.birth,
          time: saju.time,
          gender: saju.gender,
          calendar: saju.calendar,
          dayMaster: manseryeok.dayMaster,
          fiveElements: manseryeok.fiveElements,
          strength: manseryeok.strength,
          yongshin: manseryeok.yongshin,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );

    setAIUsageCookie(jsonResponse, usageInfo, nextUsed);

    return jsonResponse;
  } catch (error) {
    console.error("AI 상담 오류:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `AI 상담 중 오류가 발생했습니다: ${error.message}`
            : "AI 상담 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
