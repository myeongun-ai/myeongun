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

[무료 서비스 작성 범위]
- 이 메뉴는 무료 2026년 운세 요약 서비스입니다.
- 사용자가 한 해의 방향을 이해하는 데 충분한 가치를 제공하되, 유료 상세 사주의 재물·직업·관계·장기 방향 분석을 대신할 정도로 모든 세부 내용을 풀어 쓰지 마세요.
- 전체 분량은 약 1,700~2,300자 정도를 목표로 하세요.
- 제공된 만세력에 없는 대운·세운표·월운 데이터를 임의로 만들어 월별 사건이나 특정 시기를 단정하지 마세요.
- 특정 월에 반드시 사건이 생긴다는 식의 예측은 하지 마세요.
- 2026년은 연간 방향, 상·하반기 흐름, 재물·일, 관계·생활, 실천 조언 중심으로 설명하세요.
- 같은 내용을 반복하지 말고 핵심만 명확하게 정리하세요.

[반드시 아래 구조로 작성]

# 명운의 2026년 운세 분석

## 1. 2026년 전체 흐름
2026년의 핵심 기조를 4~5문장으로 설명하세요.
이어 핵심 키워드 3개를 목록으로 정리하세요.

## 2. 상반기 흐름
1월부터 6월까지의 전반적인 분위기와 준비 방향을 3~4문장으로 설명하세요.
특정 월의 사건을 단정하지 마세요.

## 3. 하반기 흐름
7월부터 12월까지의 전반적인 분위기와 선택·정리 방향을 3~4문장으로 설명하세요.
특정 월의 사건을 단정하지 마세요.

## 4. 재물·일의 핵심 포인트
2026년의 돈 관리, 일, 사업 또는 직장생활에서 유의할 핵심을 4~5문장으로 설명하세요.
이어 현실적인 실천 포인트를 3개 목록으로 정리하세요.
투자 수익, 사업 성공, 특정 종목이나 가격을 예측하지 마세요.

## 5. 인간관계·생활 흐름
가족, 연인, 동료, 거래 관계의 소통과 생활 리듬을 3~4문장으로 설명하세요.
건강은 진단하지 말고 수면, 체력, 스트레스, 생활습관 관리 관점에서만 간단히 언급하세요.

## 6. 2026년 실천 전략
올해 실제 생활에 적용할 수 있는 행동 전략을 3가지 번호 목록으로 제시하세요.
각 전략은 구체적이고 현실적으로 작성하세요.

## 종합 정리
2026년의 전체 방향과 가장 중요한 주의점을 2~3문장으로 정리하세요.

마지막에는 광고처럼 과장하지 말고,
"재물·직업·관계와 장기 방향을 함께 보는 더 깊은 개인 분석은 상세 사주에서 확인할 수 있습니다."
라는 취지로 자연스럽게 안내하세요.
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