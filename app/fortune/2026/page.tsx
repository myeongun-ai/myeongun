"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Saju = {
  name?: string;
  birth?: string;
  time?: string;
  gender?: string;
  calendar?: string;
};

function collect2026Texts(data: unknown): string[] {
  const keywords = [
    "2026",
    "올해",
    "연운",
    "월운",
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  const results: string[] = [];

  function walk(value: unknown, parentKey = "") {
    if (value == null) return;

    if (typeof value === "string") {
      const keyMatched = keywords.some((keyword) =>
        parentKey.toLowerCase().includes(keyword.toLowerCase())
      );

      const valueMatched = keywords.some((keyword) =>
        value.toLowerCase().includes(keyword.toLowerCase())
      );

      if (keyMatched || valueMatched) {
        const cleaned = value.trim();
        if (cleaned.length >= 8 && !results.includes(cleaned)) {
          results.push(cleaned);
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, parentKey));
      return;
    }

    if (typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        walk(item, key);
      });
    }
  }

  walk(data);
  return results.slice(0, 12);
}

export default function Fortune2026Page() {
  const [saju, setSaju] = useState<Saju | null>(null);
  const [analysis, setAnalysis] = useState<unknown>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
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

  if (!ready) {
    return (
      <main className="inner">
        <section className="contentCard" style={{ textAlign: "center" }}>
          <p>2026년 운세 정보를 확인하고 있습니다...</p>
        </section>
      </main>
    );
  }

  if (!saju?.birth || !saju?.time) {
    return (
      <main className="inner">
        <section className="pageIntro">
          <span className="eyebrow">2026 FORTUNE</span>
          <h1>2026년 운세</h1>
          <p>
            사주를 입력하지 않은 상태에서는 연간 점수나 월별 점수를 임의로 표시하지 않습니다.
          </p>
        </section>

        <section
          className="contentCard"
          style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}
        >
          <h2>먼저 나의 사주를 입력해주세요</h2>
          <p>
            생년월일, 출생시간, 성별, 달력 기준을 입력하고 사주 분석을 완료하면
            저장된 분석 결과를 바탕으로 2026년 관련 내용을 확인할 수 있습니다.
          </p>

          <Link href="/saju" className="primaryBtn inline">
            사주 입력하러 가기
          </Link>
        </section>
      </main>
    );
  }

  const texts2026 = collect2026Texts(analysis);

  return (
    <main className="inner">
      <section className="pageIntro">
        <span className="eyebrow">2026 FORTUNE</span>
        <h1>{saju.name ? `${saju.name}님의 2026년 운세` : "나의 2026년 운세"}</h1>
        <p>
          저장된 사주 정보와 AI 분석 결과에서 2026년과 관련된 내용을 정리해 보여드립니다.
        </p>
      </section>

      <section className="contentCard">
        <h2>입력된 사주 정보</h2>

        <div className="featureList">
          <div>
            <strong>생년월일</strong>
            <span>{saju.birth}</span>
          </div>
          <div>
            <strong>출생시간</strong>
            <span>{saju.time}</span>
          </div>
          <div>
            <strong>성별</strong>
            <span>{saju.gender || "-"}</span>
          </div>
          <div>
            <strong>달력 기준</strong>
            <span>{saju.calendar || "-"}</span>
          </div>
        </div>
      </section>

      <section className="contentCard">
        <h2>2026년 AI 분석</h2>

        {texts2026.length > 0 ? (
          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            {texts2026.map((text, index) => (
              <div
                key={`${index}-${text.slice(0, 24)}`}
                style={{
                  padding: "18px 20px",
                  borderRadius: 14,
                  background: "#f5f0e7",
                  lineHeight: 1.9,
                  color: "#5f584e",
                  whiteSpace: "pre-wrap",
                }}
              >
                {text}
              </div>
            ))}
          </div>
        ) : (
          <>
            <p>
              현재 저장된 AI 분석 결과에서 2026년 관련 항목을 별도로 찾지 못했습니다.
              종합 상세 사주 결과에서 전체 흐름을 확인해 주세요.
            </p>

            <Link href="/fortune/detail" className="primaryBtn inline">
              종합 상세 사주 보기
            </Link>
          </>
        )}
      </section>

      <section className="contentCard">
        <h2>안내</h2>
        <p>
          이 페이지는 사주 입력 전에 임의의 연간 점수나 1월~12월 점수를 표시하지 않습니다.
          향후 월별 운세를 별도 기능으로 확장할 경우에도 실제 사주 정보와 AI 분석 결과를
          기준으로 생성하도록 구성할 수 있습니다.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <Link href="/saju" className="ghostBtn inline">
            사주 다시 입력하기
          </Link>

          <Link href="/fortune/detail" className="ghostBtn inline">
            상세 사주 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
