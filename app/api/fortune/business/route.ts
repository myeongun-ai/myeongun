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

[반드시 포함할 내용]
## 1. 재물 성향
돈을 벌고 관리하고 사용하는 성향, 재물 판단의 강점과 약점을 구체적으로 설명하세요.

## 2. 돈이 들어오고 나가는 흐름
수입 확대, 저축, 소비, 자산관리에서 유리한 방식과 주의점을 설명하세요.

## 3. 사업운과 사업가 성향
독립사업, 영업, 협상, 의사결정, 조직운영 측면의 강점과 보완점을 설명하세요.

## 4. 직장과 사업 중 맞는 방향
조직생활과 독립활동의 특성을 비교하고 어떤 환경에서 역량을 발휘하기 쉬운지 설명하세요.

## 5. 투자와 사업 확장 시 주의점
투자, 신규사업, 동업, 대출, 무리한 확장에서 특히 확인해야 할 위험요인을 현실적으로 설명하세요.

## 6. 2026년 재물·사업 흐름
2026년 상반기와 하반기를 나누어 재물·사업·직업 측면에서 준비할 방향을 설명하세요. 확정적인 미래 예언은 하지 마세요.

## 7. 지금부터 실행할 재물·사업 전략
사용자가 실제로 적용할 수 있는 행동을 5가지 제안하세요.

마지막에는 전체 재물·사업 흐름을 3~4문장으로 종합 정리하세요.
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
