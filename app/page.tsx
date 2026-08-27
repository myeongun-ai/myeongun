"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

const cards = [
  {
    icon: "🔮",
    title: "종합 사주",
    text: "나의 기질부터 대운까지",
    href: "/saju",
  },
  {
    icon: "💰",
    title: "재물·사업",
    text: "돈과 일의 흐름을 읽다",
    href: "/fortune/business",
  },
  {
    icon: "❤️",
    title: "궁합",
    text: "두 사람의 관계 흐름",
    href: "/compatibility",
  },
  {
    icon: "📅",
    title: "2026 운세",
    text: "올해의 큰 흐름과 월별 운",
    href: "/fortune/2026",
  },
];

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

const TIME_OPTIONS = [
  { value: "모름", label: "모름" },
  { value: "子(자) 23:30 ~ 01:29", label: "子(자)  23:30 ~ 01:29" },
  { value: "丑(축) 01:30 ~ 03:29", label: "丑(축)  01:30 ~ 03:29" },
  { value: "寅(인) 03:30 ~ 05:29", label: "寅(인)  03:30 ~ 05:29" },
  { value: "卯(묘) 05:30 ~ 07:29", label: "卯(묘)  05:30 ~ 07:29" },
  { value: "辰(진) 07:30 ~ 09:29", label: "辰(진)  07:30 ~ 09:29" },
  { value: "巳(사) 09:30 ~ 11:29", label: "巳(사)  09:30 ~ 11:29" },
  { value: "午(오) 11:30 ~ 13:29", label: "午(오)  11:30 ~ 13:29" },
  { value: "未(미) 13:30 ~ 15:29", label: "未(미)  13:30 ~ 15:29" },
  { value: "申(신) 15:30 ~ 17:29", label: "申(신)  15:30 ~ 17:29" },
  { value: "酉(유) 17:30 ~ 19:29", label: "酉(유)  17:30 ~ 19:29" },
  { value: "戌(술) 19:30 ~ 21:29", label: "戌(술)  19:30 ~ 21:29" },
  { value: "亥(해) 21:30 ~ 23:29", label: "亥(해)  21:30 ~ 23:29" },
];


