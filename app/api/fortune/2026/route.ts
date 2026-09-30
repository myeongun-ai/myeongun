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

아래 실제 만세력 계산 결과를 기준으로 사용자의 2026년 운세를 쉽고 현실적인 한국어로 분석하세요.

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
- 2026년은 확정적인 미래 예언이 아니라 전통 명리 관점에서 볼 수 있는 가능성과 방향으로 설명하세요.
- 재물, 투자, 사업 성공을 보장하거나 특정 결과를 단정하지 마세요.
- 건강은 질병 진단이나 예측이 아니라 수면, 체력, 스트레스, 생활습관 관리 관점에서만 간단히 다루세요.
- 과도하게 불안감을 주는 표현이나 사고·질병·수명에 대한 단정적인 예언은 금지합니다.
- 모든 문장은 자연스러운 존댓말로 작성하세요.
- 사용자가 사주 용어를 몰라도 바로 이해할 수 있는 쉬운 한국어를 사용하세요.
- 비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인 등의 전문 용어를 설명 없이 나열하지 마세요.
- 전문 용어가 꼭 필요하면 먼저 일상적인 의미로 쉽게 설명하세요.
- 오행과 용신·희신도 결과를 그대로 나열하기보다 실제 생활에서 어떤 성향과 균형을 뜻하는지 쉽게 풀어 설명하세요.
- 계산 과정 자체를 길게 설명하지 말고 사용자가 생활에서 이해할 수 있는 의미를 중심으로 작성하세요.
- 마크다운 제목 형식을 정확히 지켜 주세요.

[무료 서비스 작성 범위]
- 이 메뉴는 무료 2026년 운세 요약 서비스입니다.
- 무료 분석만 읽어도 사용자가 자신의 2026년 기본 방향과 주의점을 이해할 수 있어야 합니다.
- 다만 유료 상세 사주 분석을 대신할 정도로 재물·직업·관계와 미래 흐름을 모두 자세히 풀어 쓰지 마세요.
- 전체 분량은 약 800~1,000자를 목표로 하세요.
- 같은 의미를 반복하거나 불필요하게 길게 설명하지 마세요.
- 2026년의 전체적인 방향, 재물·일의 핵심 방향, 관계·생활의 핵심 방향, 지금 기억할 행동을 중심으로 설명하세요.

[무료 분석에서 자세히 다루지 않을 내용]
다음 내용은 무료 분석에서 구체적으로 풀어 쓰지 마세요.
- 월별 운세 또는 특정 월의 사건 예측
- 상반기와 하반기의 세부 변화 시기
- 구체적인 재물 증가·감소 시기
- 투자, 자산 운용, 대출, 큰돈 사용에 대한 세부 전략
- 사업 시작·확장·축소의 구체적인 판단
- 직장 이동, 이직, 승진, 퇴사의 구체적인 시기나 결론
- 특정 직업이나 사업 아이템 추천
- 연애, 결혼, 가족관계의 구체적인 변화 시기
- 장기적인 재물·직업·관계 흐름
- 개인 상황별 세부 실행 전략

위 내용을 질문받은 것처럼 미리 자세히 제공하지 말고,
무료 분석에서는 2026년의 핵심적인 방향과 주의점까지만 안내하세요.

[반드시 아래 구조로 작성]

# 명운의 2026년 무료 운세

## 1. 2026년 전체 방향
2026년에 사용자가 가장 중요하게 기억해야 할 전체적인 흐름을
쉽고 현실적인 표현으로 3~4문장 작성하세요.

이어 아래 형식으로 핵심 키워드 3개를 짧게 작성하세요.

- 핵심 1:
- 핵심 2:
- 핵심 3:

## 2. 재물·일의 핵심
돈 관리, 직장생활 또는 사업에서 기억해야 할 기본 방향을
3~4문장으로 설명하세요.
구체적인 투자 전략, 사업 시기, 이직 시기나 성공 여부까지 자세히 설명하지 마세요.

## 3. 관계·생활의 핵심
가족, 연인, 동료, 거래 관계에서의 기본적인 소통 방향과
생활 리듬에서 주의할 점을 3~4문장으로 설명하세요.
건강은 생활습관 관리 수준에서만 간단히 언급하세요.

## 4. 올해 기억할 두 가지
2026년에 실제 생활에서 기억하면 좋은 행동을 정확히 2개만 작성하세요.

1.
2.

## 무료 2026 운세 한눈에 보기
2026년의 가장 중요한 방향과 주의점을 2~3문장으로 간결하게 정리하세요.

마지막에는 광고처럼 과장하거나 결제를 강요하지 말고,
무료 운세에서는 2026년의 기본 방향과 핵심 주의점을 확인할 수 있으며,
재물·직업·관계와 앞으로의 흐름을 더 깊게 보는 개인 분석은
상세 사주 분석에서 확인할 수 있다는 취지로 자연스럽게 안내하세요.
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