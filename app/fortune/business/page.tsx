"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Saju = {
  name?: string;
  birth?: string;
  birthTime?: string;
  gender?: string;
  calendar?: string;
};

function seedFromBirth(birth: string) {
  return [...birth].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function score(seed: number, offset: number) {
  return 70 + ((seed * 17 + offset * 13) % 27);
}

export default function BusinessFortunePage() {
  const [saju, setSaju] = useState<Saju | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myeongun_saju");
      if (saved) setSaju(JSON.parse(saved));
    } catch {
      setSaju(null);
    }
  }, []);

  const scores = useMemo(() => {
    if (!saju?.birth) return null;
    const seed = seedFromBirth(saju.birth);
    return {
      wealth: score(seed, 1),
      business: score(seed, 2),
      career: score(seed, 3),
      execution: score(seed, 4),
    };
  }, [saju]);

  if (!saju || !scores) {
    return (
      <main className="inner">
        <section className="pageIntro">
          <span className="eyebrow">WEALTH · BUSINESS</span>
          <h1>재물·사업운</h1>
          <p>먼저 나의 사주를 입력해야 개인화된 흐름을 확인할 수 있습니다.</p>
        </section>
        <section className="contentCard" style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <h2>사주 입력이 필요합니다</h2>
          <p>
            사주 입력 없이 임의의 점수를 보여주지 않습니다. 생년월일과 출생시간을
            입력하면 이 페이지에서 입력된 사주를 기준으로 표시합니다.
          </p>
          <Link href="/saju" className="primaryBtn inline">
            사주 입력하러 가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="inner">
      <section className="pageIntro">
        <span className="eyebrow">WEALTH · BUSINESS</span>
        <h1>{saju.name || "고객님"}의 재물·사업운</h1>
        <p>입력하신 사주 정보를 기준으로 현재 흐름을 확인합니다.</p>
      </section>

      <section className="scoreStrip">
        <div><span>재물운</span><b>{scores.wealth}</b></div>
        <div><span>사업운</span><b>{scores.business}</b></div>
        <div><span>직업운</span><b>{scores.career}</b></div>
        <div><span>실행운</span><b>{scores.execution}</b></div>
      </section>

      <section className="contentCard">
        <h2>나의 사업 흐름</h2>
        <p>
          입력된 생년월일을 기준으로 개인화된 흐름을 표시합니다. 이 페이지의 점수는
          서비스 화면용 참고 지수이며 투자·사업의 성공을 보장하는 수치가 아닙니다.
        </p>
        <div className="featureList">
          <div><strong>재물 흐름</strong><span>수입과 지출 구조를 함께 점검하세요.</span></div>
          <div><strong>사업 흐름</strong><span>확장보다 반복 가능한 구조를 우선하세요.</span></div>
          <div><strong>직업 흐름</strong><span>경험과 전문성을 활용하는 방향이 유리합니다.</span></div>
          <div><strong>실행 흐름</strong><span>작은 실행을 쌓아 결과로 연결하세요.</span></div>
        </div>
        <Link href="/saju" className="ghostBtn inline">사주 다시 입력하기</Link>
      </section>
    </main>
  );
}
