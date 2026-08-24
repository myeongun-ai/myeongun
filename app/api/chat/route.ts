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

    // 프런트 화면을 우회해 API를 직접 호출해도 사주 정보 없이는 상담 불가
    if (!saju?.birth || !saju?.time) {
      return NextResponse.json(
        { error: "AI 상담을 이용하려면 먼저 사주 정보를 입력해주세요." },
        { status: 403 }
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

    const prompt = `
당신은 '명운 AI'라는 한국어 사주 상담 서비스의 상담 AI입니다.

현재 서비스 기준 연도는 ${targetYear}년입니다.
사용자가 "올해"라고 말하면 반드시 ${targetYear}년으로 해석하세요.

사용자가 직접 입력한 사주 정보:
- 이름: ${saju.name || "미입력"}
- 생년월일: ${saju.birth}
- 출생시간: ${saju.time}
- 성별: ${saju.gender || "미입력"}
- 달력 기준: ${saju.calendar || "미입력"}

사용자 질문:
${question}

답변 원칙:
1. 반드시 한국어로 답변하세요.
2. 위 사주 정보를 참고해 개인화해서 답변하세요.
3. 미래를 확정적으로 예언하거나 사업·투자 성공을 보장하지 마세요.
4. 건강, 법률, 투자 등 중요한 의사결정은 사주만으로 단정하지 마세요.
5. 마크다운 제목 기호(##, ###), 별표 강조(**), 표는 사용하지 마세요.
6. 핵심 답변 → ${targetYear}년 흐름 → 질문 주제 해석 → 시기별 흐름 → 실전 조언 순서로 작성하세요.
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
