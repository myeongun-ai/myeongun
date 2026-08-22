import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const question = String(body?.question || "").trim();

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

    const client = new OpenAI({
      apiKey,
    });

    const prompt = `
당신은 '명운 AI'라는 한국 사주 상담 서비스의 전문 상담 AI입니다.

사용자의 질문에 친절하고 이해하기 쉽게 답변하세요.
사주와 운세를 참고한 해석이라는 점을 자연스럽게 유지하고,
사업, 재물, 직업, 인간관계, 연애 등의 질문에는 현실적인 조언도 함께 제공하세요.

사용자 질문:
${question}

답변은 한국어로 작성하세요.
너무 짧게 답하지 말고 핵심 내용과 앞으로의 방향을 구체적으로 설명하세요.
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
      { error: "AI 상담 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}