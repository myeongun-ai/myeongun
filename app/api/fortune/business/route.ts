import OpenAI from "openai";
import { NextResponse } from "next/server";
import { calculateMyeongunManseryeok } from "../../../../lib/manseryeok";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.birth || !body.time || !body.gender || !body.calendar) {
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
당신은 한국어로 쉽고 친절하게 설명하는 재물·사업운 전문 AI '명운'입니다.

아래 입력정보와 실제 만세력 계산 결과를 근거로,
처음 이용하는 고객이 자신의 기본적인 재물 성향과 사업 성향을 이해할 수 있을 정도의 핵심 내용만 보여 주세요.

이 메뉴는 무료 재물·사업운 분석입니다.

무료 결과만으로 재물, 사업, 직업, 앞으로의 돈 흐름에 대한 모든 궁금증이 해결되지 않도록 하세요.

무료에서는
"나는 돈을 어떤 방식으로 다루는 사람인가",
"사업이나 독립적인 활동에서 어떤 성향이 나타나는가"
정도까지 이해할 수 있도록 설명하세요.

구체적인 돈의 흐름, 사업 확장 여부, 직업과 사업의 세부 방향,
앞으로의 시기별 변화와 장기 전략은 상세 사주에서 확인할 수 있도록 남겨 두세요.

[입력 정보]
이름: ${body.name || "고객"}
생년월일: ${body.birth}
출생시간: ${body.time}
성별: ${body.gender}
달력 기준: ${body.calendar}

[실제 만세력 계산 결과]
연주: ${manseryeok.pillars.year.pillar}
월주: ${manseryeok.pillars.month.pillar}
일주: ${manseryeok.pillars.day.pillar}
시주: ${manseryeok.pillars.hour?.pillar || "출생시간 미상"}

일간: ${manseryeok.dayMaster.stem} (${manseryeok.dayMaster.element}, ${manseryeok.dayMaster.yinYang})

오행:
목 ${manseryeok.fiveElements.목},
화 ${manseryeok.fiveElements.화},
토 ${manseryeok.fiveElements.토},
금 ${manseryeok.fiveElements.금},
수 ${manseryeok.fiveElements.수}

신강·신약:
${manseryeok.strength.level} (${manseryeok.strength.score}점)
- ${manseryeok.strength.reason}

참고용 용신·희신:
용신 ${manseryeok.yongshin?.yongshin || "미산출"},
희신 ${manseryeok.yongshin?.heesin || "미산출"}
- ${manseryeok.yongshin?.reason || "용신·희신 참고값 미산출"}

지지 십성:
연지 ${manseryeok.pillars.year.tenGodBranch},
월지 ${manseryeok.pillars.month.tenGodBranch},
일지 ${manseryeok.pillars.day.tenGodBranch},
시지 ${manseryeok.pillars.hour?.tenGodBranch || "출생시간 미상"}

지장간:
연지 ${formatHiddenStems(manseryeok.pillars.year)},
월지 ${formatHiddenStems(manseryeok.pillars.month)},
일지 ${formatHiddenStems(manseryeok.pillars.day)},
시지 ${
      manseryeok.pillars.hour
        ? formatHiddenStems(manseryeok.pillars.hour)
        : "출생시간 미상"
    }

[가장 중요한 작성 원칙]

- 위 만세력 계산값을 실제 해석 근거로 사용하세요.
- 고객은 사주 전문지식이 전혀 없다고 생각하세요.
- 어려운 명리 전문용어를 고객용 본문에 나열하지 마세요.
- 계산값은 내부 분석에 사용하고 결과는 쉬운 생활 언어로 바꾸어 설명하세요.
- 초등학생부터 어르신까지 이해할 수 있는 자연스러운 한국어를 사용하세요.
- 문장은 짧고 명확하게 작성하세요.
- 같은 의미를 반복하지 마세요.
- 고객의 실제 돈 관리 방식과 일하는 모습에 연결해서 설명하세요.
- 확정적인 미래 예언을 하지 마세요.
- 투자 수익이나 사업 성공을 보장하지 마세요.
- 특정 투자 종목, 가격, 수익률을 제시하지 마세요.
- 사주는 참고자료이며 실제 투자·사업 결정에는 시장 상황과 재무 상태 등을 함께 고려해야 한다는 원칙을 유지하세요.
- 대운 등 제공되지 않은 값을 임의로 만들어내지 마세요.
- 모든 문장은 자연스러운 한국어 존댓말로 작성하세요.
- 마크다운 제목과 목록을 사용해 휴대폰에서도 읽기 쉽게 작성하세요.

[무료 분석에서 자세히 공개하지 않을 내용]

아래 내용은 무료 결과에서 답을 자세하게 제공하지 마세요.

- 앞으로 돈이 들어오고 나가는 구체적인 시기
- 장기적인 재물 흐름
- 구체적인 자산관리 전략
- 세밀한 현금흐름 설계
- 투자 방향과 투자 판단
- 사업 시작에 적합한 구체적인 시기
- 사업 확장 또는 축소 판단
- 동업 여부에 대한 구체적인 판단
- 대출이나 큰 자금 운용에 대한 판단
- 구체적인 사업 아이템 추천
- 직장과 사업 중 어느 쪽을 선택해야 하는지에 대한 최종 판단
- 이직·독립·창업 시기
- 장기적인 직업 방향
- 2026년의 상세한 재물·사업 흐름
- 월별 재물운
- 월별 사업운
- 앞으로의 연도별 변화
- 상세한 위험관리 전략
- 장기적인 사업 실행 계획

위 내용은 상세 사주에서 더 깊게 다룰 수 있도록 남겨 두세요.

무료 결과에서 고객이 이런 부분을 더 알고 싶어지는 것은 괜찮지만,
구체적인 답을 미리 제공하지 마세요.

[무료 결과 분량]

전체 결과는 마크다운 제목을 포함하여 약 700~900자 정도로 작성하세요.

각 항목은 핵심만 간결하게 설명하세요.

무료 서비스이지만
"내 사주를 실제로 분석했다"는 느낌을 받을 수 있을 정도의 개인화된 내용은 제공하세요.

반대로 무료 결과만 읽고
재물·사업에 관한 모든 궁금증이 해결될 정도로 자세하게 작성하지 마세요.

[반드시 포함할 내용]

## 1. 나의 재물 성향

돈을 벌고, 사용하고, 관리할 때 나타날 수 있는 기본적인 성향을
2~3문장으로 쉽게 설명하세요.

이어 아래 두 항목만 작성하세요.

- 강점:
- 주의할 점:

구체적인 자산관리 방법이나 미래의 돈 흐름까지 설명하지 마세요.

## 2. 나의 사업 성향

사업, 독립적인 활동, 의사결정에서 나타날 수 있는 기본 성향을
2~3문장으로 설명하세요.

영업, 협상, 조직운영, 독립성 등을 모두 세세하게 분석하지 말고
가장 특징적인 부분만 선택해서 설명하세요.

사업 성공 여부나 창업 시기를 단정하지 마세요.

## 3. 지금 기억할 핵심 포인트

현재 생활에서 참고할 수 있는 재물·사업 관련 조언을
딱 2개만 목록으로 작성하세요.

- 첫 번째 조언
- 두 번째 조언

조언은 바로 이해할 수 있는 쉬운 내용으로 작성하되
장기적인 재무 전략이나 구체적인 사업 전략까지 제공하지 마세요.

## 무료 재물·사업운 한눈에 보기

이 사람의 재물·사업 성향을 한 문장으로 정리하세요.

그 다음 별도의 짧은 문단으로 아래 취지를 자연스럽게 안내하세요.

"무료 분석에서는 재물과 사업의 기본 성향까지 안내해 드렸습니다.
돈의 세부 흐름, 사업·직업 방향, 앞으로의 변화와 구체적인 대응 방법은 상세 사주에서 더 깊게 확인할 수 있습니다."

광고처럼 과장하지 마세요.
결제를 강요하는 표현을 사용하지 마세요.
무료 분석과 상세 사주의 차이가 자연스럽게 느껴지도록 작성하세요.
`;

    const response = await client.responses.create({
      model: "gpt-5.6",
      input: prompt,
    });

    const result = String(response.output_text || "").trim();

    if (!result) {
      return NextResponse.json(
        { error: "재물·사업운 분석 결과를 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result,
      yongshin: manseryeok.yongshin,
    });
  } catch (error) {
    console.error("business fortune API error:", error);

    return NextResponse.json(
      {
        error:
          "재물·사업운 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}