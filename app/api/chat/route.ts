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

    if (usageInfo.usage.remaining <= 0) {
      return NextResponse.json(
        {
          error: usageInfo.usage.paid
            ? "상세 사주 이용 혜택으로 제공되는 AI 상담 20회를 모두 사용했습니다."
            : "무료 AI 상담 3회를 모두 사용했습니다.",
          usage: usageInfo.usage,
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

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

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