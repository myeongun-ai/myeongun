import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.birth || !body.time || !body.gender || !body.calendar) {
      return NextResponse.json(
        { error: "필수 정보를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

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

[중요 원칙]
- 현재 입력에는 만세력으로 계산된 년주·월주·일주·시주, 오행, 십성, 대운 값이 제공되지 않았습니다.
- 따라서 특정 사주 원국이나 간지를 실제 계산한 것처럼 만들어내지 마세요.
- 전통 명리 관점을 참고한 AI 해석임을 유지하세요.
- 확정적인 미래 예언, 수명, 사고, 질병을 단정하지 마세요.
- 재물·사업·직업 내용은 현실적인 행동 조언과 함께 설명하세요.
- 투자 수익이나 사업 성공을 보장하지 마세요.
- 건강은 진단이 아니라 생활습관과 자기관리 관점에서만 설명하세요.
- 출생시간이 "모름"이면 시주를 특정하지 말고, 시간 정보가 없어서 세부 해석 범위가 제한된다는 점을 자연스럽게 안내하세요.
- 모든 문장은 자연스러운 한국어 존댓말로 작성하세요.
- 마크다운 제목과 강조 표기를 사용해 읽기 좋게 구성하세요.

[반드시 포함할 내용]
## 기본 사주 구성
입력정보를 짧게 정리하고, 현재 제공된 정보로 해석 가능한 범위를 안내하세요.

## 1. 사주 전체적인 성향
성격, 판단방식, 강점과 보완점을 4~6문장으로 설명하세요.
이어 핵심 포인트를 4~5개 목록으로 정리하세요.

## 2. 재물운과 사업운
돈을 다루는 태도, 소비·저축·투자 의사결정, 사업이나 독립활동에서의 장단점을 4~6문장으로 설명하세요.
이어 실천 포인트를 4개 정도 제시하세요.

## 3. 직업운
잘 맞을 가능성이 있는 업무 방식, 책임 범위, 조직생활과 독립활동의 균형을 4~6문장으로 설명하세요.

## 4. 인간관계
관계 형성 방식, 갈등이 생길 때 주의할 점, 소통 방법을 4~6문장으로 설명하세요.

## 5. 2026년 운세
2026년의 흐름을 상반기와 하반기로 나누어 설명하고, 재물·사업·직업·관계 측면에서 준비할 점을 제시하세요.
확정적인 예언이 아니라 가능성과 준비 방향 중심으로 작성하세요.

## 종합 조언
사용자가 지금부터 실제로 적용할 수 있는 행동 4~5가지를 제안하고, 전체 흐름을 2~3문장으로 마무리하세요.

분량은 무료 서비스에 적합하도록 충분히 유용하되 프리미엄 상세사주보다 짧게 작성하세요.
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
