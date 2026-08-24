"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Saju = { name?: string; birth?: string };

function seedFromBirth(birth: string) {
  return [...birth].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

export default function Fortune2026Page() {
  const [saju, setSaju] = useState<Saju | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myeongun_saju");
      if (saved) setSaju(JSON.parse(saved));
    } catch {
      setSaju(null);
    }
  }, []);

  const months = useMemo(() => {
    if (!saju?.birth) return [];
    const seed = seedFromBirth(saju.birth);
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      score: 72 + ((seed * 11 + (i + 1) * 17) % 25),
    }));
  }, [saju]);

  if (!saju?.birth) {
    return (
      <main className="inner">
        <section className="pageIntro">
          <span className="eyebrow">2026 FORTUNE</span>
          <h1>2026년 운세</h1>
          <p>사주를 입력한 뒤 개인화된 2026년 흐름을 확인할 수 있습니다.</p>
        </section>
        <section className="contentCard" style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <h2>사주 입력이 필요합니다</h2>
          <p>입력 전에는 임의의 월별 지수를 표시하지 않습니다.</p>
          <Link href="/saju" className="primaryBtn inline">사주 입력하러 가기</Link>
        </section>
      </main>
    );
  }

  const total = Math.round(months.reduce((sum, item) => sum + item.score, 0) / months.length);

  return (
    <main className="inner">
      <section className="pageIntro">
        <span className="eyebrow">2026</span>
        <h1>{saju.name || "나"}의 2026년 운세</h1>
        <p>입력하신 사주 정보를 기준으로 한 해의 흐름을 확인합니다.</p>
      </section>

      <section className="yearHero">
        <span>2026</span>
        <strong>나의 한 해</strong>
        <b>{total}</b>
        <small>전체 흐름 참고 지수</small>
      </section>

      <section className="contentCard">
        <h2>월별 흐름</h2>
        <div className="monthGrid">
          {months.map((item) => (
            <div key={item.month}>
              <span>{item.month}월</span>
              <b>{item.score}</b>
              <small>참고 지수</small>
            </div>
          ))}
        </div>
      </section>

      <section className="miniCards">
        <div><b>💰 재물운</b><span>기회를 선별하고 현금 흐름을 점검하세요.</span></div>
        <div><b>💼 사업운</b><span>확장보다 안정적인 구조를 우선하세요.</span></div>
        <div><b>❤️ 인연운</b><span>대화와 신뢰를 바탕으로 관계를 살펴보세요.</span></div>
      </section>

      <p style={{ color: "#8d8579", fontSize: 11, marginTop: 18 }}>
        ※ 지수는 참고용이며 투자·사업·결혼 등의 결과를 보장하지 않습니다.
      </p>
    </main>
  );
}
