import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req:Request){
  try{
    const body=await req.json();
    if(!body.birth || !body.time || !body.gender || !body.calendar) return NextResponse.json({error:"필수 정보를 모두 입력해 주세요."},{status:400});
    const apiKey=process.env.OPENAI_API_KEY;
    if(!apiKey) return NextResponse.json({error:"OPENAI_API_KEY가 설정되지 않았습니다. 서버 환경변수에 입력해 주세요."},{status:500});
    const client=new OpenAI({apiKey});
    const prompt=`당신은 한국 전통 명리학을 설명하는 친절한 AI '명운'입니다.
다음 정보를 바탕으로 사주를 참고용으로 풀이하세요.
이름: ${body.name||"고객"} / ${body.calendar} / ${body.birth} / ${body.time} / ${body.gender}
절대적인 미래 단정, 의료·법률·투자 수익 보장 표현은 피하세요. 이해하기 쉬운 한국어로 작성하세요.
반드시 아래 JSON만 반환하세요:
{"title":"짧은 제목","summary":"전체 흐름 2~3문장","sections":[
{"name":"성향과 기질","text":"..."},{"name":"재물운","text":"..."},{"name":"사업·직업운","text":"..."},{"name":"인연·대인관계","text":"..."},{"name":"2026년 흐름","text":"..."},{"name":"명운의 조언","text":"..."}]}`;
    const response=await client.responses.create({model:"gpt-5.6-luna",input:prompt});
    const raw=response.output_text.trim().replace(/^```json\s*/,"").replace(/```$/,"");
    return NextResponse.json(JSON.parse(raw));
  }catch(e:any){ return NextResponse.json({error:"사주 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."},{status:500});}
}