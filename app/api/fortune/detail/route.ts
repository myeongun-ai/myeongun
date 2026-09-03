import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  entitlementCookie,
  hashSaju,
  verifyEntitlement,
  type SajuAccessInput,
} from "../../../../lib/paymentAccess";
import { calculateMyeongunManseryeok } from "../../../../lib/manseryeok";

type PremiumSection = {
  title: string;
  summary: string;
  points: string[];
  advice: string;
};

type PremiumResult = {
  headline: string;
  overview: string;
  strengths: string[];
  cautions: string[];
  opportunity: string;
  sections: PremiumSection[];
  actionPlan: string[];
  disclaimer: string;
};

function extractJson(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");

  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1));
  }

  throw new Error("AI 응답을 JSON으로 해석할 수 없습니다.");
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string")
  );
}

function isValidResult(value: unknown): value is PremiumResult {
  if (!value || typeof value !== "object") return false;

  const result = value as Partial<PremiumResult>;

  return Boolean(
    typeof result.headline === "string" &&
      typeof result.overview === "string" &&
      isStringArray(result.strengths) &&
      isStringArray(result.cautions) &&
      typeof result.opportunity === "string" &&
      Array.isArray(result.sections) &&
      result.sections.length === 8 &&
      result.sections.every(
        (section) =>
          section &&
          typeof section.title === "string" &&
          typeof section.summary === "string" &&
          isStringArray(section.points) &&
          typeof section.advice === "string"
      ) &&
      isStringArray(result.actionPlan) &&
      typeof result.disclaimer === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saju = (body?.saju || null) as SajuAccessInput | null;

    if (
      !saju?.name ||
      !saju?.birth ||
      !saju?.time ||
      !saju?.gender ||
      !saju?.calendar
    ) {
      return NextResponse.json(
        { error: "상세 분석에 필요한 사주 정보가 부족합니다." },
        { status: 400 }
      );
    }

    const token = request.cookies.get(entitlementCookie.name)?.value;
    const entitlement = verifyEntitlement(token);

    if (!entitlement) {
      return NextResponse.json(
        { error: "유효한 상세 사주 이용권이 없습니다." },
        { status: 401 }
      );
    }

    if (entitlement.sajuHash !== hashSaju(saju)) {
      return NextResponse.json(
        { error: "결제한 사주 정보와 현재 사주 정보가 일치하지 않습니다." },
        { status: 403 }
      );
    }

    const manseryeok = calculateMyeongunManseryeok({ birth: saju.birth, time: saju.time, calendar: saju.calendar });

    const formatHiddenStems = (pillar: typeof manseryeok.pillars.year) => pillar.hiddenStems.map((item) => `${item.stem}(${item.tenGod})`).join(" · ");

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const prompt = `
당신은 한국어로 설명하는 프리미엄 사주 해석 AI입니다.
아래 고객 정보를 바탕으로 9,900원 유료 상품에 적합한 깊이와 구체성을 가진 상세 분석을 작성하세요.

[고객 정보]
이름: ${saju.name}
생년월일: ${saju.birth}
출생시간: ${saju.time}
성별: ${saju.gender}
달력 기준: ${saju.calendar}

[실제 만세력 계산 결과]
연주: ${manseryeok.pillars.year.pillar}
월주: ${manseryeok.pillars.month.pillar}
일주: ${manseryeok.pillars.day.pillar}
시주: ${manseryeok.pillars.hour?.pillar || "출생시간 미상"}
일간: ${manseryeok.dayMaster.stem} (${manseryeok.dayMaster.element}, ${manseryeok.dayMaster.yinYang})
천간 십성: 연간 ${manseryeok.pillars.year.tenGodStem}, 월간 ${manseryeok.pillars.month.tenGodStem}, 일간 ${manseryeok.pillars.day.tenGodStem}, 시간 ${manseryeok.pillars.hour?.tenGodStem || "미상"}
지지 십성: 연지 ${manseryeok.pillars.year.tenGodBranch}, 월지 ${manseryeok.pillars.month.tenGodBranch}, 일지 ${manseryeok.pillars.day.tenGodBranch}, 시지 ${manseryeok.pillars.hour?.tenGodBranch || "출생시간 미상"}
지장간: 연지 ${formatHiddenStems(manseryeok.pillars.year)}, 월지 ${formatHiddenStems(manseryeok.pillars.month)}, 일지 ${formatHiddenStems(manseryeok.pillars.day)}, 시지 ${manseryeok.pillars.hour ? formatHiddenStems(manseryeok.pillars.hour) : "출생시간 미상"}
오행: 목 ${manseryeok.fiveElements.목}, 화 ${manseryeok.fiveElements.화}, 토 ${manseryeok.fiveElements.토}, 금 ${manseryeok.fiveElements.금}, 수 ${manseryeok.fiveElements.수}
신강·신약: ${manseryeok.strength.level} (${manseryeok.strength.score}점) - ${manseryeok.strength.reason}
참고용 용신·희신: 용신 ${manseryeok.yongshin?.yongshin || "미산출"}, 희신 ${manseryeok.yongshin?.heesin || "미산출"} - ${manseryeok.yongshin?.reason || "용신·희신 참고값 미산출"}

[매우 중요한 해석 원칙]
1. 위 연주·월주·일주·시주, 일간, 오행, 천간 십성, 지지 십성, 지장간 값은 만세력 계산 엔진으로 산출된 값이므로 상세 해석의 근거로 사용하세요.
2. 신강·신약과 용신·희신은 위 만세력 계산 엔진에서 산출한 참고값을 그대로 상세 해석에 사용하세요. 용신·희신은 전통 명리의 절대적인 확정 판정이 아니라 명운 엔진의 참고용 분석값으로 표현하세요. 대운 등 현재 제공되지 않은 값은 임의로 계산하거나 만들어내지 마세요.
3. 입력 정보와 전통 명리 해석의 일반적 관점을 참고한 AI 분석임을 유지하세요.
4. 확정적인 예언, 공포를 유발하는 표현, 수명·사고·질병의 단정은 하지 마세요.
5. 재물·사업·직업 분석은 현실적인 행동 조언과 함께 설명하세요.
6. 투자 수익, 사업 성공, 재산 증가를 보장하지 마세요.
7. 건강은 질병 진단이 아니라 생활 습관과 자기관리 관점으로만 표현하세요.
8. 인간관계와 애정운은 상대방의 행동이나 미래를 확정적으로 단정하지 마세요.
9. 2026년과 장기 흐름은 "가능성", "경향", "준비할 점", "활용 방향" 중심으로 설명하세요.
10. 고객이 읽었을 때 각 섹션이 서로 다른 내용을 제공하도록 반복 표현을 최소화하세요.
11. 지나치게 추상적인 문장보다 실제 생활에서 적용할 수 있는 구체적인 조언을 우선하세요.
12. 모든 문장은 자연스럽고 신뢰감 있는 한국어 존댓말로 작성하세요.

[분석 구성]
- headline: 고객의 전체 흐름을 압축한 한 문장
- overview: 전체 성향과 현재부터 앞으로의 흐름을 연결한 종합 분석
- strengths: 활용하기 좋은 강점 4개
- cautions: 주의하거나 보완할 점 3~4개
- opportunity: 앞으로 활용하면 좋은 핵심 기회와 방향
- sections: 반드시 아래 8개 항목을 이 순서대로 작성
  1. 성향과 기질
  2. 재물운
  3. 사업운
  4. 직업운
  5. 인간관계와 애정운
  6. 생활과 건강 관리
  7. 2026년 운세
  8. 향후 장기 흐름
- actionPlan: 지금부터 실천할 수 있는 구체적인 행동 4~5개
- disclaimer: 참고용 AI 명리 분석이라는 안내

[섹션 작성 기준]
각 section은 다음 기준을 따르세요.
- summary: 4~7문장. 해당 주제를 충분히 설명하세요.
- points: 서로 겹치지 않는 구체적인 핵심 포인트 4개.
- advice: 실제로 적용할 수 있는 조언 2~4문장.

특히 다음을 반영하세요.
- 재물운: 돈을 다루는 태도, 지출·저축·투자 의사결정 시 유의점, 안정성과 확장성의 균형
- 사업운: 독립성, 의사결정, 거래·협업, 확장 시 주의점, 현금흐름과 위험관리
- 직업운: 잘 맞을 가능성이 있는 업무 방식, 역할, 조직생활과 독립활동의 균형
- 인간관계와 애정운: 관계 형성 방식, 갈등 시 주의점, 소통 방식
- 생활과 건강 관리: 수면, 운동, 휴식, 스트레스 관리 등 일반적인 생활관리
- 2026년 운세: 상반기·하반기 흐름, 재물·사업, 관계·생활 측면의 준비 포인트
- 향후 장기 흐름: 1~2년, 3~5년, 5~10년의 방향과 장기적으로 쌓아야 할 자산·역량

반드시 아래 JSON 구조 하나만 반환하세요.
마크다운, 설명문, 코드블록은 사용하지 마세요.

{
  "headline": "전체 흐름을 압축한 한 문장",
  "overview": "종합 분석 5~8문장",
  "strengths": ["강점 1", "강점 2", "강점 3", "강점 4"],
  "cautions": ["주의점 1", "주의점 2", "주의점 3", "주의점 4"],
  "opportunity": "앞으로 활용하면 좋은 핵심 기회와 방향 3~5문장",
  "sections": [
    {
      "title": "성향과 기질",
      "summary": "4~7문장",
      "points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3", "핵심 포인트 4"],
      "advice": "실행 조언 2~4문장"
    },
    {
      "title": "재물운",
      "summary": "4~7문장",
      "points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3", "핵심 포인트 4"],
      "advice": "실행 조언 2~4문장"
    },
    {
      "title": "사업운",
      "summary": "4~7문장",
      "points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3", "핵심 포인트 4"],
      "advice": "실행 조언 2~4문장"
    },
    {
      "title": "직업운",
      "summary": "4~7문장",
      "points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3", "핵심 포인트 4"],
      "advice": "실행 조언 2~4문장"
    },
    {
      "title": "인간관계와 애정운",
      "summary": "4~7문장",
      "points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3", "핵심 포인트 4"],
      "advice": "실행 조언 2~4문장"
    },
    {
      "title": "생활과 건강 관리",
      "summary": "4~7문장",
      "points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3", "핵심 포인트 4"],
      "advice": "생활관리 조언 2~4문장"
    },
    {
      "title": "2026년 운세",
      "summary": "5~8문장",
      "points": ["상반기 흐름", "하반기 흐름", "재물·사업 포인트", "관계·생활 포인트"],
      "advice": "2026년 실행 조언 2~4문장"
    },
    {
      "title": "향후 장기 흐름",
      "summary": "5~8문장",
      "points": ["1~2년", "3~5년", "5~10년", "장기적으로 쌓을 자산과 역량"],
      "advice": "장기 실행 조언 2~4문장"
    }
  ],
  "actionPlan": ["실천 1", "실천 2", "실천 3", "실천 4", "실천 5"],
  "disclaimer": "본 내용은 입력 정보를 바탕으로 전통 명리 관점을 참고해 생성한 AI 분석이며, 중요한 재정·의료·법률·인생 의사결정은 실제 정보와 관련 전문가의 조언을 함께 고려해 주세요."
}
`;

    const response = await client.responses.create({
      model: "gpt-5.6",
      input: prompt,
    });

    const parsed = extractJson(response.output_text);

    if (!isValidResult(parsed)) {
      throw new Error("상세 분석 응답 형식이 올바르지 않습니다.");
    }

    return NextResponse.json(
      {
        ok: true,
        result: parsed,
        expiresAt: entitlement.exp,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("premium fortune detail API error:", error);

    return NextResponse.json(
      {
        error:
          "상세 사주 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