function sameSaju(a: SajuForm, b: SajuForm) {
  return (
    a.name.trim() === b.name.trim() &&
    a.birth === b.birth &&
    a.time === b.time &&
    a.gender === b.gender &&
    a.calendar === b.calendar
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderFreeResult(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const nodes: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  function flushBullets() {
    if (!bulletBuffer.length) return;
    nodes.push(
      <ul className="homeResultList" key={`list-${nodes.length}`}>
        {bulletBuffer.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushBullets();
      return;
    }

    if (line.startsWith("### ")) {
      flushBullets();
      nodes.push(
        <h4 className="homeResultHeadingSmall" key={`h4-${index}`}>
          {renderInline(line.slice(4))}
        </h4>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushBullets();
      nodes.push(
        <h3 className="homeResultHeading" key={`h3-${index}`}>
          {renderInline(line.slice(3))}
        </h3>
      );
      return;
    }

    if (line.startsWith("# ")) {
      flushBullets();
      nodes.push(
        <h2 className="homeResultHeadingLarge" key={`h2-${index}`}>
          {renderInline(line.slice(2))}
        </h2>
      );
      return;
    }

    if (/^[-*]\s+/.test(line)) {
      bulletBuffer.push(line.replace(/^[-*]\s+/, ""));
      return;
    }

    flushBullets();
    nodes.push(
      <p className="homeResultParagraph" key={`p-${index}`}>
        {renderInline(line)}
      </p>
    );
  });

  flushBullets();
  return nodes;
}

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState<SajuForm>({
    name: "",
    birth: "",
    time: "",
    gender: "남성",
    calendar: "양력",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [freeResult, setFreeResult] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= lastDate; day++) {
    calendarDays.push(day);
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFreeResult("");
    setError("");
  };

  const selectDate = (day: number) => {
    const selected = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    setForm((prev) => ({
      ...prev,
      birth: selected,
    }));

    setCalendarOpen(false);
  };

  const previousMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  useEffect(() => {
    sessionStorage.removeItem("myeongun_session_active");
  }, []);

  async function tryReopenExistingPaidSaju(payload: SajuForm) {
    try {
      const savedText = localStorage.getItem("myeongun_saju");
      if (!savedText) return false;

      const saved = JSON.parse(savedText) as SajuForm;
      if (!sameSaju(saved, payload)) return false;

      const response = await fetch("/api/payment/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: payload.name.trim(),
          birth: payload.birth,
        }),
      });

      if (!response.ok) return false;

      const result = await response.json();
      if (!result?.ok) return false;

      sessionStorage.setItem("myeongun_session_active", "1");
      router.push("/fortune/detail");
      return true;
    } catch {
      return false;
    }
  }

  async function resetOldEntitlement() {
    try {
      await fetch("/api/payment/reset", {
        method: "POST",
        cache: "no-store",
      });
    } catch (resetError) {
      console.error("기존 결제 이용권 초기화 오류:", resetError);
    }

    localStorage.removeItem("myeongun_premium_result");
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFreeResult("");

    const payload: SajuForm = {
      name: form.name.trim(),
      birth: form.birth,
      time: form.time,
      gender: form.gender,
      calendar: form.calendar,
    };

    if (!payload.name || !payload.birth || !payload.time) {
      setError("이름, 생년월일, 출생시간을 모두 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const reopened = await tryReopenExistingPaidSaju(payload);
      if (reopened) return;

      await resetOldEntitlement();

      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsed = await response.json();

      if (!response.ok) {
        throw new Error(parsed?.error || "사주 분석에 실패했습니다.");
      }

      localStorage.setItem("myeongun_saju", JSON.stringify(payload));
      localStorage.setItem("myeongun_saju_result", JSON.stringify(parsed));

      const resultText = String(parsed?.result || "").trim();
      if (!resultText) {
        throw new Error("무료 사주 결과를 불러오지 못했습니다.");
      }

      setFreeResult(resultText);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "사주 분석 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1c2035 0%, #0c0d14 45%, #07080d 100%)",
        color: "#ffffff",
        fontFamily:
          "Arial, 'Noto Sans KR', 'Malgun Gothic', sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(7,8,13,0.88)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#f5e7c2",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "24px",
              letterSpacing: "-1px",
            }}
          >
            명운
          </Link>

          <nav
            style={{
              display: "flex",
              gap: "22px",
              fontSize: "14px",
            }}
          >
            <Link href="/saju" style={navStyle}>
              종합 사주
            </Link>
            <Link href="/fortune/business" style={navStyle}>
              재물·사업
            </Link>
            <Link href="/compatibility" style={navStyle}>
              궁합
            </Link>
            <Link href="/fortune/2026" style={navStyle}>
              2026 운세
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "90px 24px 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: "999px",
            background: "rgba(218,170,88,0.12)",
            color: "#dbaa58",
            fontSize: "13px",
            marginBottom: "22px",
          }}
        >
          YOUR FLOW · YOUR STORY
        </div>

        <h1
          style={{
            fontSize: "clamp(38px, 7vw, 72px)",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-4px",
            background:
              "linear-gradient(90deg, #ffffff, #f5e7c2, #dbaa58)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          당신의 흐름을 읽다
        </h1>

        <p
          style={{
            color: "#aeb1bd",
            fontSize: "17px",
            lineHeight: 1.8,
            marginTop: "24px",
          }}
        >
          명운은 생년월일과 출생시간을 바탕으로
          <br />
          당신의 삶의 흐름을 차분하게 살펴봅니다.
        </p>
      </section>

      {/* SERVICE CARDS */}
      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "10px 24px 70px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              style={{
                textDecoration: "none",
                color: "#ffffff",
              }}
            >
              <div
                style={{
                  padding: "26px",
                  minHeight: "145px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.045)",
                  transition: "transform 0.2s",
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "18px" }}>
                  {card.icon}
                </div>

                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: "19px",
                  }}
                >
                  {card.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#9fa3b2",
                    fontSize: "14px",
                  }}
                >
                  {card.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SAJU FORM */}
      <section
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "30px 24px 80px",
        }}
      >
        <div
          style={{
            background: "#151722",
            border: "1px solid rgba(218,170,88,0.2)",
            borderRadius: "26px",
            padding: "32px",
            boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div
              style={{
                color: "#dbaa58",
                fontSize: "13px",
                letterSpacing: "2px",
              }}
            >
              FREE SAJU
            </div>

            <h2
              style={{
                margin: "10px 0",
                fontSize: "28px",
              }}
            >
              무료 사주 분석
            </h2>

            <p
              style={{
                color: "#969aa9",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              생년월일과 출생시간을 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* NAME */}
            <label style={labelStyle}>이름</label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              style={inputStyle}
            />

            {/* BIRTH */}
            <label style={labelStyle}>생년월일</label>

            <div style={{ position: "relative" }}>
              <input
                  name="birth"
                  value={form.birth}
                  type="text"
                  readOnly
                  placeholder="년-월-일"
                  onClick={() => setCalendarOpen(true)}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                    paddingRight: "86px",
                  }}
                />

              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "8px",
                  height: "44px",
                  border: "0",
                  borderRadius: "10px",
                  background: "#242735",
                  color: "#f5e7c2",
                  padding: "0 14px",
                  cursor: "pointer",
                }}
              >
                달력
              </button>
            </div>

            {/* CUSTOM CALENDAR */}
            {calendarOpen && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "20px",
                  background: "#0f1119",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                  }}
                >
                  <button
                    type="button"
                    onClick={previousMonth}
                    style={calendarButtonStyle}
                  >
                    ‹
                  </button>

                  <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        minWidth: "210px",
                      }}
                    >
                      <select
                        aria-label="연도 선택"
                        value={year}
                        onChange={(e) =>
                          setViewDate(
                            new Date(Number(e.target.value), month, 1)
                          )
                        }
                        style={{
                          minWidth: 0,
                          height: "38px",
                          border: "1px solid rgba(255,255,255,0.14)",
                          borderRadius: "9px",
                          background: "#171a24",
                          color: "#fff",
                          padding: "0 8px",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {Array.from(
                          {
                            length:
                              new Date().getFullYear() - 1930 + 1,
                          },
                          (_, i) => new Date().getFullYear() - i
                        ).map((itemYear) => (
                          <option key={itemYear} value={itemYear}>
                            {itemYear}년
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="월 선택"
                        value={month}
                        onChange={(e) =>
                          setViewDate(
                            new Date(year, Number(e.target.value), 1)
                          )
                        }
                        style={{
                          minWidth: 0,
                          height: "38px",
                          border: "1px solid rgba(255,255,255,0.14)",
                          borderRadius: "9px",
                          background: "#171a24",
                          color: "#fff",
                          padding: "0 8px",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => i).map(
                          (itemMonth) => (
                            <option key={itemMonth} value={itemMonth}>
                              {itemMonth + 1}월
                            </option>
                          )
                        )}
                      </select>
                    </div>

                  <button
                    type="button"
                    onClick={nextMonth}
                    style={calendarButtonStyle}
                  >
                    ›
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "6px",
                    textAlign: "center",
                  }}
                >
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      style={{
                        padding: "8px 0",
                        color: "#dbaa58",
                        fontSize: "12px",
                      }}
                    >
                      {day}
                    </div>
                  ))}

                  {calendarDays.map((day, index) =>
                    day === null ? (
                      <div key={`empty-${index}`} />
                    ) : (
                      <button
                        key={day}
                        type="button"
                        onClick={() => selectDate(day)}
                        style={{
                          border: "0",
                          borderRadius: "9px",
                          padding: "9px 0",
                          background:
                            form.birth ===
                            `${year}-${String(month + 1).padStart(
                              2,
                              "0"
                            )}-${String(day).padStart(2, "0")}`
                              ? "#dbaa58"
                              : "rgba(255,255,255,0.05)",
                          color:
                            form.birth ===
                            `${year}-${String(month + 1).padStart(
                              2,
                              "0"
                            )}-${String(day).padStart(2, "0")}`
                              ? "#111"
                              : "#ddd",
                          cursor: "pointer",
                        }}
                      >
                        {day}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* TIME */}
            <label style={labelStyle}>출생시간</label>

            <select
              name="time"
              value={form.time}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="" disabled>
                시간을 선택하세요
              </option>

              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* GENDER */}
            <label style={labelStyle}>성별</label>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="남성">남성</option>
              <option value="여성">여성</option>
            </select>

            {/* CALENDAR TYPE */}
            <label style={labelStyle}>달력 기준</label>

            <select
              name="calendar"
              value={form.calendar}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="양력">양력</option>
              <option value="음력">음력</option>
            </select>

            {error && (
              <p
                style={{
                  margin: "18px 0 0",
                  color: "#ff8f85",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "24px",
                padding: "17px",
                border: "0",
                borderRadius: "14px",
                background: loading ? "#65583e" : "#dbaa58",
                color: "#111",
                fontSize: "16px",
                fontWeight: 800,
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "분석 중입니다..." : "무료 사주 분석 시작"}
            </button>

            <p
              style={{
                textAlign: "center",
                color: "#777b88",
                fontSize: "12px",
                marginTop: "14px",
                marginBottom: 0,
              }}
            >
              입력하신 정보는 사주 분석을 위한 용도로 사용됩니다.
            </p>
          </form>
        </div>
      </section>

      {/* RESULT */}
      {freeResult && (
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 24px 80px",
          }}
        >
          <div
            style={{
              background: "#151722",
              border: "1px solid rgba(218,170,88,0.25)",
              borderRadius: "24px",
              padding: "34px",
            }}
          >
            <div
              style={{
                color: "#dbaa58",
                fontSize: "12px",
                letterSpacing: "2px",
                marginBottom: "12px",
              }}
            >
              FREE SAJU RESULT
            </div>

            <h2
              style={{
                margin: "0 0 20px",
                fontSize: "28px",
                color: "#f5e7c2",
              }}
            >
              {form.name || "고객"}님의 무료 사주 분석
            </h2>

            <div className="homeResultText">
              {renderFreeResult(freeResult)}
            </div>

            <div
              style={{
                marginTop: "30px",
                padding: "28px",
                background:
                  "linear-gradient(135deg, rgba(218,170,88,0.12), rgba(255,255,255,0.03))",
                border: "1px solid rgba(218,170,88,0.22)",
                borderRadius: "18px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#dbaa58",
                  fontSize: "12px",
                  letterSpacing: "2px",
                }}
              >
                PREMIUM SAJU REPORT
              </div>

              <h3
                style={{
                  fontSize: "23px",
                  color: "#f5e7c2",
                  margin: "10px 0",
                }}
              >
                더 깊은 상세 사주 분석이 필요하신가요?
              </h3>

              <p
                style={{
                  color: "#aeb1bd",
                  lineHeight: 1.8,
                  margin: "0 0 18px",
                }}
              >
                재물운, 사업운, 직업운, 인간관계, 2026년 운세,
                <br />
                장기 흐름까지 개인별 프리미엄 분석을 확인할 수 있습니다.
              </p>

              <Link
                href="/payment"
                style={{
                  display: "inline-block",
                  padding: "14px 28px",
                  borderRadius: "12px",
                  background: "#dbaa58",
                  color: "#111",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                상세 사주 분석 보기 · 9,900원
              </Link>
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        .homeResultText {
          padding: 24px;
          border-radius: 16px;
          background: rgba(255,255,255,0.045);
          color: #d4d6df;
          font-size: 15px;
          line-height: 1.95;
        }
        .homeResultText :global(.homeResultHeadingLarge) {
          margin: 26px 0 12px;
          color: #f5e7c2;
          font-size: 24px;
          line-height: 1.4;
        }
        .homeResultText :global(.homeResultHeading) {
          margin: 24px 0 10px;
          color: #e7b85c;
          font-size: 20px;
          line-height: 1.45;
        }
        .homeResultText :global(.homeResultHeadingSmall) {
          margin: 20px 0 8px;
          color: #f1d89e;
          font-size: 17px;
          line-height: 1.5;
        }
        .homeResultText :global(.homeResultParagraph) {
          margin: 0 0 12px;
        }
        .homeResultText :global(.homeResultList) {
          margin: 8px 0 18px;
          padding-left: 22px;
        }
        .homeResultText :global(.homeResultList li) {
          margin-bottom: 7px;
        }
        .homeResultText :global(strong) {
          color: #fff0c9;
          font-weight: 800;
        }
        @media (max-width: 640px) {
          .homeResultText {
            padding: 18px;
            font-size: 14px;
          }
          .homeResultText :global(.homeResultHeadingLarge) {
            font-size: 21px;
          }
          .homeResultText :global(.homeResultHeading) {
            font-size: 18px;
          }
        }
      `}</style>

      {/* AI BANNER */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px 90px",
        }}
      >
        <div
          style={{
            padding: "30px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, #191b28, #10121b)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#dbaa58",
                fontSize: "12px",
                letterSpacing: "2px",
                marginBottom: "8px",
              }}
            >
              명운 AI
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "23px",
              }}
            >
              사주에 대해 궁금한 것이 있나요?
            </h2>

            <p
              style={{
                color: "#969aa9",
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              재물, 사업, 직업, 연애, 인간관계 등
              <br />
              궁금한 내용을 AI와 대화해보세요.
            </p>
          </div>

          <Link
            href="/ai"
            style={{
              display: "inline-block",
              padding: "14px 24px",
              borderRadius: "12px",
              background: "#dbaa58",
              color: "#111",
              textDecoration: "none",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            AI 상담 시작 →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "30px 24px",
          textAlign: "center",
          color: "#666b79",
          fontSize: "12px",
        }}
      >
        <div style={{ marginBottom: "8px", color: "#969aa9" }}>
          명운 · Myeongun
        </div>

        <div>
          본 서비스는 사주와 운세에 대한 참고 정보를 제공합니다.
          <br />
          중요한 결정은 본인의 판단과 책임하에 이루어져야 합니다.
        </div>
      </footer>
    </main>
  );
}

const navStyle = {
  color: "#aeb1bd",
  textDecoration: "none",
};

const labelStyle = {
  display: "block",
  color: "#d9dbe3",
  fontSize: "14px",
  marginBottom: "8px",
  marginTop: "18px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px 15px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#0f1119",
  color: "#ffffff",
  outline: "none",
  fontSize: "15px",
};

const calendarButtonStyle = {
  width: "34px",
  height: "34px",
  border: "0",
  borderRadius: "9px",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontSize: "22px",
  cursor: "pointer",
};