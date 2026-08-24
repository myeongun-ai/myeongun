import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.birth || !body.time || !body.gender || !body.calendar) {
      return NextResponse.json(
        { error: "?꾩닔 ?뺣낫瑜?紐⑤몢 ?낅젰??二쇱꽭??" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY媛 ?ㅼ젙?섏? ?딆븯?듬땲?? Vercel ?섍꼍蹂?섏뿉 ?낅젰??二쇱꽭??" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    const prompt = `
?뱀떊? ?꾪넻 ?ъ＜ 紐낅━?숈쓣 ?ㅻ챸?섎뒗 移쒖젅??AI 紐낆슫?낅땲??

?ㅼ쓬 異쒖깮?뺣낫瑜?李멸퀬?섏뿬 ?댁꽭瑜??ㅻ챸?댁＜?몄슂.

?대쫫: ${body.name || ""}
?앸뀈?붿씪: ${body.birth}
異쒖깮?쒓컙: ${body.time}
?깅퀎: ${body.gender}
?щ젰: ${body.calendar}

?ㅼ쓬 ?댁슜???ы븿?댁＜?몄슂.
1. ?ъ＜ ?꾩껜?곸씤 ?깊뼢
2. ?щЪ?닿낵 ?ъ뾽??3. 吏곸뾽??4. ?멸컙愿怨?5. 2026???댁꽭

?섑븰??吏꾨떒?대굹 ?뺤젙?곸씤 誘몃옒 ?덉뼵? ?섏? 留먭퀬,
?꾪넻 紐낅━??愿?먯쓽 李멸퀬???댁꽍?쇰줈 ?묒꽦?댁＜?몄슂.

?쒓뎅?대줈 ?쎄린 ?쎄퀬 ?곕쑜?섍쾶 ?ㅻ챸?댁＜?몄슂.
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
      { error: "?ъ＜ 遺꾩꽍 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??" },
      { status: 500 }
    );
  }
}

