import OpenAI from "openai";
import { NextResponse } from "next/server";
import { calculateMyeongunManseryeok } from "../../../lib/manseryeok";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.birth || !body.time || !body.gender || !body.calendar) {
      return NextResponse.json(
        { error: "필수 정보를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    const manseryeok = calculateMyeongunManseryeok({ birth: body.birth, time: body.time, calendar: body.calendar });

    const formatHiddenStems = (pillar: typeof manseryeok.pillars.year) => pillar.hiddenStems.map((item) => `${item.stem}(${item.tenGod})`).join(" · ");

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
당신은 한국어로 설명하는 친절한 무료 사주 해석 AI '명운'입니다.

아래 출생정보를 참고하여 사용자가 읽기 쉽고 현실적으로 활용할 수 있는 무료 사주 분석을 작성하세요.

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
오행: 목 ${manseryeok.fiveElements.목}, 화 ${manseryeok.fiveElements.화}, 토 ${manseryeok.fiveElements.토}, 금 ${manseryeok.fiveElements.금}, 수 ${manseryeok.fiveElements.수}
신강·신약: ${manseryeok.strength.level} (${manseryeok.strength.score}점) - ${manseryeok.strength.reason}
참고용 용신·희신: 용신 ${manseryeok.yongshin?.yongshin || "미산출"}, 희신 ${manseryeok.yongshin?.heesin || "미산출"} - ${manseryeok.yongshin?.reason || "용신·희신 참고값 미산출"}
지지 십성: 연지 ${manseryeok.pillars.year.tenGodBranch}, 월지 ${manseryeok.pillars.month.tenGodBranch}, 일지 ${manseryeok.pillars.day.tenGodBranch}, 시지 ${manseryeok.pillars.hour?.tenGodBranch || "출생시간 미상"}
지장간: 연지 ${formatHiddenStems(manseryeok.pillars.year)}, 월지 ${formatHiddenStems(manseryeok.pillars.month)}, 일지 ${formatHiddenStems(manseryeok.pillars.day)}, 시지 ${manseryeok.pillars.hour ? formatHiddenStems(manseryeok.pillars.hour) : "출생시간 미상"}

[중요 원칙]
- 위 연주·월주·일주·시주, 일간, 오행, 지지 십성, 지장간 값은 만세력 계산 엔진으로 산출된 값이므로 해석의 근거로 사용하세요.
- 지지 십성과 지장간은 성향, 재물, 직업, 인간관계 해석에 실제로 연결하여 설명하세요.
- 신강·신약과 용신·희신은 위 만세력 계산 엔진에서 산출한 참고값을 그대로 해석에 사용하세요. 용신·희신은 전통 명리의 절대적인 확정 판정이 아니라 명운 엔진의 참고용 분석값으로 표현하세요. 대운 등 현재 제공되지 않은 값은 임의로 계산하거나 만들어내지 마세요.
- 전통 명리 관점을 참고한 AI 해석임을 유지하세요.
- 확정적인 미래 예언, 수명, 사고, 질병을 단정하지 마세요.
- 재물·사업·직업 내용은 현실적인 행동 조언과 함께 설명하세요.
- 투자 수익이나 사업 성공을 보장하지 마세요.
- 건강은 진단이 아니라 생활습관과 자기관리 관점에서만 설명하세요.
- 출생시간이 "모름"이면 시주를 특정하지 말고, 시간 정보가 없어서 세부 해석 범위가 제한된다는 점을 자연스럽게 안내하세요.
- 모든 문장은 자연스러운 한국어 존댓말로 작성하세요.
- 마크다운 제목과 강조 표기를 사용해 읽기 좋게 구성하세요.

[무료 서비스 작성 범위]
- 무료 결과는 처음 이용한 사용자가 "내 사주가 어떤 흐름인지" 이해할 수 있는 핵심 요약에 집중하세요.
- 지나치게 세밀한 대운·세운 해석, 월별 시기 분석, 장기 재물 전략, 구체적인 사업 의사결정, 직업 적성 심층 분석, 관계의 세부 시기까지 모두 풀어 쓰지 마세요.
- 위 심층 내용은 프리미엄 상세 사주에서 확인할 수 있도록 남겨 두세요.
- 무료 결과에서는 세부 시기, 장기 흐름, 구체적인 재물·사업 전략을 미리 풀어 쓰지 말고 핵심 방향만 보여 주세요.
- 같은 내용을 반복하지 말고 각 항목의 핵심을 간결하게 설명하세요.
- 전체 분량은 마크다운 제목을 포함해 약 1,200~1,600자 정도를 목표로 하세요.

[반드시 포함할 내용]
## 기본 사주 구성
입력정보와 사주 구성의 핵심을 2~3문장으로 정리하고, 출생시간이 "모름"인 경우 해석 범위가 제한됨을 자연스럽게 안내하세요.

## 1. 사주 전체적인 성향
성격, 판단방식, 강점과 보완점을 2~3문장으로 설명하세요.
이어 핵심 포인트를 2개 목록으로 정리하세요.

## 2. 재물운과 사업운
돈을 다루는 태도와 사업·독립활동 성향을 2~3문장으로 설명하세요.
이어 실천 포인트를 2개만 제시하세요.
구체적인 투자 종목, 수익률, 확정적인 금전 결과는 제시하지 마세요.

## 3. 직업운
잘 맞을 가능성이 있는 업무 방식과 조직생활·독립활동의 균형을 2문장 정도로 설명하세요.
직업명을 과도하게 나열하지 말고 일하는 방식과 강점을 중심으로 작성하세요.

## 4. 인간관계
관계 형성 방식, 갈등 시 주의점, 도움이 되는 소통 방법을 2문장 정도로 설명하세요.

## 5. 2026년 운세
2026년의 전체 흐름을 2~3문장으로 요약하세요.
상반기·하반기를 길게 나누지 말고, 재물·사업·직업·관계에서 특히 준비할 점만 짧게 제시하세요.
확정적인 예언이 아니라 가능성과 준비 방향 중심으로 작성하세요.

## 종합 조언
지금부터 적용할 수 있는 행동을 2개 목록으로 제안하고, 전체 흐름을 1문장으로 마무리하세요.

마지막 문장은 광고처럼 과장하지 말고,
"더 세밀한 시기별 흐름과 재물·직업·관계의 심층 분석은 상세 사주에서 확인할 수 있습니다."
라는 취지로 자연스럽게 안내하세요.
`;

    const response = await client.responses.create({
      model: "gpt-5.6",
      input: prompt,
    });

    const result = String(response.output_text || "").trim();

    if (!result) {
      return NextResponse.json(
        { error: "무료 사주 결과를 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result,
      yongshin: manseryeok.yongshin,
    });
  } catch (error) {
    console.error("fortune API error:", error);

    return NextResponse.json(
      {
        error:
          "사주 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
