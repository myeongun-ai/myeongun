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
    gender: "?⑥꽦",
    calendar: "?묐젰",
  });

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!form.name || !form.birth || !form.time) {
      setError("?대쫫, ?앸뀈?붿씪, 異쒖깮?쒓컙??紐⑤몢 ?낅젰??二쇱꽭??");
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
        throw new Error(data.error || "?ъ＜ 遺꾩꽍 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
      }

      if (!data.result) {
        throw new Error("遺꾩꽍 寃곌낵瑜?諛쏆븘?ㅼ? 紐삵뻽?듬땲??");
      }

      let parsed: Result;

      try {
        parsed =
          typeof data.result === "string"
            ? JSON.parse(data.result)
            : data.result;
      } catch {
        parsed = {
          title: `${form.name}?섏쓽 醫낇빀 ?ъ＜ 遺꾩꽍`,
          summary: data.result,
          sections: [
            {
              name: "醫낇빀 ?ъ＜ 遺꾩꽍",
              text: data.result,
            },
          ],
        };
      }

      localStorage.setItem("myeongun_saju", JSON.stringify(form));
      setResult(parsed);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "?ъ＜ 遺꾩꽍 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎."
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
            ?섏쓽 醫낇빀 ?ъ＜
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#777",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            ?섏쓽 湲곗쭏怨??щЪ 쨌 ?ъ뾽 쨌 ?몄뿰 쨌 ??댁쓽 ?먮쫫??
            <br />
            ?쒕늿???댄렣蹂댁꽭??
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
            ?섏쓽 ?ъ＜ ?뺣낫 ?낅젰
          </h2>

          <p
            style={{
              margin: "0 0 25px",
              color: "#777",
              fontSize: "13px",
            }}
          >
            ?뺥솗???ъ＜ 遺꾩꽍???꾪빐 ?앸뀈?붿씪怨?異쒖깮?쒓컙???낅젰?댁＜?몄슂.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "18px",
              }}
            >
              <label>
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
                ?앸뀈?붿씪
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
                異쒖깮?쒓컙
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
                ?깅퀎
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
                  <option value="?⑥꽦">?⑥꽦</option>
                  <option value="?ъ꽦">?ъ꽦</option>
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
                ?щ젰 湲곗?
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
                  <option value="?묐젰">?묐젰</option>
                  <option value="?뚮젰">?뚮젰</option>
                </select>
              </label>
            </div>

            <button
  type="submit"
  disabled={loading}
  style={{
    width: "100%",
    border: "none",
    borderRadius: "10px",
    padding: "17px",
    background: "#20251f",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: loading ? "wait" : "pointer",
  }}
>
  {loading ? "사주 분석 중..." : "사주 분석 시작"}
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
                ??源딆? ?ъ＜ 遺꾩꽍???꾩슂?섏떊媛??
              </h3>

              <p
                style={{
                  margin: "0 0 18px",
                  color: "#d8d8d2",
                  lineHeight: 1.75,
                  fontSize: "13px",
                }}
              >
                ?됱깮 ?댁꽭 쨌 ?щЪ 쨌 ?ъ뾽 쨌 吏곸뾽 쨌 ?멸컙愿怨?쨌 2026???댁꽭瑜?
                <br />
                ???먯꽭?섍쾶 遺꾩꽍???쒕┰?덈떎.
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
                ?뵏 ?곸꽭 ?ъ＜ 遺꾩꽍 蹂닿린 쨌 9,900????
              </Link>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "11px",
                  color: "#999",
                }}
              >
                寃곗젣 ???꾨━誘몄뾼 ?곸꽭 遺꾩꽍 寃곌낵瑜??뺤씤?????덉뒿?덈떎.
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
              ??蹂?寃곌낵???꾪넻 ?ъ＜ 紐낅━??愿?먯쓣 李멸퀬??AI 遺꾩꽍?대ŉ,
              誘몃옒瑜??뺤젙?곸쑝濡??덉륫?섎뒗 ?댁슜? ?꾨떃?덈떎.
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
            紐낆슫
          </div>

          <div>
            ?꾪넻 紐낅━?숈쓣 諛뷀깢?쇰줈 ??AI ?ъ＜ 遺꾩꽍 ?쒕퉬?ㅼ엯?덈떎.
          </div>

          <div>짤 2026 MYEONGUN 쨌 myeongun.kr</div>
        </footer>
      </div>
    </main>
  );
}


