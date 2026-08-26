import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  entitlementCookie,
  hashSaju,
  verifyEntitlement,
  type SajuAccessInput,
} from "../../../../lib/paymentAccess";

type PremiumSection = {
  title: string;
  summary: string;
  points: string[];
  advice: string;
};

type PremiumResult = {
  headline: string;
  overview: string;
  strengths: string[];
  cautions: string[];
  opportunity: string;
  sections: PremiumSection[];
  actionPlan: string[];
  disclaimer: string;
};

function extractJson(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");

  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1));
  }

  throw new Error("AI ?묐떟??JSON?쇰줈 ?댁꽍?????놁뒿?덈떎.");
}

function isValidResult(value: any): value is PremiumResult {
  return Boolean(
    value &&
      typeof value.headline === "string" &&
      typeof value.overview === "string" &&
      Array.isArray(value.strengths) &&
      Array.isArray(value.cautions) &&
      typeof value.opportunity === "string" &&
      Array.isArray(value.sections) &&
      Array.isArray(value.actionPlan) &&
      typeof value.disclaimer === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saju = (body?.saju || null) as SajuAccessInput | null;

    if (!saju?.name || !saju?.birth || !saju?.time || !saju?.gender || !saju?.calendar) {
      return NextResponse.json(
        { error: "?곸꽭 遺꾩꽍???꾩슂???ъ＜ ?뺣낫媛 遺議깊빀?덈떎." },
        { status: 400 }
      );
    }

    const token = request.cookies.get(entitlementCookie.name)?.value;
    const entitlement = verifyEntitlement(token);

    if (!entitlement) {
      return NextResponse.json(
        { error: "?좏슚???곸꽭 ?ъ＜ ?댁슜沅뚯씠 ?놁뒿?덈떎." },
        { status: 401 }
      );
    }

    if (entitlement.sajuHash !== hashSaju(saju)) {
      return NextResponse.json(
        { error: "寃곗젣???ъ＜ ?뺣낫? ?꾩옱 ?ъ＜ ?뺣낫媛 ?쇱튂?섏? ?딆뒿?덈떎." },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY媛 ?ㅼ젙?섏? ?딆븯?듬땲??" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const prompt = `
?뱀떊? ?쒓뎅?대줈 ?ㅻ챸?섎뒗 ?꾪넻 紐낅━ 愿?먯쓽 ?꾨━誘몄뾼 ?ъ＜ ?댁꽍 AI?낅땲??
?꾨옒 ?뺣낫留뚯쓣 諛뷀깢?쇰줈 怨좉컼?먭쾶 9,900???좊즺 ?곹뭹??嫄몃쭪? 源딆씠? 援ъ껜?깆쓣 媛吏?遺꾩꽍???묒꽦?섏꽭??

?대쫫: ${saju.name}
?앸뀈?붿씪: ${saju.birth}
異쒖깮?쒓컙: ${saju.time}
?깅퀎: ${saju.gender}
?щ젰 湲곗?: ${saju.calendar}

以묒슂 ?먯튃:
- ?ъ＜??李멸퀬???댁꽍?대ŉ ?뺤젙???덉뼵泥섎읆 留먰븯吏 留덉꽭??
- ?섎즺 吏꾨떒, 踰뺣쪧 ?먮떒, ?ъ옄 ?섏씡 蹂댁옣泥섎읆 ?⑥젙?섏? 留덉꽭??
- ?щЪ/?ъ뾽/吏곸뾽? ?꾩떎?곸씤 ?됰룞 議곗뼵怨??④퍡 ?ㅻ챸?섏꽭??
- 嫄닿컯? 吏덈퀝 ?덉륫???꾨땲???앺솢愿由?愿?먯쑝濡쒕쭔 ?쒗쁽?섏꽭??
- 2026?꾩? ?곌컙 ?먮쫫怨?以鍮??ъ씤??以묒떖?쇰줈 ?ㅻ챸?섏꽭??
- ?κ린 ?먮쫫? '媛?μ꽦', '諛⑺뼢', '以鍮????쒗쁽???ъ슜?섏꽭??
- 紐⑤뱺 臾몄옣? ?먯뿰?ㅻ윭???쒓뎅?대줈 ?묒꽦?섏꽭??
- 媛??뱀뀡? ?쒕줈 ?ㅻⅨ ?댁슜???닿퀬 諛섎났??以꾩씠?몄슂.

諛섎뱶???꾨옒 JSON 援ъ“ ?섎굹留?諛섑솚?섏꽭?? 留덊겕?ㅼ슫?대굹 肄붾뱶釉붾줉? ?ъ슜?섏? 留덉꽭??

{
  "headline": "???щ엺???듭떖 ?먮쫫????臾몄옣?쇰줈 ?붿빟",
  "overview": "醫낇빀 ?ъ＜ ?댁꽍 5~7臾몄옣",
  "strengths": ["媛뺤젏 1", "媛뺤젏 2", "媛뺤젏 3", "媛뺤젏 4"],
  "cautions": ["二쇱쓽??1", "二쇱쓽??2", "二쇱쓽??3"],
  "opportunity": "?욎쑝濡??쒖슜?섎㈃ 醫뗭? ?듭떖 湲고쉶?????3~4臾몄옣",
  "sections": [
    {
      "title": "?깊뼢怨?湲곗쭏",
      "summary": "4~6臾몄옣",
      "points": ["援ъ껜 ?ъ씤??1", "援ъ껜 ?ъ씤??2", "援ъ껜 ?ъ씤??3", "援ъ껜 ?ъ씤??4"],
      "advice": "?ㅽ뻾 議곗뼵 2~3臾몄옣"
    },
    {
      "title": "?щЪ??,
      "summary": "4~6臾몄옣",
      "points": ["?ъ씤??1", "?ъ씤??2", "?ъ씤??3", "?ъ씤??4"],
      "advice": "?ㅽ뻾 議곗뼵 2~3臾몄옣"
    },
    {
      "title": "?ъ뾽??,
      "summary": "4~6臾몄옣",
      "points": ["?ъ씤??1", "?ъ씤??2", "?ъ씤??3", "?ъ씤??4"],
      "advice": "?ㅽ뻾 議곗뼵 2~3臾몄옣"
    },
    {
      "title": "吏곸뾽??,
      "summary": "4~6臾몄옣",
      "points": ["?ъ씤??1", "?ъ씤??2", "?ъ씤??3", "?ъ씤??4"],
      "advice": "?ㅽ뻾 議곗뼵 2~3臾몄옣"
    },
    {
      "title": "?멸컙愿怨꾩? ?곗븷??,
      "summary": "4~6臾몄옣",
      "points": ["?ъ씤??1", "?ъ씤??2", "?ъ씤??3", "?ъ씤??4"],
      "advice": "?ㅽ뻾 議곗뼵 2~3臾몄옣"
    },
    {
      "title": "?앺솢怨?嫄닿컯 愿由?,
      "summary": "4~6臾몄옣",
      "points": ["?ъ씤??1", "?ъ씤??2", "?ъ씤??3", "?ъ씤??4"],
      "advice": "?앺솢愿由?議곗뼵 2~3臾몄옣"
    },
    {
      "title": "2026???댁꽭",
      "summary": "5~7臾몄옣",
      "points": ["?곷컲湲??먮쫫", "?섎컲湲??먮쫫", "?щЪ쨌?ъ뾽 ?ъ씤??, "愿怨꽷룹깮???ъ씤??],
      "advice": "2026???ㅽ뻾 議곗뼵 2~3臾몄옣"
    },
    {
      "title": "?ν썑 ?κ린 ?먮쫫",
      "summary": "5~7臾몄옣",
      "points": ["1~2??, "3~5??, "5~10??, "?κ린?곸쑝濡??ㅼ슱 ?먯궛"],
      "advice": "?κ린 ?ㅽ뻾 議곗뼵 2~3臾몄옣"
    }
  ],
  "actionPlan": ["?ㅼ쿇 1", "?ㅼ쿇 2", "?ㅼ쿇 3", "?ㅼ쿇 4"],
  "disclaimer": "蹂??댁꽍? ?꾪넻 紐낅━ 愿?먯쓣 李멸퀬??AI 遺꾩꽍?대ŉ 以묒슂???섏궗寃곗젙? ?꾩떎?곸씤 ?뺣낫? ?꾨Ц媛 議곗뼵???④퍡 怨좊젮?댁빞 ?쒕떎???덈궡"
}
`;

    const response = await client.responses.create({
      model: "gpt-5.6",
      input: prompt,
    });

    const parsed = extractJson(response.output_text);

    if (!isValidResult(parsed)) {
      throw new Error("?곸꽭 遺꾩꽍 ?묐떟 ?뺤떇???щ컮瑜댁? ?딆뒿?덈떎.");
    }

    return NextResponse.json(
      {
        ok: true,
        result: parsed,
        expiresAt: entitlement.exp,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("premium fortune detail API error:", error);

    return NextResponse.json(
      { error: "?곸꽭 ?ъ＜ 遺꾩꽍 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄?댁＜?몄슂." },
      { status: 500 }
    );
  }
}
