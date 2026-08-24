"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Result = {
  title: string;
  summary: string;
  sections: {
    name: string;
    text: string;
  }[];
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

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    birth: "",
    time: "",
    gender: "남성",
    calendar: "양력",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.birth) {
      alert("생년월일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setResult(null);

    setTimeout(() => {
      setResult({
        title: `${form.name || "귀하"}님의 사주 분석`,
        summary:
          "입력하신 생년월일과 시간을 기준으로 전체적인 운의 흐름을 살펴봅니다.",
        sections: [
          {
            name: "전체 운세",
            text: "현재의 흐름을 차분하게 정리하고 앞으로의 방향을 살펴보는 시기입니다. 중요한 결정은 충분히 생각한 뒤 움직이는 것이 좋습니다.",
          },
          {
            name: "재물·사업운",
            text: "새로운 기회를 무조건 크게 확장하기보다는 현재 가진 자원과 경험을 활용하는 전략이 유리합니다. 장기적인 관점에서 안정적인 수익 구조를 만드는 것이 중요합니다.",
          },
          {
            name: "직업·사업",
            text: "본인의 경험과 전문성을 활용할수록 강점이 살아나는 흐름입니다. 사람과의 연결을 통해 새로운 기회가 만들어질 가능성도 있습니다.",
          },
          {
            name: "인간관계",
            text: "가까운 사람들과의 소통이 중요한 시기입니다. 자신의 생각만 고집하기보다 상대방의 입장을 함께 살펴보면 관계가 더욱 좋아질 수 있습니다.",
          },
          {
            name: "건강·생활",
            text: "무리해서 한 번에 많은 것을 해결하기보다 규칙적인 생활과 충분한 휴식을 유지하는 것이 좋습니다.",
          },
        ],
      });

      setLoading(false);
    }, 800);
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
                onChange={handleChange}
                type="date"
                style={inputStyle}
              />

              <button
                type="button"
                onClick={() => setCalendarOpen(!calendarOpen)}
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

                  <strong>
                    {year}년 {month + 1}월
                  </strong>

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

            <input
              name="time"
              value={form.time}
              onChange={handleChange}
              type="time"
              style={inputStyle}
            />

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
      {result && (
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
              SAJU RESULT
            </div>

            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "28px",
                color: "#f5e7c2",
              }}
            >
              {result.title}
            </h2>

            <p
              style={{
                color: "#aeb1bd",
                lineHeight: 1.8,
                marginBottom: "28px",
              }}
            >
              {result.summary}
            </p>

            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {result.sections.map((section) => (
                <article
                  key={section.name}
                  style={{
                    padding: "20px",
                    background: "rgba(255,255,255,0.045)",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <h3
                    style={{
                      color: "#f5e7c2",
                      margin: "0 0 10px",
                      fontSize: "17px",
                    }}
                  >
                    {section.name}
                  </h3>

                  <p
                    style={{
                      color: "#aeb1bd",
                      lineHeight: 1.8,
                      margin: 0,
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
                더 깊은 사주 분석이 필요하신가요?
              </h3>

              <p
                style={{
                  color: "#aeb1bd",
                  lineHeight: 1.8,
                  margin: "0 0 18px",
                }}
              >
                대운, 재물운, 사업운, 직업운, 인간관계 등
                <br />
                보다 상세한 분석을 확인할 수 있습니다.
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