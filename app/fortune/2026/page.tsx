"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

type ProfileInfo = {
  name?: string;
  birth?: string;
  time?: string;
  gender?: string;
  calendar?: string;
  dayMaster?: {
    stem?: string;
    element?: string;
    yinYang?: string;
  };
  strength?: {
    level?: string;
    score?: number;
    reason?: string;
  };
  yongshin?: {
    yongshin?: string;
    heesin?: string;
    reason?: string;
  } | null;
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

function renderFortune2026Result(text: string) {
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

    if (!line) return;

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
      if (!bullets.length) return;

      nodes.push(
        <ul
          className="fortune2026List"
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

      const numbered = line.match(/^\d+\.\s+(.+)/);

      if (numbered) {
        bullets.push(numbered[1]);
        return;
      }

      flushBullets();

      if (line.startsWith("### ")) {
        nodes.push(
          <h4
            className="fortune2026HeadingSmall"
            key={`section-${sectionIndex}-h4-${lineIndex}`}
          >
            {renderInline(line.slice(4))}
          </h4>
        );
        return;
      }

      nodes.push(
        <p
          className="fortune2026Paragraph"
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
    <div className="premiumFortune2026Result">
      {intro.length > 0 && (
        <section className="fortune2026IntroCard">
          <div className="fortune2026IntroMark">
            MYEONGUN · 2026 FORTUNE
          </div>

          {intro.map((line, index) => (
            <p
              className="fortune2026Paragraph"
              key={`intro-${index}`}
            >
              {renderInline(line)}
            </p>
          ))}
        </section>
      )}

      <div className="fortune2026SectionGrid">
        {sections.map((section, index) => {
          const number = getSectionNumber(section.title);
          const title = getSectionTitle(section.title);

          return (
            <section
              className="fortune2026AnalysisCard"
              key={`${section.title}-${index}`}
            >
              <header className="fortune2026AnalysisHeader">
                {number ? (
                  <div className="fortune2026SectionNumber">
                    {number.padStart(2, "0")}
                  </div>
                ) : (
                  <div className="fortune2026SummaryMark">運</div>
                )}

                <div className="fortune2026SectionTitleWrap">
                  <span className="fortune2026SectionLabel">
                    YEAR · FORTUNE · 2026
                  </span>

                  <h3>{renderInline(title)}</h3>
                </div>
              </header>

              <div className="fortune2026AnalysisContent">
                {renderSectionContent(section.content, index)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function Fortune2026Page() {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [form, setForm] = useState<SajuForm>({
    name: "",
    birth: "",
    time: "모름",
    gender: "남성",
    calendar: "양력",
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentYear);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [profile, setProfile] = useState<ProfileInfo | null>(null);

  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1920 + 1 },
        (_, index) => currentYear - index
      ),
    [currentYear]
  );

  const parsedBirth = parseBirth(form.birth);
  const monthDays = daysInMonth(pickerYear, pickerMonth);
  const firstDay = new Date(
    pickerYear,
    pickerMonth - 1,
    1
  ).getDay();

  const canAnalyze = Boolean(
    form.name.trim() &&
      form.birth &&
      form.time &&
      form.gender &&
      form.calendar
  );

  function update<K extends keyof SajuForm>(
    key: K,
    value: SajuForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setResult("");
    setProfile(null);
    setError("");
  }

  function openPicker() {
    const parsed = parseBirth(form.birth);

    if (parsed) {
      setPickerYear(parsed.year);
      setPickerMonth(parsed.month);
    } else {
      setPickerYear(currentYear);
      setPickerMonth(today.getMonth() + 1);
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

    if (year < 1920 || year > currentYear) {
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

    if (!canAnalyze || loading) return;

    setLoading(true);
    setError("");
    setResult("");
    setProfile(null);

    try {
      const response = await fetch("/api/fortune/2026", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          birth: form.birth,
          time: form.time,
          gender: form.gender,
          calendar: form.calendar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "2026년 운세 분석 중 오류가 발생했습니다."
        );
      }

      const resultText = String(data?.result || "").trim();

      if (!resultText) {
        throw new Error("2026년 운세 분석 결과가 비어 있습니다.");
      }

      try {
        localStorage.setItem(
          "myeongun_recent_2026",
          JSON.stringify({
            usedAt: new Date().toISOString(),
            name: form.name.trim(),
          })
        );
      } catch {}

      setResult(resultText);
      setProfile(data?.profile || null);

      window.setTimeout(() => {
        document
          .getElementById("fortune-2026-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "2026년 운세 분석 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setForm({
      name: "",
      birth: "",
      time: "모름",
      gender: "남성",
      calendar: "양력",
    });

    setResult("");
    setProfile(null);
    setError("");
    setPickerOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="fortune2026Page">
      <section className="fortune2026Hero">
        <span className="eyebrow">2026 YEAR FORTUNE</span>
        <h1>2026년 운세</h1>
        <p>
          실제 만세력 계산을 바탕으로 2026년의 전체 흐름부터
          재물·사업·직업·인간관계·생활 관리와 월별 흐름까지
          살펴봅니다.
        </p>
      </section>

      <form
        className="fortune2026Form"
        onSubmit={handleSubmit}
      >
        <section className="formTitle">
          <span>MYEONGUN FORTUNE</span>
          <h2>2026년 운세를 확인할 정보를 입력하세요</h2>
        </section>

        <div className="formGrid">
          <label className="field full">
            <span>이름</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                update("name", event.target.value)
              }
              placeholder="이름을 입력하세요"
              autoComplete="off"
            />
          </label>

          <div className="field full">
            <span>생년월일</span>

            <button
              type="button"
              className="birthPickerButton"
              onClick={openPicker}
            >
              {form.birth || "생년월일을 선택하세요"}
              <span>📅</span>
            </button>

            {pickerOpen && (
              <div className="birthPicker">
                <div className="birthPickerHeader">
                  <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    aria-label="이전 월"
                  >
                    ‹
                  </button>

                  <div className="birthPickerSelects">
                    <select
                      aria-label="연도 선택"
                      value={pickerYear}
                      onChange={(event) =>
                        setPickerYear(
                          Number(event.target.value)
                        )
                      }
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
                        setPickerMonth(
                          Number(event.target.value)
                        )
                      }
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
                  </div>

                  <button
                    type="button"
                    onClick={() => moveMonth(1)}
                    aria-label="다음 월"
                  >
                    ›
                  </button>
                </div>

                <div className="birthPickerWeek">
                  <span>일</span>
                  <span>월</span>
                  <span>화</span>
                  <span>수</span>
                  <span>목</span>
                  <span>금</span>
                  <span>토</span>
                </div>

                <div className="birthPickerDays">
                  {Array.from({
                    length: firstDay,
                  }).map((_, index) => (
                    <span key={`empty-${index}`} />
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
                        className={
                          selected ? "selected" : ""
                        }
                        onClick={() => selectDay(day)}
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
                  >
                    삭제
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>

          <label className="field">
            <span>출생시간</span>
            <select
              value={form.time}
              onChange={(event) =>
                update("time", event.target.value)
              }
            >
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

          <label className="field">
            <span>성별</span>
            <select
              value={form.gender}
              onChange={(event) =>
                update("gender", event.target.value)
              }
            >
              <option value="남성">남성</option>
              <option value="여성">여성</option>
            </select>
          </label>

          <div className="field full">
            <span>달력 기준</span>

            <div className="toggleGroup">
              <button
                type="button"
                className={
                  form.calendar === "양력"
                    ? "active"
                    : ""
                }
                onClick={() => update("calendar", "양력")}
              >
                양력
              </button>

              <button
                type="button"
                className={
                  form.calendar === "음력"
                    ? "active"
                    : ""
                }
                onClick={() => update("calendar", "음력")}
              >
                음력
              </button>
            </div>
          </div>
        </div>

        <section className="analysisGuide">
          <span>2026 YEAR ANALYSIS</span>
          <strong>
            단순한 띠 운세가 아닌 개인 만세력 기준 분석입니다.
          </strong>
          <p>
            일간과 오행, 신강·신약, 십성, 지장간과 참고용
            용신·희신을 바탕으로 2026년의 흐름과 현실적인
            대응 방향을 분석합니다.
          </p>
        </section>

        {error && <div className="errorBox">{error}</div>}

        <button
          type="submit"
          className="analyzeButton"
          disabled={!canAnalyze || loading}
        >
          {loading
            ? "2026년 운세를 분석하고 있습니다..."
            : "2026년 운세 분석 시작"}
        </button>

        <p className="privacyText">
          입력한 정보는 2026년 운세 분석 요청에 사용됩니다.
        </p>
      </form>

      {result && (
        <section
          className="resultArea"
          id="fortune-2026-result"
        >
          <div className="resultTitle">
            <span>2026 FORTUNE REPORT</span>
            <h2>{form.name}님의 2026년 운세 분석</h2>
            <p>
              실제 만세력 기준으로 2026년의 주요 흐름을
              정리했습니다.
            </p>
          </div>

          {profile && (
            <div className="profileGrid">
              <article className="profileCard">
                <span>DAY MASTER</span>
                <strong>
                  {profile.dayMaster?.stem || "-"}
                </strong>
                <p>
                  {profile.dayMaster?.element || "-"} ·{" "}
                  {profile.dayMaster?.yinYang || "-"}
                </p>
              </article>

              <article className="profileCard">
                <span>STRENGTH</span>
                <strong>
                  {profile.strength?.level || "-"}
                </strong>
                <p>
                  {profile.strength?.score !== undefined
                    ? `${profile.strength.score}점`
                    : "-"}
                </p>
              </article>

              <article className="profileCard">
                <span>YONGSHIN</span>
                <strong>
                  {profile.yongshin?.yongshin || "-"}
                </strong>
                <p>참고용 용신</p>
              </article>

              <article className="profileCard">
                <span>HEESIN</span>
                <strong>
                  {profile.yongshin?.heesin || "-"}
                </strong>
                <p>참고용 희신</p>
              </article>
            </div>
          )}

          <div className="resultBody">
            {renderFortune2026Result(result)}
          </div>

          <div className="noticeBox">
            본 분석은 전통 명리 관점을 참고한 AI 운세
            분석입니다. 미래를 확정적으로 예언하지 않으며,
            실제 재물·투자·사업·직업 결정은 현재 상황과
            객관적인 정보도 함께 고려해 주세요.
          </div>

          <button
            type="button"
            className="resetButton"
            onClick={resetAll}
          >
            다른 정보로 2026년 운세 보기
          </button>
        </section>
      )}

      <div className="homeLinkWrap">
        <Link href="/" className="homeLink">
          홈으로
        </Link>
      </div>

      <style jsx>{`
        .fortune2026Page {
          width: min(980px, calc(100% - 40px));
          margin: 0 auto;
          padding: 58px 0 82px;
          color: #17243a;
        }

        .fortune2026Hero {
          max-width: 760px;
          margin: 0 auto 30px;
          text-align: center;
        }

        .eyebrow {
          display: block;
          margin-bottom: 11px;
          color: #a97924;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 2.6px;
        }

        .fortune2026Hero h1 {
          margin: 0;
          color: #17243a;
          font-size: 38px;
          line-height: 1.25;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .fortune2026Hero p {
          max-width: 690px;
          margin: 14px auto 0;
          color: #786f64;
          font-size: 16px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .fortune2026Form {
          padding: 34px;
          border: 1px solid #dfd4c2;
          border-radius: 26px;
          background: rgba(255, 253, 249, 0.97);
          box-shadow: 0 24px 60px rgba(31, 39, 53, 0.09);
        }

        .formTitle {
          margin-bottom: 26px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e4d8c6;
          text-align: center;
        }

        .formTitle span {
          display: block;
          color: #a97924;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .formTitle h2 {
          margin: 7px 0 0;
          color: #17243a;
          font-size: 21px;
          line-height: 1.5;
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px 14px;
        }

        .field {
          display: block;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field > span {
          display: block;
          margin-bottom: 8px;
          color: #17243a;
          font-size: 14px;
          font-weight: 800;
        }

        .field input,
        .field select {
          width: 100%;
          min-height: 54px;
          box-sizing: border-box;
          border: 1px solid #ddd2bf;
          border-radius: 12px;
          outline: none;
          background: #fffdfa;
          padding: 0 15px;
          color: #17243a;
          font: inherit;
          font-size: 14px;
        }

        .field input:focus,
        .field select:focus {
          border-color: #b9862e;
          box-shadow: 0 0 0 3px rgba(185, 134, 46, 0.11);
        }

        .birthPickerButton {
          display: flex;
          width: 100%;
          min-height: 54px;
          box-sizing: border-box;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #ddd2bf;
          border-radius: 12px;
          background: #fffdfa;
          padding: 0 15px;
          color: #17243a;
          font: inherit;
          font-size: 14px;
          cursor: pointer;
        }

        .birthPickerButton:focus {
          outline: none;
          border-color: #b9862e;
          box-shadow: 0 0 0 3px rgba(185, 134, 46, 0.11);
        }

        .birthPicker {
          margin-top: 8px;
          padding: 14px;
          border: 1px solid #dfd4c2;
          border-radius: 14px;
          background: #fffaf1;
          box-shadow: 0 12px 28px rgba(31, 39, 53, 0.09);
        }

        .birthPickerHeader {
          display: grid;
          grid-template-columns: 38px 1fr 38px;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .birthPickerHeader > button {
          width: 38px;
          height: 38px;
          border: 1px solid #d9c9ad;
          border-radius: 9px;
          background: #fffaf1;
          color: #8b651f;
          font-size: 22px;
          cursor: pointer;
        }

        .birthPickerSelects {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 8px;
        }

        .birthPickerSelects select {
          width: 100%;
          min-height: 38px;
          border: 1px solid #ddd2bf;
          border-radius: 8px;
          background: #fff;
          padding: 0 8px;
          color: #17243a;
          font-size: 14px;
        }

        .birthPickerWeek,
        .birthPickerDays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }

        .birthPickerWeek {
          margin-bottom: 5px;
        }

        .birthPickerWeek span {
          padding: 5px 0;
          color: #8a8175;
          font-size: 11px;
          font-weight: 800;
          text-align: center;
        }

        .birthPickerDays > span {
          min-height: 36px;
        }

        .birthPickerDays button {
          min-width: 0;
          height: 36px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #51493e;
          font-size: 13px;
          cursor: pointer;
        }

        .birthPickerDays button:hover {
          background: #f5efe4;
        }

        .birthPickerDays button.selected {
          background: #b9862e;
          color: #fff;
          font-weight: 900;
        }

        .birthPickerActions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }

        .birthPickerActions button {
          min-height: 36px;
          padding: 0 15px;
          border: 1px solid #d8c39d;
          border-radius: 9px;
          background: #fffaf1;
          color: #805d21;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .toggleGroup {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .toggleGroup button {
          min-height: 48px;
          border: 1px solid #ddd2bf;
          border-radius: 11px;
          background: #fffdfa;
          color: #6f685e;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .toggleGroup button.active {
          border-color: #b9862e;
          background: #b9862e;
          color: #fff;
        }

        .analysisGuide {
          margin-top: 24px;
          padding: 21px 22px;
          border: 1px solid #eadcc5;
          border-radius: 16px;
          background: linear-gradient(135deg, #f7eddc, #fffaf1);
          text-align: center;
        }

        .analysisGuide span {
          display: block;
          color: #a97924;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .analysisGuide strong {
          display: block;
          margin-top: 7px;
          color: #17243a;
          font-size: 16px;
        }

        .analysisGuide p {
          max-width: 700px;
          margin: 8px auto 0;
          color: #756d62;
          font-size: 13px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .analyzeButton {
          display: block;
          width: 100%;
          min-height: 60px;
          margin-top: 22px;
          border: 1px solid #c99535;
          border-radius: 14px;
          background: linear-gradient(90deg, #c89232 0%, #e6b95a 50%, #c89232 100%);
          color: #142137;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(183, 132, 39, 0.17);
          transition: 0.2s ease;
        }

        .analyzeButton:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .analyzeButton:disabled {
          border: 1px solid #d8c7a7;
          background: #e8dcc6;
          color: #8d7b5d;
          cursor: not-allowed;
          opacity: 1;
          box-shadow: none;
          transform: none;
        }

        .privacyText {
          margin: 11px 0 0;
          color: #938a7d;
          font-size: 11px;
          text-align: center;
        }

        .errorBox {
          margin-top: 18px;
          padding: 14px 16px;
          border: 1px solid #e7c7c0;
          border-radius: 11px;
          background: #fff5f2;
          color: #9a4939;
          font-size: 13px;
          line-height: 1.7;
        }

        .resultArea {
          scroll-margin-top: 30px;
          margin-top: 42px;
        }

        .resultTitle {
          margin-bottom: 22px;
          text-align: center;
        }

        .resultTitle > span {
          display: block;
          color: #a97924;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .resultTitle h2 {
          margin: 8px 0 0;
          color: #17243a;
          font-size: 28px;
        }

        .resultTitle p {
          margin: 10px 0 0;
          color: #786f64;
          font-size: 13px;
        }

        .profileGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }

        .profileCard {
          padding: 18px 14px;
          border: 1px solid #e0d4c1;
          border-radius: 15px;
          background: #fbf6ed;
          text-align: center;
        }

        .profileCard span {
          display: block;
          color: #a97924;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .profileCard strong {
          display: block;
          margin-top: 7px;
          color: #17243a;
          font-size: 19px;
        }

        .profileCard p {
          margin: 5px 0 0;
          color: #7b7368;
          font-size: 11px;
        }

        .resultBody {
          overflow: hidden;
          border: 1px solid #dfd4c2;
          border-radius: 18px;
          background: #fffdfa;
          box-shadow: 0 14px 34px rgba(31, 39, 53, 0.08);
        }

        .noticeBox {
          margin-top: 22px;
          padding: 18px;
          border: 1px solid #eadcc5;
          border-radius: 14px;
          background: #f7f2e9;
          color: #756d62;
          font-size: 12px;
          line-height: 1.8;
          text-align: center;
        }

        .resetButton {
          display: block;
          width: 100%;
          min-height: 54px;
          margin-top: 18px;
          border: 1px solid #d3bd94;
          border-radius: 12px;
          background: #fffaf1;
          color: #805d21;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .homeLinkWrap {
          margin-top: 28px;
          text-align: center;
        }

        .homeLink {
          color: #82672f;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        @media (max-width: 760px) {
          .profileGrid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 680px) {
          .fortune2026Page {
            width: min(100% - 24px, 980px);
            padding: 30px 0 58px;
          }

          .fortune2026Hero {
            margin-bottom: 22px;
          }

          .fortune2026Hero h1 {
            font-size: 30px;
          }

          .fortune2026Hero p {
            font-size: 14px;
          }

          .fortune2026Form {
            padding: 20px 18px;
            border-radius: 20px;
          }

          .formTitle h2 {
            font-size: 18px;
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .analysisGuide {
            padding: 18px 15px;
          }

          .resultTitle h2 {
            font-size: 23px;
          }

          .profileGrid {
            gap: 9px;
          }

          .profileCard {
            padding: 15px 10px;
          }
        }
      `}</style>

      <style jsx global>{`
        body {
          background:
            radial-gradient(circle at 50% 0%, rgba(225, 185, 105, 0.13), transparent 30%),
            linear-gradient(180deg, #f7f2e8 0%, #fbf8f1 58%, #f5efe4 100%);
        }

        .premiumFortune2026Result {
          display: grid;
          gap: 22px;
          padding: 0;
        }

        .fortune2026IntroCard {
          padding: 24px 26px;
          border-bottom: 1px solid #e4d8c6;
          background: linear-gradient(135deg, #f5ead7, #fffaf1);
        }

        .fortune2026IntroMark {
          display: block;
          margin-bottom: 10px;
          color: #a97924;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .fortune2026SectionGrid {
          display: grid;
          gap: 20px;
          padding: 0 22px 22px;
        }

        .fortune2026AnalysisCard {
          overflow: hidden;
          border: 1px solid #dfd4c2;
          border-radius: 16px;
          background: #fffdfa;
        }

        .fortune2026AnalysisHeader {
          display: flex;
          align-items: center;
          gap: 17px;
          padding: 20px 22px 18px;
          border-bottom: 1px solid #dec99f;
          background: linear-gradient(135deg, #f1e4ca 0%, #fffaf2 100%);
        }

        .fortune2026SectionNumber,
        .fortune2026SummaryMark {
          display: flex;
          width: 50px;
          height: 50px;
          flex: 0 0 50px;
          align-items: center;
          justify-content: center;
          border: 1px solid #b9862e;
          border-radius: 50%;
          background: #b9862e;
          color: #fff;
          font-size: 15px;
          font-weight: 900;
          box-shadow: 0 5px 14px rgba(154, 114, 46, 0.18);
        }

        .fortune2026SectionTitleWrap {
          min-width: 0;
          flex: 1;
        }

        .fortune2026SectionLabel {
          display: block;
          margin-bottom: 5px;
          color: #a97924;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.6px;
        }

        .fortune2026SectionTitleWrap h3 {
          margin: 0;
          color: #17243a;
          font-size: 19px;
          line-height: 1.45;
        }

        .fortune2026AnalysisContent {
          padding: 21px 24px 24px;
        }

        .fortune2026Paragraph {
          margin: 0 0 13px;
          color: #5f5a52;
          font-size: 15px;
          line-height: 1.95;
          word-break: keep-all;
        }

        .fortune2026Paragraph:last-child {
          margin-bottom: 0;
        }

        .fortune2026HeadingSmall {
          margin: 20px 0 10px;
          color: #76541c;
          font-size: 16px;
          line-height: 1.6;
        }

        .fortune2026ResultList {
          display: grid;
          gap: 9px;
          margin: 15px 0 4px;
          padding: 0;
          list-style: none;
        }

        .fortune2026ResultList li {
          position: relative;
          margin: 0;
          padding: 13px 15px 13px 36px;
          border-radius: 11px;
          background: #f7f2e9;
          color: #5d564c;
          font-size: 14px;
          line-height: 1.75;
        }

        .fortune2026ResultList li::before {
          content: "•";
          position: absolute;
          top: 10px;
          left: 16px;
          color: #b9862e;
          font-size: 20px;
          font-weight: 900;
        }

        @media (max-width: 680px) {
          .premiumFortune2026Result {
            gap: 16px;
          }

          .fortune2026IntroCard {
            padding: 19px 17px;
          }

          .fortune2026SectionGrid {
            gap: 15px;
            padding: 0 14px 16px;
          }

          .fortune2026AnalysisHeader {
            gap: 12px;
            padding: 17px 15px;
          }

          .fortune2026SectionNumber,
          .fortune2026SummaryMark {
            width: 43px;
            height: 43px;
            flex-basis: 43px;
            font-size: 13px;
          }

          .fortune2026SectionTitleWrap h3 {
            font-size: 17px;
          }

          .fortune2026AnalysisContent {
            padding: 18px 16px 20px;
          }

          .fortune2026Paragraph {
            font-size: 14px;
            line-height: 1.85;
          }
        }
      `}</style>
    </main>
  );
}
