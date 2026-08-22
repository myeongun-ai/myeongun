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
        { error: "OPENAI_API_KEY가 설정되지 않았습니다. Vercel 환경변수에 입력해 주세요." },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    const prompt = `
당신은 전통 사주 명리학을 설명하는 친절한 AI 명운입니다.

다음 출생정보를 참고하여 운세를 설명해주세요.

이름: ${body.name || ""}
생년월일: ${body.birth}
출생시간: ${body.time}
성별: ${body.gender}
달력: ${body.calendar}

다음 내용을 포함해주세요.
1. 사주 전체적인 성향
2. 재물운과 사업운
3. 직업운
4. 인간관계
5. 2026년 운세

의학적 진단이나 확정적인 미래 예언은 하지 말고,
전통 명리학 관점의 참고용 해석으로 작성해주세요.

한국어로 읽기 쉽고 따뜻하게 설명해주세요.
`;

    const response = await client.responses.create({
      model: "gpt-5.6",
      input: prompt,
    });

    return NextResponse.json({
      result: response.output_text,
    });
  } catch (error) {
    console.error("fortune API error:", error);

    return NextResponse.json(
      { error: "사주 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}