"use client";

import { FormEvent, useMemo, useState } from "react";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

type YongshinInfo = {
  yongshin?: string;
  heesin?: string;
  reason?: string;
};

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

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseBirth(value: string) {
  const [y, m, d] = value.split("-").map(Number);

  if (!y || !m || !d) {
    return null;
  }

  return {
    year: y,
    month: m,
    day: d,
  };
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

function renderBusinessResult(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  type ResultSection = {
    title: string;
    content: string[];
  };

  const intro: string[] = [];
  const sections: ResultSection[] = [];
  let currentSection: ResultSection | null = null;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    if (line.startsWith("## ")) {
      currentSection = {
        title: line.slice(3).trim(),
        content: [],
      };

      sections.push(currentSection);
      return;
    }

    if (line.startsWith("# ")) {
      intro.push(line.slice(2).trim());
      return;
    }

    if (currentSection) {
      currentSection.content.push(line);
    } else {
      intro.push(line);
    }
  });

  function renderSectionContent(
    content: string[],
    sectionIndex: number
  ) {
    const nodes: React.ReactNode[] = [];
    let bullets: string[] = [];

    function flushBullets() {
      if (!bullets.length) {
        return;
      }

      nodes.push(
        <ul
          className="businessResultList"
          key={`section-${sectionIndex}-list-${nodes.length}`}
        >
          {bullets.map((item, index) => (
            <li key={`${sectionIndex}-${index}-${item}`}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );

      bullets = [];
    }

    content.forEach((line, lineIndex) => {
      if (/^[-*]\s+/.test(line)) {
        bullets.push(line.replace(/^[-*]\s+/, ""));
        return;
      }

      flushBullets();

      if (line.startsWith("### ")) {
        nodes.push(
          <h4
            className="businessHeadingSmall"
            key={`section-${sectionIndex}-h4-${lineIndex}`}
          >
            {renderInline(line.slice(4))}
          </h4>
        );
        return;
      }

      nodes.push(
        <p
          className="businessParagraph"
          key={`section-${sectionIndex}-p-${lineIndex}`}
        >
          {renderInline(line)}
        </p>
      );
    });

    flushBullets();

    return nodes;
  }

  function getSectionNumber(title: string) {
    const match = title.match(/^(\d+)\./);
    return match?.[1] || "";
  }

  function getSectionTitle(title: string) {
    return title.replace(/^\d+\.\s*/, "");
  }

  return (
    <div className="premiumBusinessResult">
      {intro.length > 0 && (
        <section className="businessIntroCard">
          <div className="businessIntroMark">MYEONGUN</div>

          {intro.map((line, index) => (
            <p
              className="businessParagraph"
              key={`intro-${index}`}
            >
              {renderInline(line)}
            </p>
          ))}
        </section>
      )}

      <div className="businessSectionGrid">
        {sections.map((section, index) => {
          const number = getSectionNumber(section.title);
          const title = getSectionTitle(section.title);

          return (
            <section
              className="businessAnalysisCard"
              key={`${section.title}-${index}`}
            >
              <header className="businessAnalysisHeader">
                {number && (
                  <div className="businessSectionNumber">
                    {number.padStart(2, "0")}
                  </div>
                )}

                <div className="businessSectionTitleWrap">
                  <span className="businessSectionLabel">
                    WEALTH · BUSINESS
                  </span>

                  <h3 className="businessHeading">
                    {renderInline(title)}
                  </h3>
                </div>
              </header>

              <div className="businessAnalysisContent">
                {renderSectionContent(
                  section.content,
                  index
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function BusinessFortunePage() {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [form, setForm] = useState<SajuForm>({
    name: "",
    birth: "",
    time: "",
    gender: "남성",
    calendar: "양력",
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentYear);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [yongshin, setYongshin] = useState<YongshinInfo | null>(null);

  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1930 + 1 },
        (_, index) => currentYear - index
      ),
    [currentYear]
  );

  const parsedBirth = parseBirth(form.birth);
  const monthDays = daysInMonth(pickerYear, pickerMonth);
  const firstDay = new Date(pickerYear, pickerMonth - 1, 1).getDay();

  function update<K extends keyof SajuForm>(
    key: K,
    value: SajuForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setResult("");
    setYongshin(null);
    setError("");
  }

  function openPicker() {
    const parsed = parseBirth(form.birth);

    if (parsed) {
      setPickerYear(parsed.year);
      setPickerMonth(parsed.month);
    }

    setPickerOpen(true);
  }

  function moveMonth(delta: number) {
    let year = pickerYear;
    let month = pickerMonth + delta;

    if (month < 1) {
      month = 12;
      year -= 1;
    }

    if (month > 12) {
      month = 1;
      year += 1;
    }

    if (year < 1930 || year > currentYear) {
      return;
    }

    setPickerYear(year);
    setPickerMonth(month);
  }

  function selectDay(day: number) {
    update(
      "birth",
      `${pickerYear}-${pad2(pickerMonth)}-${pad2(day)}`
    );

    setPickerOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResult("");
    setYongshin(null);

    const payload: SajuForm = {
      name: form.name.trim(),
      birth: form.birth,
      time: form.time,
      gender: form.gender,
      calendar: form.calendar,
    };

    if (!payload.name || !payload.birth || !payload.time) {
      setError("이름, 생년월일, 출생시간을 모두 선택해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/fortune/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "재물·사업운 분석을 불러오지 못했습니다."
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

  function resetAnalysis() {
    setForm({
      name: "",
      birth: "",
      time: "",
      gender: "남성",
      calendar: "양력",
    });

    setResult("");
    setYongshin(null);
    setError("");
    setPickerOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: 700,
    color: "#4d473e",
  } as const;

  const fieldStyle = {
    width: "100%",
    minHeight: "52px",
    marginTop: "9px",
    padding: "0 14px",
    border: "1px solid #d8d0c3",
    borderRadius: "10px",
    background: "#fff",
    color: "#302c26",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  } as const;

  const smallButtonStyle = {
    minHeight: "44px",
    border: "1px solid #d8d0c3",
    borderRadius: "9px",
    background: "#fff",
    color: "#4d473e",
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  return (
    <main className="businessPage">
      <section className="businessHero">
        <span className="eyebrow">WEALTH · BUSINESS</span>
        <h1>재물·사업운</h1>
        <p>
          생년월일과 출생시간을 입력하면 명운 만세력 엔진을
          기준으로 재물과 사업의 흐름을 집중 분석합니다.
        </p>
      </section>

      {!result && (
        <section className="businessCard inputCard">
          <div className="cardTitle">
            <span>MYEONGUN BUSINESS</span>
            <h2>재물·사업운 정보 입력</h2>
            <p>
              분석할 분의 정보를 직접 입력해 주세요.
              이전에 입력한 사주 정보는 자동으로 불러오지 않습니다.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>
              이름
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  update("name", event.target.value)
                }
                placeholder="이름을 입력하세요"
                autoComplete="off"
                style={fieldStyle}
              />
            </label>

            <label
              style={{
                ...labelStyle,
                marginTop: "22px",
              }}
            >
              생년월일

              <div className="birthRow">
                <input
                  name="birth"
                  type="text"
                  readOnly
                  required
                  value={form.birth}
                  placeholder="년-월-일"
                  onClick={openPicker}
                  style={{
                    ...fieldStyle,
                    cursor: "pointer",
                  }}
                />

                <button
                  type="button"
                  onClick={openPicker}
                  className="calendarButton"
                >
                  달력
                </button>
              </div>
            </label>

            {pickerOpen && (
              <section className="datePicker">
                <div className="pickerTop">
                  <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    aria-label="이전 월"
                    style={smallButtonStyle}
                  >
                    ‹
                  </button>

                  <select
                    aria-label="연도 선택"
                    value={pickerYear}
                    onChange={(event) =>
                      setPickerYear(Number(event.target.value))
                    }
                    style={{
                      ...fieldStyle,
                      minHeight: "44px",
                      marginTop: 0,
                      padding: "0 10px",
                    }}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="월 선택"
                    value={pickerMonth}
                    onChange={(event) =>
                      setPickerMonth(Number(event.target.value))
                    }
                    style={{
                      ...fieldStyle,
                      minHeight: "44px",
                      marginTop: 0,
                      padding: "0 10px",
                    }}
                  >
                    {Array.from(
                      { length: 12 },
                      (_, index) => index + 1
                    ).map((month) => (
                      <option key={month} value={month}>
                        {month}월
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => moveMonth(1)}
                    aria-label="다음 월"
                    style={smallButtonStyle}
                  >
                    ›
                  </button>
                </div>

                <div className="calendarGrid">
                  {[
                    "일",
                    "월",
                    "화",
                    "수",
                    "목",
                    "금",
                    "토",
                  ].map((dayName) => (
                    <div
                      key={dayName}
                      className="calendarDayName"
                    >
                      {dayName}
                    </div>
                  ))}

                  {Array.from({
                    length: firstDay,
                  }).map((_, index) => (
                    <div key={`blank-${index}`} />
                  ))}

                  {Array.from(
                    { length: monthDays },
                    (_, index) => index + 1
                  ).map((day) => {
                    const selected =
                      parsedBirth?.year === pickerYear &&
                      parsedBirth?.month === pickerMonth &&
                      parsedBirth?.day === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => selectDay(day)}
                        className={
                          selected
                            ? "calendarDay selected"
                            : "calendarDay"
                        }
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="pickerBottom">
                  <button
                    type="button"
                    onClick={() => {
                      update("birth", "");
                      setPickerOpen(false);
                    }}
                    style={{
                      ...smallButtonStyle,
                      padding: "0 16px",
                    }}
                  >
                    삭제
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    style={{
                      ...smallButtonStyle,
                      padding: "0 16px",
                    }}
                  >
                    닫기
                  </button>
                </div>
              </section>
            )}

            <label
              style={{
                ...labelStyle,
                marginTop: "22px",
              }}
            >
              출생시간

              <select
                name="time"
                value={form.time}
                onChange={(event) =>
                  update("time", event.target.value)
                }
                required
                className="businessSelect"
              >
                <option value="" disabled>
                  시간을 선택하세요
                </option>

                {TIME_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="twoCol">
              <label style={labelStyle}>
                성별

                <select
                  name="gender"
                  value={form.gender}
                  onChange={(event) =>
                    update("gender", event.target.value)
                  }
                  className="businessSelect"
                >
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </label>

              <label style={labelStyle}>
                달력

                <select
                  name="calendar"
                  value={form.calendar}
                  onChange={(event) =>
                    update("calendar", event.target.value)
                  }
                  className="businessSelect"
                >
                  <option value="양력">양력</option>
                  <option value="음력">음력(평달)</option>
                  <option value="음력(윤달)">
                    음력(윤달)
                  </option>
                </select>
              </label>
            </div>

            {error && (
              <p className="errorMessage">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="analyzeButton"
            >
              {loading
                ? "재물·사업운 분석 중..."
                : "재물·사업운 분석하기"}
            </button>
          </form>

          <p className="privacyText">
            입력하신 정보는 현재 재물·사업운 분석을 위한
            용도로만 사용하며, 이 페이지에서 이전 사주 정보를
            자동으로 불러오지 않습니다.
          </p>
        </section>
      )}

      {result && (
        <>
          <section className="businessCard profileCard">
            <div>
              <span>분석 대상</span>
              <strong>{form.name}</strong>
            </div>

            <div>
              <span>생년월일</span>
              <strong>{form.birth}</strong>
            </div>

            <div>
              <span>출생시간</span>
              <strong>{form.time}</strong>
            </div>

            <div>
              <span>기준</span>
              <strong>
                {form.gender} · {form.calendar}
              </strong>
            </div>
          </section>

          {yongshin && (
            <section className="businessCard">
              <div className="cardTitle left">
                <span>FIVE ELEMENTS GUIDE</span>
                <h2>재물·사업 참고 오행</h2>
              </div>

              <div className="elementGrid">
                <article>
                  <span>용신</span>
                  <strong>
                    {yongshin.yongshin || "-"}
                  </strong>
                </article>

                <article>
                  <span>희신</span>
                  <strong>
                    {yongshin.heesin || "-"}
                  </strong>
                </article>
              </div>

              {yongshin.reason && (
                <p className="elementReason">
                  {yongshin.reason}
                </p>
              )}
            </section>
          )}

          <section className="businessCard reportCard">
            <div className="cardTitle left">
              <span>WEALTH · BUSINESS REPORT</span>
              <h2>{form.name}님의 재물·사업운 집중 분석</h2>
            </div>

            <div className="resultBody">
              {renderBusinessResult(result)}
            </div>

            <div className="noticeBox">
              본 분석은 전통 명리 관점을 참고한 AI 분석입니다.
              실제 투자·대출·사업 결정은 시장 상황과 재무 상태,
              관련 전문가의 조언을 함께 고려해 주세요.
            </div>

            <button
              type="button"
              onClick={resetAnalysis}
              className="resetButton"
            >
              다른 사람 재물·사업운 분석하기
            </button>
          </section>
        </>
      )}

      <style jsx>{`
        .businessPage {
          min-height: 100vh;
          padding: 64px 20px 90px;
          background:
            radial-gradient(
              circle at top,
              rgba(184, 145, 76, 0.1),
              transparent 34%
            ),
            #f4f1eb;
        }

        .businessHero {
          max-width: 860px;
          margin: 0 auto 32px;
          text-align: center;
        }

        .eyebrow,
        .cardTitle span {
          display: block;
          color: #9a722e;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .businessHero h1 {
          margin: 12px 0;
          color: #26231e;
          font-size: clamp(32px, 5vw, 48px);
        }

        .businessHero p {
          max-width: 660px;
          margin: 0 auto;
          color: #70695e;
          line-height: 1.8;
        }

        .businessCard {
          width: 100%;
          max-width: 860px;
          margin: 20px auto 0;
          padding: 34px;
          border: 1px solid #ddd5c8;
          border-radius: 20px;
          background: #fffdf9;
          box-shadow: 0 14px 38px rgba(61, 50, 33, 0.06);
        }

        .inputCard {
          max-width: 720px;
        }

        .cardTitle {
          margin-bottom: 28px;
          text-align: center;
        }

        .cardTitle.left {
          text-align: left;
        }

        .cardTitle h2 {
          margin: 9px 0 8px;
          color: #302b24;
          font-size: 24px;
        }

        .cardTitle p {
          margin: 0;
          color: #777065;
          font-size: 14px;
          line-height: 1.75;
        }

        .birthRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .calendarButton {
          min-width: 74px;
          min-height: 52px;
          margin-top: 9px;
          padding: 0 15px;
          border: 1px solid #d8d0c3;
          border-radius: 10px;
          background: #f7f2e9;
          color: #5b5143;
          font-weight: 800;
          cursor: pointer;
        }

        .datePicker {
          margin-top: 12px;
          padding: 18px;
          border: 1px solid #d8d0c3;
          border-radius: 14px;
          background: #faf7f1;
        }

        .pickerTop {
          display: grid;
          grid-template-columns: 44px 1fr 1fr 44px;
          gap: 8px;
        }

        .calendarGrid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
          margin-top: 16px;
        }

        .calendarDayName {
          padding: 8px 0;
          color: #8a8175;
          font-size: 12px;
          font-weight: 800;
          text-align: center;
        }

        .calendarDay {
          min-height: 38px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #4c463e;
          cursor: pointer;
        }

        .calendarDay:hover {
          background: #eee6d8;
        }

        .calendarDay.selected {
          background: #2f332b;
          color: #fff;
          font-weight: 800;
        }

        .pickerBottom {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 14px;
        }

        .businessSelect {
          width: 100%;
          min-height: 52px;
          margin-top: 9px;
          padding: 0 14px;
          border: 1px solid #d8d0c3;
          border-radius: 10px;
          background: #fff;
          color: #302c26;
          font-size: 15px;
        }

        .twoCol {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 22px;
        }

        .analyzeButton {
          width: 100%;
          min-height: 58px;
          margin-top: 28px;
          border: 0;
          border-radius: 12px;
          background: #252a23;
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
        }

        .analyzeButton:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .errorMessage {
          margin: 18px 0 0;
          color: #b0443c;
          font-size: 14px;
          line-height: 1.7;
          text-align: center;
        }

        .privacyText {
          margin: 18px 0 0;
          color: #928a7e;
          font-size: 12px;
          line-height: 1.7;
          text-align: center;
        }

        .profileCard {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .profileCard div {
          padding: 15px;
          border-radius: 12px;
          background: #f6f1e8;
        }

        .profileCard span,
        .elementGrid span {
          display: block;
          color: #8c8376;
          font-size: 11px;
          font-weight: 700;
        }

        .profileCard strong {
          display: block;
          margin-top: 7px;
          color: #332f29;
          font-size: 14px;
          word-break: break-word;
        }

        .elementGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .elementGrid article {
          padding: 22px;
          border-radius: 14px;
          background: #f5f0e7;
        }

        .elementGrid strong {
          display: block;
          margin-top: 8px;
          color: #342f27;
          font-size: 26px;
        }

        .elementReason {
          margin: 16px 0 0;
          color: #777066;
          font-size: 13px;
          line-height: 1.8;
        }

        .reportCard {
          background: transparent;
          border: 0;
          box-shadow: none;
          padding-left: 0;
          padding-right: 0;
        }

        .reportCard > .cardTitle {
          max-width: 860px;
          margin-left: auto;
          margin-right: auto;
          padding: 0 8px;
        }

        .reportCard .resultBody {
          margin-top: 24px;
        }

        .businessSectionGrid {
          gap: 24px;
        }

        .businessAnalysisCard {
          border: 1px solid #d8c8ab;
          background: #fffaf2;
          box-shadow:
            0 12px 30px rgba(79, 61, 31, 0.08);
        }

        .businessAnalysisHeader {
          background:
            linear-gradient(
              135deg,
              #f2e6cf 0%,
              #fffaf2 100%
            );
          border-bottom: 1px solid #dcc9a9;
        }

        .businessSectionNumber {
          background: #9a722e;
          color: #fff;
          border-color: #9a722e;
          box-shadow:
            0 5px 14px rgba(154, 114, 46, 0.18);
        }

        .businessAnalysisContent {
          background: #fffdf9;
        }

        .businessAnalysisCard:last-child {
          border: 2px solid #c5a66d;
          background:
            linear-gradient(
              135deg,
              #fff8e8,
              #fffdf9
            );
        }

        .businessAnalysisCard:last-child .businessAnalysisHeader {
          background:
            linear-gradient(
              135deg,
              #ead7ae,
              #fff8e8
            );
        }

        .businessAnalysisCard:last-child .businessSectionLabel {
          color: #7b5b22;
        }

        @media (max-width: 680px) {
          .reportCard {
            padding-left: 0;
            padding-right: 0;
          }

          .reportCard > .cardTitle {
            padding: 0 4px;
          }

          .businessSectionGrid {
            gap: 18px;
          }

          .businessAnalysisCard {
            border-width: 1px;
            box-shadow:
              0 8px 20px rgba(79, 61, 31, 0.07);
          }
        }

        .resultBody {
          margin-top: 24px;
        }

        .premiumBusinessResult {
          display: grid;
          gap: 22px;
        }

        .businessIntroCard {
          padding: 24px 26px;
          border: 1px solid #e3d8c5;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              rgba(183, 143, 72, 0.09),
              rgba(255, 253, 249, 0.8)
            );
        }

        .businessIntroMark {
          margin-bottom: 12px;
          color: #9a722e;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .businessSectionGrid {
          display: grid;
          gap: 18px;
        }

        .businessAnalysisCard {
          overflow: hidden;
          border: 1px solid #e2d9ca;
          border-radius: 18px;
          background: #fffdf9;
          box-shadow:
            0 8px 24px rgba(61, 50, 33, 0.045);
        }

        .businessAnalysisHeader {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 24px 19px;
          border-bottom: 1px solid #ebe3d7;
          background:
            linear-gradient(
              135deg,
              #f8f3e9 0%,
              #fffdf9 72%
            );
        }

        .businessSectionNumber {
          display: flex;
          flex: 0 0 54px;
          width: 54px;
          height: 54px;
          align-items: center;
          justify-content: center;
          border: 1px solid #d7c49d;
          border-radius: 50%;
          background: #fffaf0;
          color: #9a722e;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .businessSectionTitleWrap {
          min-width: 0;
          flex: 1;
        }

        .businessSectionLabel {
          display: block;
          margin-bottom: 5px;
          color: #a17a36;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .businessAnalysisHeader .businessHeading {
          margin: 0;
          padding: 0;
          border: 0;
          color: #302b24;
          font-size: 20px;
          line-height: 1.45;
        }

        .businessAnalysisContent {
          padding: 22px 26px 25px;
        }

        .businessAnalysisContent .businessParagraph {
          margin: 0 0 13px;
          color: #625b50;
          font-size: 15px;
          line-height: 1.95;
          word-break: keep-all;
        }

        .businessAnalysisContent .businessParagraph:last-child {
          margin-bottom: 0;
        }

        .businessAnalysisContent .businessHeadingSmall {
          margin: 20px 0 10px;
          color: #6f5527;
          font-size: 16px;
          line-height: 1.6;
        }

        .businessAnalysisContent .businessResultList {
          display: grid;
          gap: 9px;
          margin: 15px 0 4px;
          padding: 0;
          list-style: none;
        }

        .businessAnalysisContent .businessResultList li {
          position: relative;
          margin: 0;
          padding: 13px 15px 13px 38px;
          border-radius: 11px;
          background: #f7f2e9;
          color: #5d564c;
          font-size: 14px;
          line-height: 1.75;
        }

        .businessAnalysisContent .businessResultList li::before {
          content: "✓";
          position: absolute;
          top: 13px;
          left: 15px;
          color: #9a722e;
          font-weight: 900;
        }

        @media (max-width: 680px) {
          .premiumBusinessResult {
            gap: 16px;
          }

          .businessIntroCard {
            padding: 20px 18px;
            border-radius: 14px;
          }

          .businessSectionGrid {
            gap: 14px;
          }

          .businessAnalysisCard {
            border-radius: 15px;
          }

          .businessAnalysisHeader {
            align-items: flex-start;
            gap: 12px;
            padding: 18px 16px 16px;
          }

          .businessSectionNumber {
            flex-basis: 44px;
            width: 44px;
            height: 44px;
            font-size: 14px;
          }

          .businessSectionLabel {
            font-size: 9px;
            letter-spacing: 1.2px;
          }

          .businessAnalysisHeader .businessHeading {
            font-size: 18px;
          }

          .businessAnalysisContent {
            padding: 18px 16px 20px;
          }

          .businessAnalysisContent .businessParagraph {
            font-size: 14px;
            line-height: 1.9;
            word-break: normal;
          }

          .businessAnalysisContent .businessResultList li {
            padding: 12px 13px 12px 35px;
            font-size: 13px;
          }

          .businessAnalysisContent .businessResultList li::before {
            top: 12px;
            left: 13px;
          }
        }

        .businessHeadingLarge {
          margin: 30px 0 14px;
          color: #28241f;
          font-size: 25px;
        }

        .businessHeading {
          margin: 30px 0 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e7dfd3;
          color: #342f28;
          font-size: 21px;
          line-height: 1.5;
        }

        .businessHeadingSmall {
          margin: 22px 0 9px;
          color: #51493e;
          font-size: 17px;
        }

        .businessParagraph {
          margin: 9px 0;
          color: #625b50;
          font-size: 15px;
          line-height: 1.95;
        }

        .businessResultList {
          margin: 10px 0 20px;
          padding-left: 22px;
          color: #625b50;
        }

        .businessResultList li {
          margin: 7px 0;
          line-height: 1.85;
        }

        .noticeBox {
          margin-top: 30px;
          padding: 18px;
          border-radius: 14px;
          background: #f5f0e7;
          color: #777066;
          font-size: 12px;
          line-height: 1.8;
        }

        .resetButton {
          display: block;
          width: 100%;
          min-height: 54px;
          margin-top: 22px;
          border: 1px solid #cdbd9e;
          border-radius: 11px;
          background: #fffaf0;
          color: #765b29;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 680px) {
          .businessPage {
            padding: 42px 14px 70px;
          }

          .businessCard {
            padding: 24px 18px;
            border-radius: 16px;
          }

          .twoCol {
            grid-template-columns: 1fr;
          }

          .profileCard {
            grid-template-columns: 1fr 1fr;
          }

          .pickerTop {
            grid-template-columns: 40px 1fr 1fr 40px;
            gap: 5px;
          }

          .datePicker {
            padding: 12px 9px;
          }

          .calendarDay {
            min-height: 36px;
          }
        }

        @media (max-width: 420px) {
          .profileCard,
          .elementGrid {
            grid-template-columns: 1fr;
          }

          .businessHero h1 {
            font-size: 34px;
          }
        }
      `}</style>

      <style jsx global>{`
        .premiumBusinessResult {
          display: grid;
          gap: 22px;
        }

        .businessIntroCard {
          padding: 24px 26px;
          border: 1px solid #e3d8c5;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              rgba(183, 143, 72, 0.09),
              rgba(255, 253, 249, 0.8)
            );
        }

        .businessIntroMark {
          margin-bottom: 12px;
          color: #9a722e;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .businessSectionGrid {
          display: grid;
          gap: 24px;
        }

        .businessAnalysisCard {
          overflow: hidden;
          border: 1px solid #d8c8ab;
          border-radius: 18px;
          background: #fffaf2;
          box-shadow:
            0 12px 30px rgba(79, 61, 31, 0.08);
        }

        .businessAnalysisHeader {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 24px 19px;
          border-bottom: 1px solid #dcc9a9;
          background:
            linear-gradient(
              135deg,
              #f2e6cf 0%,
              #fffaf2 100%
            );
        }

        .businessSectionNumber {
          display: flex;
          flex: 0 0 54px;
          width: 54px;
          height: 54px;
          align-items: center;
          justify-content: center;
          border: 1px solid #9a722e;
          border-radius: 50%;
          background: #9a722e;
          color: #fff;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 1px;
          box-shadow:
            0 5px 14px rgba(154, 114, 46, 0.18);
        }

        .businessSectionTitleWrap {
          min-width: 0;
          flex: 1;
        }

        .businessSectionLabel {
          display: block;
          margin-bottom: 5px;
          color: #a17a36;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .businessAnalysisHeader .businessHeading {
          margin: 0;
          padding: 0;
          border: 0;
          color: #302b24;
          font-size: 20px;
          line-height: 1.45;
        }

        .businessAnalysisContent {
          padding: 22px 26px 25px;
          background: #fffdf9;
        }

        .businessAnalysisContent .businessParagraph {
          margin: 0 0 13px;
          color: #625b50;
          font-size: 15px;
          line-height: 1.95;
          word-break: keep-all;
        }

        .businessAnalysisContent .businessParagraph:last-child {
          margin-bottom: 0;
        }

        .businessAnalysisContent .businessHeadingSmall {
          margin: 20px 0 10px;
          color: #6f5527;
          font-size: 16px;
          line-height: 1.6;
        }

        .businessAnalysisContent .businessResultList {
          display: grid;
          gap: 9px;
          margin: 15px 0 4px;
          padding: 0;
          list-style: none;
        }

        .businessAnalysisContent .businessResultList li {
          position: relative;
          margin: 0;
          padding: 13px 15px 13px 38px;
          border-radius: 11px;
          background: #f7f2e9;
          color: #5d564c;
          font-size: 14px;
          line-height: 1.75;
        }

        .businessAnalysisContent .businessResultList li::before {
          content: "✓";
          position: absolute;
          top: 13px;
          left: 15px;
          color: #9a722e;
          font-weight: 900;
        }

        .businessAnalysisCard:last-child {
          border: 2px solid #c5a66d;
          background:
            linear-gradient(
              135deg,
              #fff8e8,
              #fffdf9
            );
        }

        .businessAnalysisCard:last-child .businessAnalysisHeader {
          background:
            linear-gradient(
              135deg,
              #ead7ae,
              #fff8e8
            );
        }

        @media (max-width: 680px) {
          .premiumBusinessResult {
            gap: 16px;
          }

          .businessSectionGrid {
            gap: 18px;
          }

          .businessAnalysisCard {
            border-radius: 15px;
          }

          .businessAnalysisHeader {
            align-items: flex-start;
            gap: 12px;
            padding: 18px 16px 16px;
          }

          .businessSectionNumber {
            flex-basis: 44px;
            width: 44px;
            height: 44px;
            font-size: 14px;
          }

          .businessAnalysisHeader .businessHeading {
            font-size: 18px;
          }

          .businessAnalysisContent {
            padding: 18px 16px 20px;
          }

          .businessAnalysisContent .businessParagraph {
            font-size: 14px;
            line-height: 1.9;
            word-break: normal;
          }

          .businessAnalysisContent .businessResultList li {
            padding: 12px 13px 12px 35px;
            font-size: 13px;
          }

          .businessAnalysisContent .businessResultList li::before {
            top: 12px;
            left: 13px;
          }
        }
      `}</style>

    </main>
  );
}