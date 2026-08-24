"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ResultSection = {
  name: string;
  text: string;
};

type Result = {
  title: string;
  summary: string;
  sections: ResultSection[];
};

export default function SajuPage() {
  const [form, setForm] = useState({
    name: "",
    birth: "",
    time: "",
    gender: "남성",
    calendar: "양력",
  });

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!form.name || !form.birth || !form.time) {
      setError("이름, 생년월일, 출생시간을 모두 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "사주 분석 중 오류가 발생했습니다.");
      }

      if (!data.result) {
        throw new Error("분석 결과를 받아오지 못했습니다.");
      }

      let parsed: Result;

      try {
        parsed =
          typeof data.result === "string"
            ? JSON.parse(data.result)
            : data.result;
      } catch {
        parsed = {
          title: `${form.name}님의 종합 사주 분석`,
          summary: data.result,
          sections: [
            {
              name: "종합 사주 분석",
              text: data.result,
            },
          ],
        };
      }

      setResult(parsed);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "사주 분석 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f1e7",
        color: "#252b26",
        paddingBottom: "70px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "60px 20px",
        }}
      >
        {/* HEADER */}
        <section
          style={{
            textAlign: "center",
            marginBottom: "38px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              color: "#a27b35",
              marginBottom: "12px",
            }}
          >
            MY SAJU
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "42px",
              fontWeight: 500,
              letterSpacing: "-2px",
            }}
          >
            나의 종합 사주
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#777",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            나의 기질과 재물 · 사업 · 인연 · 대운의 흐름을
            <br />
            한눈에 살펴보세요.
          </p>
        </section>

        {/* INPUT */}
        <section
          style={{
            background: "#fffdf8",
            border: "1px solid #e2d8c8",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 4px 20px rgba(50,40,20,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "1.5px",
              color: "#a27b35",
              marginBottom: "8px",
            }}
          >
            SAJU INPUT
          </div>

          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "24px",
              letterSpacing: "-1px",
            }}
          >
            나의 사주 정보 입력
          </h2>

          <p
            style={{
              margin: "0 0 25px",
              color: "#777",
              fontSize: "13px",
            }}
          >
            정확한 사주 분석을 위해 생년월일과 출생시간을 입력해주세요.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "18px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                이름
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="이름을 입력하세요"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 12px",
                    border: "1px solid #d9cfbf",
                    borderRadius: "8px",
                    background: "#fff",
                    fontSize: "14px",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                생년월일
                <input
                  type="date"
                  value={form.birth}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      birth: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 12px",
                    border: "1px solid #d9cfbf",
                    borderRadius: "8px",
                    background: "#fff",
                    fontSize: "14px",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                출생시간
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      time: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 12px",
                    border: "1px solid #d9cfbf",
                    borderRadius: "8px",
                    background: "#fff",
                    fontSize: "14px",
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                성별
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      gender: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 12px",
                    border: "1px solid #d9cfbf",
                    borderRadius: "8px",
                    background: "#fff",
                    fontSize: "14px",
                  }}
                >
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                달력 기준
                <select
                  value={form.calendar}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      calendar: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 12px",
                    border: "1px solid #d9cfbf",
                    borderRadius: "8px",
                    background: "#fff",
                    fontSize: "14px",
                  }}
                >
                  <option value="양력">양력</option>
                  <option value="음력">음력</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "24px",
                minHeight: "56px",
                border: "none",
                borderRadius: "10px",
                background: "#252b26",
                color: "#f5e7c2",
                fontSize: "15px",
                fontWeight: 800,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "분석 중입니다..." : "무료 사주 분석 시작 →"}
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "13px",
                borderRadius: "8px",
                background: "#fff1f0",
                color: "#b42318",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          )}
        </section>

        {/* RESULT */}
        {result && (
          <section
            style={{
              marginTop: "28px",
              background: "#fffdf8",
              border: "1px solid #e2d8c8",
              borderRadius: "16px",
              padding: "28px",
            }}
          >
            <div
              style={{
                textAlign: "center",
                paddingBottom: "24px",
                borderBottom: "1px solid #e5dccd",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "1.5px",
                  color: "#a27b35",
                  marginBottom: "10px",
                }}
              >
                AI SAJU REPORT
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "30px",
                  fontWeight: 500,
                  letterSpacing: "-1px",
                }}
              >
                {result.title}
              </h2>

              <p
                style={{
                  margin: "15px 0 0",
                  color: "#666",
                  lineHeight: 1.8,
                  fontSize: "14px",
                }}
              >
                {result.summary}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: "14px",
                marginTop: "24px",
              }}
            >
              {result.sections?.map((section, index) => (
                <article
                  key={`${section.name}-${index}`}
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    background: "#f8f3e9",
                    border: "1px solid #e8dece",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: "17px",
                      color: "#252b26",
                    }}
                  >
                    {section.name}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#555",
                      lineHeight: 1.85,
                      fontSize: "14px",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {section.text}
                  </p>
                </article>
              ))}
            </div>

            {/* PREMIUM */}
            <div
              style={{
                marginTop: "28px",
                padding: "24px",
                borderRadius: "14px",
                background: "#252b26",
                color: "#f5e7c2",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "1.5px",
                  color: "#d0aa58",
                  marginBottom: "9px",
                }}
              >
                PREMIUM SAJU REPORT
              </div>

              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "21px",
                  color: "#f5e7c2",
                }}
              >
                더 깊은 사주 분석이 필요하신가요?
              </h3>

              <p
                style={{
                  margin: "0 0 18px",
                  color: "#d8d8d2",
                  lineHeight: 1.75,
                  fontSize: "13px",
                }}
              >
                평생 운세 · 재물 · 사업 · 직업 · 인간관계 · 2026년 운세를
                <br />
                더 자세하게 분석해 드립니다.
              </p>

              <Link
                href="/payment"
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "15px 10px",
                  background: "#d0aa58",
                  color: "#252b26",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                🔒 상세 사주 분석 보기 · 9,900원 →
              </Link>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "11px",
                  color: "#999",
                }}
              >
                결제 후 프리미엄 상세 분석 결과를 확인할 수 있습니다.
              </p>
            </div>

            {/* NOTICE */}
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "10px",
                background: "#f7f1e6",
                color: "#777",
                fontSize: "11px",
                lineHeight: 1.7,
              }}
            >
              ※ 본 결과는 전통 사주 명리의 관점을 참고한 AI 분석이며,
              미래를 확정적으로 예측하는 내용은 아닙니다.
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer
          style={{
            textAlign: "center",
            marginTop: "55px",
            color: "#999",
            fontSize: "11px",
            lineHeight: 1.8,
          }}
        >
          <div
            style={{
              fontSize: "16px",
              color: "#a27b35",
              marginBottom: "5px",
            }}
          >
            명운
          </div>

          <div>
            전통 명리학을 바탕으로 한 AI 사주 분석 서비스입니다.
          </div>

          <div>© 2026 MYEONGUN · myeongun.kr</div>
        </footer>
      </div>
    </main>
  );
}