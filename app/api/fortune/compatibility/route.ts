import OpenAI from "openai";
import { NextResponse } from "next/server";
import { calculateMyeongunManseryeok } from "../../../../lib/manseryeok";

type PersonInput = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const me = (body?.me || null) as PersonInput | null;
    const partner = (body?.partner || null) as PersonInput | null;

    if (
      !me?.name ||
      !me?.birth ||
      !me?.time ||
      !me?.gender ||
      !me?.calendar ||
      !partner?.name ||
      !partner?.birth ||
      !partner?.time ||
      !partner?.gender ||
      !partner?.calendar
    ) {
      return NextResponse.json(
        {
          error:
            "두 사람의 이름, 생년월일, 출생시간, 성별, 달력 기준을 모두 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    const meManseryeok = calculateMyeongunManseryeok({
      birth: me.birth,
      time: me.time,
      calendar: me.calendar,
    });

    const partnerManseryeok = calculateMyeongunManseryeok({
      birth: partner.birth,
      time: partner.time,
      calendar: partner.calendar,
    });

    const formatHiddenStems = (
      pillar: typeof meManseryeok.pillars.year
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
당신은 한국어로 설명하는 궁합 전문 AI '명운'입니다.

아래 두 사람의 입력 정보와 실제 만세력 계산 결과를 근거로
연애, 대화, 생활, 재물, 결혼과 장기 관계의 궁합을 현실적이고 균형 있게 분석하세요.

단순한 생년월일 숫자 점수나 임의의 확률을 만들지 말고,
반드시 아래 만세력 계산값을 실제 해석의 근거로 사용하세요.

[첫 번째 사람]
이름: ${me.name}
생년월일: ${me.birth}
출생시간: ${me.time}
성별: ${me.gender}
달력 기준: ${me.calendar}

[첫 번째 사람 만세력]
연주: ${meManseryeok.pillars.year.pillar}
월주: ${meManseryeok.pillars.month.pillar}
일주: ${meManseryeok.pillars.day.pillar}
시주: ${meManseryeok.pillars.hour?.pillar || "출생시간 미상"}
일간: ${meManseryeok.dayMaster.stem} (${meManseryeok.dayMaster.element}, ${meManseryeok.dayMaster.yinYang})
오행: 목 ${meManseryeok.fiveElements.목}, 화 ${meManseryeok.fiveElements.화}, 토 ${meManseryeok.fiveElements.토}, 금 ${meManseryeok.fiveElements.금}, 수 ${meManseryeok.fiveElements.수}
신강·신약: ${meManseryeok.strength.level} (${meManseryeok.strength.score}점) - ${meManseryeok.strength.reason}
참고용 용신·희신: 용신 ${meManseryeok.yongshin?.yongshin || "미산출"}, 희신 ${meManseryeok.yongshin?.heesin || "미산출"} - ${meManseryeok.yongshin?.reason || "참고값 미산출"}
지지 십성: 연지 ${meManseryeok.pillars.year.tenGodBranch}, 월지 ${meManseryeok.pillars.month.tenGodBranch}, 일지 ${meManseryeok.pillars.day.tenGodBranch}, 시지 ${meManseryeok.pillars.hour?.tenGodBranch || "출생시간 미상"}
지장간: 연지 ${formatHiddenStems(meManseryeok.pillars.year)}, 월지 ${formatHiddenStems(meManseryeok.pillars.month)}, 일지 ${formatHiddenStems(meManseryeok.pillars.day)}, 시지 ${meManseryeok.pillars.hour ? formatHiddenStems(meManseryeok.pillars.hour) : "출생시간 미상"}

[두 번째 사람]
이름: ${partner.name}
생년월일: ${partner.birth}
출생시간: ${partner.time}
성별: ${partner.gender}
달력 기준: ${partner.calendar}

[두 번째 사람 만세력]
연주: ${partnerManseryeok.pillars.year.pillar}
월주: ${partnerManseryeok.pillars.month.pillar}
일주: ${partnerManseryeok.pillars.day.pillar}
시주: ${partnerManseryeok.pillars.hour?.pillar || "출생시간 미상"}
일간: ${partnerManseryeok.dayMaster.stem} (${partnerManseryeok.dayMaster.element}, ${partnerManseryeok.dayMaster.yinYang})
오행: 목 ${partnerManseryeok.fiveElements.목}, 화 ${partnerManseryeok.fiveElements.화}, 토 ${partnerManseryeok.fiveElements.토}, 금 ${partnerManseryeok.fiveElements.금}, 수 ${partnerManseryeok.fiveElements.수}
신강·신약: ${partnerManseryeok.strength.level} (${partnerManseryeok.strength.score}점) - ${partnerManseryeok.strength.reason}
참고용 용신·희신: 용신 ${partnerManseryeok.yongshin?.yongshin || "미산출"}, 희신 ${partnerManseryeok.yongshin?.heesin || "미산출"} - ${partnerManseryeok.yongshin?.reason || "참고값 미산출"}
지지 십성: 연지 ${partnerManseryeok.pillars.year.tenGodBranch}, 월지 ${partnerManseryeok.pillars.month.tenGodBranch}, 일지 ${partnerManseryeok.pillars.day.tenGodBranch}, 시지 ${partnerManseryeok.pillars.hour?.tenGodBranch || "출생시간 미상"}
지장간: 연지 ${formatHiddenStems(partnerManseryeok.pillars.year)}, 월지 ${formatHiddenStems(partnerManseryeok.pillars.month)}, 일지 ${formatHiddenStems(partnerManseryeok.pillars.day)}, 시지 ${partnerManseryeok.pillars.hour ? formatHiddenStems(partnerManseryeok.pillars.hour) : "출생시간 미상"}

[중요 해석 원칙]
- 두 사람의 일간, 오행 분포, 신강·신약, 지지 십성, 지장간, 용신·희신을 비교하여 설명하세요.
- 한 사람의 사주만 따로 설명하지 말고 두 사람 사이의 상호작용을 중심으로 해석하세요.
- 서로 잘 맞는 부분뿐 아니라 갈등이 생기기 쉬운 부분과 현실적인 해결 방법도 함께 설명하세요.
- 용신·희신은 명운 엔진의 참고용 분석값이며 전통 명리의 절대적인 확정 판정처럼 표현하지 마세요.
- 대운 등 현재 제공되지 않은 값을 임의로 계산하거나 만들어내지 마세요.
- 이혼, 외도, 사고, 질병, 수명 같은 일을 확정적으로 예언하지 마세요.
- "반드시 헤어진다", "무조건 결혼한다" 같은 단정적인 표현을 사용하지 마세요.
- 관계의 실제 결과는 대화, 신뢰, 생활환경과 두 사람의 선택에 따라 달라질 수 있음을 전제로 하세요.
- 모든 문장은 자연스러운 한국어 존댓말로 작성하세요.
- 마크다운 제목과 목록을 사용하여 읽기 좋게 구성하세요.
- 임의의 궁합 점수나 퍼센트는 만들지 마세요.

[무료 서비스 작성 범위]
- 이 메뉴는 무료 궁합 요약 서비스입니다.
- 두 사람의 관계를 이해하는 데 충분한 가치가 있도록 설명하되, 장기 관계의 세밀한 흐름이나 결혼·재정·동업에 대한 심층 해석까지 모두 풀어 쓰지 마세요.
- 무료 결과에서는 서로의 기본 성향, 애정 표현 방식, 대화·갈등 패턴, 생활 궁합, 관계를 좋게 만드는 핵심 조언에 집중하세요.
- 공동재정, 동업, 장기 결혼생활의 세부 위험관리, 장기 관계의 세밀한 시기 흐름은 향후 상세 분석 영역으로 남겨 두세요.
- 같은 내용을 반복하지 말고 전체 분량은 약 1,600~2,200자 정도를 목표로 하세요.

[반드시 포함할 내용]

# 명운 궁합 분석

## 1. 두 사람의 기본 성향과 궁합
각자의 기본 성향을 각각 2~3문장으로 설명한 뒤,
함께 있을 때 잘 맞는 점과 보완이 필요한 점을 3~4문장으로 정리하세요.

## 2. 감정과 애정 표현
애정 표현 방식, 친밀감 형성, 서로가 원하는 관심과 거리감의 차이를 3~4문장으로 설명하세요.
이어 서로에게 도움이 되는 행동을 2~3개 목록으로 제시하세요.

## 3. 대화와 갈등 해결
의사소통 방식, 의견 충돌 시 반응, 오해가 생기기 쉬운 지점을 3~4문장으로 설명하세요.
갈등을 줄이는 실제 대화 원칙을 3개 목록으로 정리하세요.

## 4. 생활과 가치관 궁합
생활 리듬, 책임감, 역할 분담, 일상적인 가치관 차이를 3~4문장으로 설명하세요.
가족관계나 결혼 여부를 단정하지 마세요.

## 5. 함께할 때 주의할 점
재물, 생활, 관계 유지 측면에서 서로 특히 조심하면 좋은 점을 3개 목록으로 정리하세요.
공동재정, 동업, 장기 결혼생활의 세부 판단까지 깊게 분석하지 마세요.

## 6. 관계를 좋게 만드는 실천 전략
두 사람이 지금부터 적용할 수 있는 행동을 3가지 제안하세요.
각 행동은 구체적이고 현실적으로 작성하세요.

## 종합 정리
두 사람 관계의 가장 큰 강점, 가장 중요한 주의점, 관계를 건강하게 유지하기 위한 핵심 방향을 2~3문장으로 정리하세요.

마지막에는 광고처럼 과장하지 말고,
"더 깊은 장기 관계, 재물·생활 궁합, 관계의 세부 흐름은 상세 분석에서 확인할 수 있습니다."
라는 취지로 자연스럽게 안내하세요.
`;

    const response = await client.responses.create({
      model: "gpt-5.6",
      input: prompt,
    });

    const result = String(response.output_text || "").trim();

    if (!result) {
      return NextResponse.json(
        {
          error: "궁합 분석 결과를 생성하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      result,
      people: {
        me: {
          name: me.name,
          dayMaster: meManseryeok.dayMaster,
          fiveElements: meManseryeok.fiveElements,
          strength: meManseryeok.strength,
          yongshin: meManseryeok.yongshin,
        },
        partner: {
          name: partner.name,
          dayMaster: partnerManseryeok.dayMaster,
          fiveElements: partnerManseryeok.fiveElements,
          strength: partnerManseryeok.strength,
          yongshin: partnerManseryeok.yongshin,
        },
      },
    });
  } catch (error) {
    console.error("compatibility fortune API error:", error);

    return NextResponse.json(
      {
        error:
          "궁합 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}