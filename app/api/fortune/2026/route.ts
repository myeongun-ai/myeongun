import OpenAI from "openai";
import { NextResponse } from "next/server";
import { calculateMyeongunManseryeok } from "../../../../lib/manseryeok";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (
      !body.name ||
      !body.birth ||
      !body.time ||
      !body.gender ||
      !body.calendar
    ) {
      return NextResponse.json(
        { error: "필수 정보를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    const manseryeok = calculateMyeongunManseryeok({
      birth: body.birth,
      time: body.time,
      calendar: body.calendar,
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
        {
          error:
            "OPENAI_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해 주세요.",
        },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    const prompt = `
당신은 한국어로 설명하는 명리 기반 AI 운세 분석 서비스 '명운'입니다.

아래 실제 만세력 계산 결과를 기준으로 사용자의 2026년 운세를 자세하고 현실적으로 분석하세요.

[입력 정보]
이름: ${body.name}
생년월일: ${body.birth}
출생시간: ${body.time}
성별: ${body.gender}
달력 기준: ${body.calendar}

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

[중요 원칙]
- 위 만세력 계산값은 명운 엔진에서 산출된 실제 기준값입니다.
- 연주·월주·일주·시주, 일간, 오행, 신강·신약, 용신·희신, 십성, 지장간을 해석의 근거로 사용하세요.
- 제공되지 않은 대운, 세운표, 신살 등을 임의로 만들어내지 마세요.
- 2026년은 확정적인 미래 예언이 아니라 전통 명리 관점의 가능성과 흐름으로 설명하세요.
- 재물, 투자, 사업 성공을 보장하지 마세요.
- 건강은 질병 진단이 아니라 생활습관과 자기관리 관점으로만 설명하세요.
- 모든 문장은 자연스러운 존댓말로 작성하세요.
- 사용자가 실제 생활에서 활용할 수 있는 구체적인 행동 조언을 포함하세요.
- 과도하게 불안감을 주는 표현이나 단정적인 사고·질병·수명 예언은 금지합니다.
- 마크다운 제목 형식을 정확히 지켜 주세요.

[반드시 아래 구조로 작성]

# 명운의 2026년 운세 분석

## 1. 2026년 전체 흐름
2026년 전반의 핵심 기조를 5~7문장으로 설명하세요.
이어 핵심 키워드 4~5개를 목록으로 정리하세요.

## 2. 상반기 운세
1월부터 6월까지의 흐름을 설명하세요.
재물, 일, 사업, 인간관계에서 어떤 준비가 필요한지 구체적으로 설명하세요.

## 3. 하반기 운세
7월부터 12월까지의 흐름을 설명하세요.
변화, 확장, 정리, 선택의 시점을 현실적인 관점에서 설명하세요.

## 4. 재물·사업운
2026년의 수입, 지출, 사업 기회, 투자 판단, 확장 시 주의점을 설명하세요.
실천 포인트를 4개 정도 목록으로 정리하세요.

## 5. 직업·일운
직장생활, 독립활동, 책임 증가, 역할 변화 가능성을 설명하세요.
현실적인 전략을 포함하세요.

## 6. 인간관계·연애운
가족, 연인, 동료, 거래 관계에서의 흐름과 소통 주의점을 설명하세요.
관계를 더 좋게 만드는 방법을 포함하세요.

## 7. 건강·생활 관리
건강을 진단하지 말고 생활습관, 수면, 체력관리, 스트레스 관리 관점에서 설명하세요.

## 8. 2026년 월별 흐름

### 1월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 2월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 3월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 4월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 5월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 6월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 7월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 8월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 9월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 10월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 11월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

### 12월
핵심 흐름과 행동 조언을 2~3문장으로 작성하세요.

## 9. 2026년 실천 전략
지금부터 실제로 적용할 수 있는 행동 전략 5가지를 번호 목록으로 제시하세요.

## 종합 정리
2026년의 전체 흐름을 3~4문장으로 정리하고,
사용자가 가장 기억해야 할 핵심 한 가지를 마지막 문장에 강조해서 적어 주세요.
`;

    const response = await client.responses.create({
      model: "gpt-5.6",
      input: prompt,
    });

    const result = String(response.output_text || "").trim();

    if (!result) {
      return NextResponse.json(
        { error: "2026년 운세 결과를 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result,
      profile: {
        name: body.name,
        birth: body.birth,
        time: body.time,
        gender: body.gender,
        calendar: body.calendar,
        dayMaster: manseryeok.dayMaster,
        fiveElements: manseryeok.fiveElements,
        strength: manseryeok.strength,
        yongshin: manseryeok.yongshin,
      },
    });
  } catch (error) {
    console.error("2026 fortune API error:", error);

    return NextResponse.json(
      {
        error:
          "2026년 운세 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}