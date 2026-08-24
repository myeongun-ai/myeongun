"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function seed(date: string) {
  return [...date].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

export default function CompatibilityPage() {
  const [me, setMe] = useState("");
  const [partner, setPartner] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const canAnalyze = Boolean(me && partner);

  const scores = useMemo(() => {
    if (!me || !partner) return null;

    const a = seed(me);
    const b = seed(partner);

    return {
      total: 72 + ((a + b) % 23),
      affection: 74 + ((a * 3 + b) % 21),
      conversation: 70 + ((a + b * 2) % 25),
      finance: 68 + ((a * 2 + b * 3) % 27),
      marriage: 71 + ((a * 5 + b * 2) % 24),
    };
  }, [me, partner]);

  function resetResult() {
    setAnalyzed(false);
  }

  function analyze() {
    if (!canAnalyze || !scores) return;
    setAnalyzed(true);
  }

  return (
    <main className="inner">
      <section className="pageIntro">
        <span className="eyebrow">LOVE · PARTNERSHIP</span>
        <h1>두 사람의 궁합</h1>
        <p>
          나와 상대의 생년월일을 직접 입력하면 관계의 흐름과 참고 점수를 확인할 수 있습니다.
        </p>
      </section>

      <section className="pairCard">
        <div className="person">
          <span>나</span>
          <label style={{ width: "80%" }}>
            <input
              aria-label="나의 생년월일"
              type="date"
              value={me}
              onChange={(e) => {
                setMe(e.target.value);
                resetResult();
              }}
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <div className="heart">＋</div>

        <div className="person">
          <span>상대</span>
          <label style={{ width: "80%" }}>
            <input
              aria-label="상대의 생년월일"
              type="date"
              value={partner}
              onChange={(e) => {
                setPartner(e.target.value);
                resetResult();
              }}
              style={{ width: "100%" }}
            />
          </label>
        </div>
      </section>

      <button
        type="button"
        className="primaryBtn wide"
        onClick={analyze}
        disabled={!canAnalyze}
      >
        궁합 분석 시작
      </button>

      {!analyzed ? (
        <section className="contentCard">
          <h2>궁합 리포트</h2>
          <p>
            두 사람의 생년월일을 모두 입력한 뒤 궁합 분석을 시작하면 결과가 표시됩니다.
            입력 전에는 임의의 점수나 미리보기 결과를 보여주지 않습니다.
          </p>
        </section>
      ) : (
        <section className="contentCard">
          <h2>궁합 리포트</h2>

          <div className="compatScores">
            <span>종합 {scores?.total}</span>
            <span>애정 {scores?.affection}</span>
            <span>대화 {scores?.conversation}</span>
            <span>재물 {scores?.finance}</span>
            <span>결혼 {scores?.marriage}</span>
          </div>

          <p style={{ marginTop: 20 }}>
            이 점수는 두 사람이 입력한 생년월일을 기준으로 만든 참고 지표입니다.
            실제 관계는 서로의 대화, 신뢰, 생활 방식과 선택에 따라 달라질 수 있습니다.
          </p>
        </section>
      )}

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link href="/" className="textLink">
          홈으로
        </Link>
      </div>
    </main>
  );
}
