"use client";
import Link from "next/link";
import { useState } from "react";

type Result={title:string;summary:string;sections:{name:string;text:string}[]};
const cards=[
 {icon:"🔮",title:"종합 사주",text:"나의 기질부터 대운까지",href:"/saju"},
 {icon:"💰",title:"재물·사업",text:"돈과 일의 흐름을 읽다",href:"/fortune/business"},
 {icon:"❤️",title:"궁합",text:"두 사람의 관계 흐름",href:"/compatibility"},
 {icon:"📅",title:"2026 운세",text:"올해의 큰 흐름과 월별 운",href:"/fortune/2026"},
];
export default function Home(){
 const [form,setForm]=useState({name:"",birth:"",time:"",gender:"남성",calendar:"양력"}); const [loading,setLoading]=useState(false); const [result,setResult]=useState<Result|null>(null);
 const update=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setResult(null);try{const r=await fetch("/api/fortune",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw new Error(d.error||"분석 중 오류가 발생했습니다.");setResult({
  title: "명운 AI 분석 결과",
  summary: d.result ?? "",
  sections: []
});}catch(e:any){alert(e.message)}finally{setLoading(false)}}
 return <main>
  <section className="heroHome"><div className="heroCopy"><div className="eyebrow">✦ AI 사주 · 운세 종합 플랫폼</div><h1>태어난 순간부터 시작된<br/><em>나만의 운명</em>을 읽다</h1><p>생년월일시를 바탕으로 성향, 재물, 사업, 인연과 앞으로의 흐름을 알기 쉽게 풀어드립니다.</p><div className="heroActions"><Link href="/saju" className="primaryBtn">내 사주 무료로 보기</Link><Link href="/ai" className="ghostBtn">명운 AI 상담 →</Link></div><div className="trust">🔒 입력 정보는 운세 분석에만 사용됩니다 · 참고용 콘텐츠</div></div>
   <div className="heroOrb"><span>明</span><i>命運</i><small>YOUR FLOW · YOUR STORY</small></div>
  </section>
  <section className="serviceSection"><div className="sectionHead"><div><span className="eyebrow">명운의 핵심 서비스</span><h2>오늘, 무엇이 궁금하신가요?</h2></div><Link href="/saju">전체 보기 →</Link></div><div className="serviceGrid">{cards.map(c=><Link className="serviceCard" href={c.href} key={c.title}><span className="serviceIcon">{c.icon}</span><h3>{c.title}</h3><p>{c.text}</p><b>자세히 보기 →</b></Link>)}</div></section>
  <section className="inputSection"><div><span className="eyebrow">FREE SAJU</span><h2>내 사주, 지금 바로 확인하세요</h2><p>출생정보를 입력하면 명운 AI가 첫 번째 종합 해석을 만들어드립니다.</p></div><form className="inputCard" onSubmit={submit}><label>이름<input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="이름" required/></label><div className="two"><label>양력/음력<select value={form.calendar} onChange={e=>update("calendar",e.target.value)}><option>양력</option><option>음력</option></select></label><label>성별<select value={form.gender} onChange={e=>update("gender",e.target.value)}><option>남성</option><option>여성</option></select></label></div><label>생년월일<input type="date" value={form.birth} onChange={e=>update("birth",e.target.value)} required/></label><label>출생시간<select value={form.time} onChange={e=>update("time",e.target.value)} required><option value="">출생시간 선택</option>{["子時 (23:00~00:59)","丑時 (01:00~02:59)","寅時 (03:00~04:59)","卯時 (05:00~06:59)","辰時 (07:00~08:59)","巳時 (09:00~10:59)","午時 (11:00~12:59)","未時 (13:00~14:59)","申時 (15:00~16:59)","酉時 (17:00~18:59)","戌時 (19:00~20:59)","亥時 (21:00~22:59)"].map(x=><option key={x}>{x}</option>)}</select></label><button className="primaryBtn" disabled={loading}>{loading?"명운이 분석 중입니다…":"✦ 무료 사주 풀이 시작"}</button></form></section>
  {result&&<section className="resultSection"><span className="eyebrow">명운 AI 분석 결과</span><h2>{result.title}</h2><p className="resultSummary">{result.summary}</p><div className="resultGrid">{result.sections.map((s,i)=><article key={i}><h3>{s.name}</h3><p>{s.text}</p></article>)}</div><small>※ 전통 명리학을 바탕으로 한 참고용 콘텐츠이며 미래를 확정적으로 예측하지 않습니다.</small></section>}
  <section className="aiBanner"><div><span className="eyebrow">명운 AI</span><h2>내 사주를 알고 있는 AI에게<br/>궁금한 것을 물어보세요.</h2><p>사업, 재물, 연애, 직업, 올해의 흐름까지 나의 사주를 바탕으로 대화합니다.</p></div><Link href="/ai" className="primaryBtn">AI 상담 시작 →</Link></section>
 </main>;
}
