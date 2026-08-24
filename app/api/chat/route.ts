import OpenAI from "openai";
import { NextResponse } from "next/server";

type Saju = {
  name?: string;
  birth?: string;
  time?: string;
  gender?: string;
  calendar?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const question = String(body?.question || "").trim();
    const saju = (body?.saju || null) as Saju | null;
    const targetYear = Number(body?.targetYear || 2026);

    if (!question) {
      return NextResponse.json(
        { error: "질문을 입력해주세요." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const sajuContext =
      saju?.birth && saju?.time
        ? `
사용자가 직접 입력한 사주 정보:
- 이름: ${saju.name || "미입력"}
- 생년월일: ${saju.birth}
- 출생시간: ${saju.time}
- 성별: ${saju.gender || "미입력"}
- 달력 기준: ${saju.calendar || "미입력"}
`
        : `
현재 저장된 사용자 사주 정보가 없습니다.
개인 사주를 단정하지 말고 일반적인 참고 조언으로 답변하세요.
`;

    const prompt = `
당신은 '명운 AI'라는 한국어 사주 상담 서비스의 상담 AI입니다.

중요 기준:
- 현재 서비스의 기준 연도는 ${targetYear}년입니다.
- 사용자가 "올해"라고 물으면 반드시 ${targetYear}년으로 해석하세요.
- ${targetYear - 1}년이나 다른 과거 연도를 "올해"라고 답하지 마세요.
- 사주 정보가 제공된 경우, 생년월일·출생시간·성별·달력 기준을 우선 참고해 개인화해서 답변하세요.
- 다만 미래를 확정적으로 예언하거나 사업·투자 성공을 보장해서는 안 됩니다.

${sajuContext}

사용자 질문:
${question}

답변 구성:
첫 문단: 질문에 대한 핵심 답변.
둘째 문단: ${targetYear}년의 전체 흐름.
셋째 문단: 재물·사업 또는 질문 주제에 대한 구체적인 해석.
넷째 문단: 상반기/하반기 또는 시기별 흐름.
마지막 문단: 주의할 점과 실전적으로 활용할 방향.

답변 원칙:
1. 반드시 한국어로 답변하세요.
2. 사용자의 질문에 먼저 직접 답하세요.
3. 저장된 사주 정보가 있으면 그 정보를 반영했다고 자연스럽게 설명하되, 근거 없이 매우 구체적인 사건을 단정하지 마세요.
4. 건강, 법률, 투자 등 중요한 의사결정은 사주만으로 단정하지 마세요.
5. 마크다운 제목 기호(##, ###), 별표 강조(**), 표는 사용하지 마세요.
6. 문단 사이에는 빈 줄을 넣어 읽기 쉽게 작성하세요.
7. 너무 길지 않게 핵심 중심으로 답변하세요.
`;

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: prompt,
    });

    return NextResponse.json({
      answer: response.output_text,
    });
  } catch (error) {
    console.error("AI 상담 오류:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `AI 상담 중 오류가 발생했습니다: ${error.message}`
            : "AI 상담 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
