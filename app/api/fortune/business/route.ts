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
당신은 한국어로 설명하는 재물·사업운 전문 AI '명운'입니다.

아래 입력정보와 실제 만세력 계산 결과를 근거로 사용자의 재물·사업 흐름을 현실적이고 구체적으로 분석하세요.

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

[해석 원칙]
- 위 만세력 계산값을 해석의 실제 근거로 사용하세요.
- 신강·신약, 오행, 십성, 지장간, 용신·희신을 재물과 사업 해석에 연결하세요.
- 대운 등 제공되지 않은 값은 임의로 만들어내지 마세요.
- 투자 수익, 사업 성공, 특정 가격이나 수익률을 보장하거나 단정하지 마세요.
- 사주는 참고자료이며 실제 투자·사업 결정에는 시장정보, 재무상태, 전문가 조언을 함께 고려하도록 안내하세요.
- 자연스러운 한국어 존댓말로 작성하세요.
- 마크다운 제목과 목록을 사용해 읽기 쉽게 작성하세요.

[무료 서비스 작성 범위]
- 이 메뉴는 무료 재물·사업운 요약 서비스입니다.
- 사용자가 자신의 돈 관리 성향과 사업 성향을 이해할 수 있을 만큼은 유용하게 설명하되, 9,900원 상세 사주의 재물운·사업운을 대체할 정도로 깊게 쓰지 마세요.
- 무료 결과에서는 구체적인 장기 자산 전략, 세밀한 현금흐름 설계, 사업 확장 판단, 동업·대출 의사결정, 장기 시기 분석을 모두 풀어 쓰지 마세요.
- 같은 의미를 반복하지 말고 전체 분량은 약 1,500~2,000자 정도를 목표로 하세요.

[반드시 포함할 내용]
## 1. 재물 성향
돈을 벌고 관리하고 사용하는 기본 성향을 3~4문장으로 설명하세요.
이어 강점 또는 주의점을 3개 목록으로 정리하세요.

## 2. 돈 관리의 핵심 포인트
저축, 소비, 자산관리에서 도움이 되는 방향과 주의점을 3~4문장으로 설명하세요.
구체적인 투자 종목, 수익률, 가격 전망은 제시하지 마세요.

## 3. 사업운과 사업가 성향
독립성, 영업·협상, 의사결정, 조직운영 측면의 기본 성향을 3~4문장으로 설명하세요.
이어 사업할 때 기억할 핵심 포인트를 3개 목록으로 정리하세요.

## 4. 직장과 사업 중 맞는 방향
조직생활과 독립활동 중 어떤 환경에서 강점을 발휘하기 쉬운지 3문장 정도로 설명하세요.
한쪽을 절대적으로 단정하지 마세요.

## 5. 2026년 재물·사업 흐름
2026년 재물·사업 흐름을 4~5문장으로 요약하세요.
상반기·하반기를 길게 풀지 말고 준비할 점과 주의할 점 중심으로 작성하세요.

## 6. 지금부터 실행할 재물·사업 원칙
바로 적용할 수 있는 행동 원칙을 3개 목록으로 제안하세요.

마지막에는 전체 흐름을 2문장 정도로 정리하고,
"더 세밀한 재물 흐름, 사업 확장·위험관리, 직업·장기 방향은 상세 사주에서 확인할 수 있습니다."
라는 취지로 자연스럽게 안내하세요.
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
