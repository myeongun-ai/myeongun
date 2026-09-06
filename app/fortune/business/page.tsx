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

type YongshinInfo = {
  yongshin?: string;
  heesin?: string;
  reason?: string;
};

function renderBusinessResult(text: string) {
  return text.split("\n").map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={index} style={{ height: 10 }} />;
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={index}
          style={{
            margin: "30px 0 12px",
            fontSize: "21px",
            lineHeight: 1.5,
            color: "#2d2a24",
          }}
        >
          {trimmed.replace(/^##\s*/, "")}
        </h2>
      );
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h3
          key={index}
          style={{
            margin: "24px 0 10px",
            fontSize: "17px",
            lineHeight: 1.5,
            color: "#4a4338",
          }}
        >
          {trimmed.replace(/^###\s*/, "")}
        </h3>
      );
    }

    if (/^[-*]\s+/.test(trimmed)) {
      return (
        <div
          key={index}
          style={{
            margin: "8px 0",
            paddingLeft: 18,
            lineHeight: 1.85,
            color: "#625b50",
          }}
        >
          • {trimmed.replace(/^[-*]\s+/, "")}
        </div>
      );
    }

    return (
      <p
        key={index}
        style={{
          margin: "8px 0",
          lineHeight: 1.9,
          color: "#625b50",
        }}
      >
        {trimmed.replace(/\*\*/g, "")}
      </p>
    );
  });
}

export default function BusinessFortunePage() {
  const [saju, setSaju] = useState<Saju | null>(null);
  const [result, setResult] = useState("");
  const [yongshin, setYongshin] = useState<YongshinInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myeongun_saju");
      setSaju(saved ? JSON.parse(saved) : null);
    } catch {
      setSaju(null);
    } finally {
      setReady(true);
    }
  }, []);

  async function analyzeBusiness() {
    if (!saju?.birth || !saju?.time || !saju?.gender || !saju?.calendar) {
      setError("재물·사업운 분석에 필요한 사주 정보가 없습니다.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setYongshin(null);

    try {
      const response = await fetch("/api/fortune/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          name: saju.name || "고객",
          birth: saju.birth,
          time: saju.time,
          gender: saju.gender,
          calendar: saju.calendar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "재물·사업운 분석을 불러오지 못했습니다."
        );
      }

      const resultText = String(data?.result || "").trim();

      if (!resultText) {
        throw new Error("재물·사업운 분석 결과가 비어 있습니다.");
      }

      setResult(resultText);
      setYongshin(data?.yongshin || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "재물·사업운 분석 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <main className="inner">
        <section
          className="contentCard"
          style={{ textAlign: "center" }}
        >
          <p>사주 정보를 확인하고 있습니다...</p>
        </section>
      </main>
    );
  }

  if (!saju?.birth || !saju?.time) {
    return (
      <main className="inner">
        <section className="pageIntro">
          <span className="eyebrow">WEALTH · BUSINESS</span>
          <h1>재물·사업운</h1>
          <p>
            재물과 사업의 흐름을 분석하려면 먼저 사주 정보를 입력해 주세요.
          </p>
        </section>

        <section
          className="contentCard"
          style={{
            maxWidth: 760,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2>먼저 나의 사주를 입력해 주세요</h2>
          <p>
            생년월일과 출생시간을 입력하면 명운 만세력 엔진을 기준으로
            재물·사업운을 분석합니다.
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

        <h1>
          {saju.name
            ? `${saju.name}님의 재물·사업운`
            : "나의 재물·사업운"}
        </h1>

        <p>
          명운 만세력의 사주 구성과 오행·십성·신강신약을 바탕으로
          재물과 사업의 방향을 집중 분석합니다.
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

      {!result && (
        <section
          className="contentCard"
          style={{ textAlign: "center" }}
        >
          <span className="eyebrow">MONEY · BUSINESS ANALYSIS</span>

          <h2 style={{ marginTop: 10 }}>
            나의 재물·사업 흐름 분석
          </h2>

          <p
            style={{
              maxWidth: 650,
              margin: "12px auto 24px",
              lineHeight: 1.8,
            }}
          >
            재물 성향, 돈의 관리 방식, 사업가 성향, 직장과 사업의
            적합성, 투자·확장 시 주의점과 2026년 흐름을 분석합니다.
          </p>

          <button
            type="button"
            className="primaryBtn inline"
            onClick={analyzeBusiness}
            disabled={loading}
            style={{
              border: 0,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading
              ? "재물·사업운 분석 중..."
              : "재물·사업운 분석하기"}
          </button>

          {error && (
            <p
              style={{
                marginTop: 18,
                color: "#b0443c",
                lineHeight: 1.7,
              }}
            >
              {error}
            </p>
          )}
        </section>
      )}

      {result && (
        <>
          {yongshin && (
            <section className="contentCard">
              <span className="eyebrow">
                FIVE ELEMENTS GUIDE
              </span>

              <h2>재물·사업 참고 오행</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    background: "#f5f0e7",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#8a7d69",
                    }}
                  >
                    용신
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 7,
                      fontSize: 24,
                      color: "#342f27",
                    }}
                  >
                    {yongshin.yongshin || "-"}
                  </strong>
                </div>

                <div
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    background: "#f5f0e7",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#8a7d69",
                    }}
                  >
                    희신
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 7,
                      fontSize: 24,
                      color: "#342f27",
                    }}
                  >
                    {yongshin.heesin || "-"}
                  </strong>
                </div>
              </div>

              {yongshin.reason && (
                <p
                  style={{
                    margin: "15px 0 0",
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: "#777066",
                  }}
                >
                  {yongshin.reason}
                </p>
              )}
            </section>
          )}

          <section className="contentCard">
            <span className="eyebrow">
              WEALTH · BUSINESS REPORT
            </span>

            <h2>재물·사업운 집중 분석</h2>

            <div style={{ marginTop: 22 }}>
              {renderBusinessResult(result)}
            </div>

            <div
              style={{
                marginTop: 30,
                padding: 18,
                borderRadius: 14,
                background: "#f5f0e7",
                fontSize: 12,
                lineHeight: 1.8,
                color: "#777066",
              }}
            >
              본 분석은 전통 명리 관점을 참고한 AI 분석입니다.
              실제 투자·대출·사업 결정은 시장 상황과 재무 상태,
              관련 전문가의 조언을 함께 고려해 주세요.
            </div>

            <button
              type="button"
              onClick={analyzeBusiness}
              disabled={loading}
              style={{
                display: "block",
                margin: "24px auto 0",
                border: 0,
                background: "transparent",
                color: "#9b742f",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "다시 분석 중..." : "재물·사업운 다시 분석하기"}
            </button>
          </section>
        </>
      )}
    </main>
  );
}