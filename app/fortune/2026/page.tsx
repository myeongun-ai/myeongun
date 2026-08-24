"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Saju = { name?: string; birth?: string; time?: string; gender?: string; calendar?: string };

function collectBusinessTexts(data: unknown): string[] {
  const keywords = ["2026", "올해", "연운", "월운", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const results: string[] = [];

  function walk(value: unknown, parentKey = "") {
    if (value == null) return;
    if (typeof value === "string") {
      const keyMatched = keywords.some((k) => parentKey.toLowerCase().includes(k.toLowerCase()));
      const valueMatched = keywords.some((k) => value.toLowerCase().includes(k.toLowerCase()));
      if (keyMatched || valueMatched) {
        const cleaned = value.trim();
        if (cleaned.length >= 8 && !results.includes(cleaned)) results.push(cleaned);
      }
      return;
    }
    if (Array.isArray(value)) return value.forEach((item) => walk(item, parentKey));
    if (typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => walk(item, key));
    }
  }

  walk(data);
  return results.slice(0, 8);
}

export default function Fortune2026Page() {
  const [saju, setSaju] = useState<Saju | null>(null);
  const [analysis, setAnalysis] = useState<unknown>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const active = sessionStorage.getItem("myeongun_session_active") === "1";

      if (!active) {
        setSaju(null);
        setAnalysis(null);
        return;
      }

      const savedSaju = localStorage.getItem("myeongun_saju");
      const savedResult = localStorage.getItem("myeongun_saju_result");

      setSaju(savedSaju ? JSON.parse(savedSaju) : null);
      setAnalysis(savedResult ? JSON.parse(savedResult) : null);
    } catch {
      setSaju(null);
      setAnalysis(null);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) return <main className="inner"><section className="contentCard" style={{ textAlign: "center" }}><p>사주 정보를 확인하고 있습니다...</p></section></main>;

  if (!saju?.birth || !saju?.time) {
    return (
      <main className="inner">
        <section className="pageIntro">
          <span className="eyebrow">2026 FORTUNE</span>
          <h1>2026년 운세</h1>
          <p>현재 이용 중인 사주 정보가 없습니다.</p>
        </section>
        <section className="contentCard" style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <h2>먼저 나의 사주를 입력해주세요</h2>
          <p>현재 탭에서 직접 사주 정보를 입력한 뒤 2026년 운세을 확인할 수 있습니다.</p>
          <Link href="/saju" className="primaryBtn inline">사주 입력하러 가기</Link>
        </section>
      </main>
    );
  }

  const businessTexts = collectBusinessTexts(analysis);

  return (
    <main className="inner">
      <section className="pageIntro">
        <span className="eyebrow">2026 FORTUNE</span>
        <h1>{saju.name ? `${saju.name}님의 2026년 운세` : "나의 2026년 운세"}</h1>
        <p>현재 이용자가 직접 입력한 사주 정보와 AI 분석 결과를 기준으로 보여드립니다.</p>
      </section>

      <section className="contentCard">
        <h2>입력된 사주 정보</h2>
        <div className="featureList">
          <div><strong>생년월일</strong><span>{saju.birth}</span></div>
          <div><strong>출생시간</strong><span>{saju.time}</span></div>
          <div><strong>성별</strong><span>{saju.gender || "-"}</span></div>
          <div><strong>달력 기준</strong><span>{saju.calendar || "-"}</span></div>
        </div>
      </section>

      <section className="contentCard">
        <h2>2026년 AI 분석</h2>
        {businessTexts.length > 0 ? (
          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            {businessTexts.map((text, index) => (
              <div key={`${index}-${text.slice(0, 20)}`} style={{ padding: "18px 20px", borderRadius: 14, background: "#f5f0e7", lineHeight: 1.9, color: "#5f584e" }}>
                {text}
              </div>
            ))}
          </div>
        ) : (
          <>
            <p>현재 저장된 AI 분석 결과에서 2026년 관련 항목을 별도로 찾지 못했습니다.</p>
            <Link href="/fortune/detail" className="primaryBtn inline">종합 상세 사주 보기</Link>
          </>
        )}
      </section>
    </main>
  );
}
