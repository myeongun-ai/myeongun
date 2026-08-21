 "use client";
import { useState } from "react";

type Result = { title:string; summary:string; sections:{name:string;text:string}[] };

export default function Home() {
  const [form,setForm]=useState({name:"",birth:"",time:"",gender:"남성",calendar:"양력"});
  const [loading,setLoading]=useState(false); const [result,setResult]=useState<Result|null>(null);
  const update=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  async function submit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setResult(null);
    try {
      const r=await fetch("/api/fortune",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await r.json(); if(!r.ok) throw new Error(data.error||"오류가 발생했습니다.");
      setResult(data);
    } catch(err:any){ alert(err.message); } finally { setLoading(false); }
  }
  return <main>
    <nav className="nav"><div className="logo"><span>明</span> 명운</div><div className="navtag">AI 사주 · 운세</div></nav>
    <section className="hero">
      <div className="badge">✦ AI 명리 분석</div>
      <h1>당신의 운명을<br/><em>명운</em>에서 풀어보세요</h1>
      <p>생년월일시를 바탕으로 성격, 재물, 사업, 인연과 앞으로의 흐름을 AI가 알기 쉽게 풀이해 드립니다.</p>
    </section>
    <section className="card">
      <h2>사주 정보 입력</h2><p className="hint">정확한 생년월일시를 입력할수록 풀이가 정교해집니다.</p>
      <form onSubmit={submit}>
        <label>이름<input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="이름을 입력하세요" required/></label>
        <div className="grid">
          <label>달력
            <select value={form.calendar} onChange={e=>update("calendar",e.target.value)}><option>양력</option><option>음력</option></select>
          </label>
          <label>성별
            <select value={form.gender} onChange={e=>update("gender",e.target.value)}><option>남성</option><option>여성</option></select>
          </label>
        </div>
        <label>생년월일<input type="date" value={form.birth} onChange={e=>update("birth",e.target.value)} required/></label>
        <label>출생시간<select value={form.time} onChange={e=>update("time",e.target.value)} required>
          <option value="">출생시간 선택</option><option>子時 (23:00~00:59)</option><option>丑時 (01:00~02:59)</option><option>寅時 (03:00~04:59)</option><option>卯時 (05:00~06:59)</option><option>辰時 (07:00~08:59)</option><option>巳時 (09:00~10:59)</option><option>午時 (11:00~12:59)</option><option>未時 (13:00~14:59)</option><option>申時 (15:00~16:59)</option><option>酉時 (17:00~18:59)</option><option>戌時 (19:00~20:59)</option><option>亥時 (21:00~22:59)</option>
        </select></label>
        <button disabled={loading}>{loading ? "명운이 분석 중입니다…" : "✦ AI 사주 풀이 시작"}</button>
      </form>
    </section>
    {result && <section className="result">
      <div className="resultHead"><div className="badge">명운 AI 분석 결과</div><h2>{result.title}</h2><p>{result.summary}</p></div>
      <div className="sections">{result.sections.map((s,i)=><article key={i}><h3>{s.name}</h3><p>{s.text}</p></article>)}</div>
      <small>※ 명운의 사주 풀이는 전통 명리학을 바탕으로 한 참고용 콘텐츠이며 미래를 확정적으로 예측하지 않습니다.</small>
    </section>}
    <footer>© 2026 명운 MYEONGUN · myeongun.kr</footer>
  </main>
}