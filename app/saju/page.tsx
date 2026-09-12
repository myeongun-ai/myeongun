"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
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
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
}

function toMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function parseRange(value: string) {
  const match = value.match(/(\d{2}):(\d{2})\s*~\s*(\d{2}):(\d{2})/);
  if (!match) return null;

  return {
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
  };
}

function timeMatches(savedTime: string, enteredTime: string) {
  if (savedTime === enteredTime) return true;

  if (savedTime === "모름" || enteredTime === "모름") {
    return false;
  }

  const savedMinutes = toMinutes(savedTime);
  const enteredMinutes = toMinutes(enteredTime);
  const savedRange = parseRange(savedTime);
  const enteredRange = parseRange(enteredTime);

  function isInside(minutes: number, range: { start: number; end: number }) {
    if (range.start <= range.end) {
      return minutes >= range.start && minutes <= range.end;
    }

    return minutes >= range.start || minutes <= range.end;
  }

  if (savedMinutes !== null && enteredRange) {
    return isInside(savedMinutes, enteredRange);
  }

  if (enteredMinutes !== null && savedRange) {
    return isInside(enteredMinutes, savedRange);
  }

  return false;
}

function sameSajuForReopen(a: SajuForm, b: SajuForm) {
  return (
    a.name.trim() === b.name.trim() &&
    a.birth === b.birth &&
    timeMatches(a.time, b.time) &&
    a.gender === b.gender &&
    a.calendar === b.calendar
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

function renderFreeResult(text: string) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n");

  const nodes: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  function flushBullets() {
    if (!bulletBuffer.length) return;

    nodes.push(
      <ul className="resultList" key={`list-${nodes.length}`}>
        {bulletBuffer.map((item, index) => (
          <li key={`${item}-${index}`}>
            {renderInline(item)}
          </li>
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
        <h4 className="resultHeadingSmall" key={`h4-${index}`}>
          {renderInline(line.slice(4))}
        </h4>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushBullets();
      nodes.push(
        <h3 className="resultHeading" key={`h3-${index}`}>
          {renderInline(line.slice(3))}
        </h3>
      );
      return;
    }

    if (line.startsWith("# ")) {
      flushBullets();
      nodes.push(
        <h2 className="resultHeadingLarge" key={`h2-${index}`}>
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
      <p className="resultParagraph" key={`p-${index}`}>
        {renderInline(line)}
      </p>
    );
  });

  flushBullets();

  return nodes;
}

export default function SajuPage() {
  const router = useRouter();
  const today = new Date();
  const currentYear = today.getFullYear();

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
  const [yongshin, setYongshin] = useState<{ yongshin: string; heesin: string; reason: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentYear);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    sessionStorage.removeItem("myeongun_session_active");
  }, []);

  function update<K extends keyof SajuForm>(key: K, value: SajuForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFreeResult("");
  }

  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1930 + 1 },
        (_, i) => currentYear - i
      ),
    [currentYear]
  );

  const parsedBirth = parseBirth(form.birth);
  const monthDays = daysInMonth(pickerYear, pickerMonth);
  const firstDay = new Date(pickerYear, pickerMonth - 1, 1).getDay();

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

    if (year < 1930 || year > currentYear) return;

    setPickerYear(year);
    setPickerMonth(month);
  }

  function selectDay(day: number) {
    update("birth", `${pickerYear}-${pad2(pickerMonth)}-${pad2(day)}`);
    setPickerOpen(false);
  }

  async function tryReopenExistingPaidSaju(payload: SajuForm) {
    try {
      const savedText =
        localStorage.getItem("myeongun_paid_saju") ||
        localStorage.getItem("myeongun_saju");

      if (!savedText) return false;

      const saved = JSON.parse(savedText) as SajuForm;

      if (!sameSajuForReopen(saved, payload)) {
        return false;
      }

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

      localStorage.setItem("myeongun_saju", savedText);
      sessionStorage.setItem("myeongun_session_active", "1");
      router.push("/fortune/detail");
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFreeResult("");

    const data = new FormData(e.currentTarget);

    const payload: SajuForm = {
      name: String(data.get("name") || "").trim(),
      birth: String(data.get("birth") || ""),
      time: String(data.get("time") || ""),
      gender: String(data.get("gender") || "남성"),
      calendar: String(data.get("calendar") || "양력"),
    };

    if (!payload.name || !payload.birth || !payload.time) {
      setError("이름, 생년월일, 출생시간을 모두 선택해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const reopened = await tryReopenExistingPaidSaju(payload);
      if (reopened) return;

      // 무료 사주를 새로 분석해도 기존 7일 결제 이용권은 삭제하지 않습니다.
      // 새 결제가 정상 승인되면 서버가 새 이용권으로 교체합니다.
      localStorage.removeItem("myeongun_premium_result");

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
      setYongshin(parsed?.yongshin || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "사주 분석 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "56px",
    padding: "0 18px",
    border: "1px solid #ddd2bf",
    borderRadius: "12px",
    background: "#fffdfa",
    color: "#17243a",
    fontSize: "16px",
    outline: "none",
  } as const;

  const labelStyle = {
    display: "grid",
    gap: "10px",
    color: "#17243a",
    fontSize: "15px",
    fontWeight: 800,
  } as const;

  const smallButtonStyle = {
    minHeight: "42px",
    border: "1px solid #d9c9ad",
    borderRadius: "10px",
    background: "#fffaf1",
    color: "#8b651f",
    fontWeight: 800,
    cursor: "pointer",
  } as const;

  return (
    <main className="sajuPage">
      <section className="sajuCard">
        <header className="pageHeader">
          <div className="eyebrow">FREE SAJU</div>
          <h1>무료 사주 분석</h1>
          <p>생년월일과 출생시간을 입력해 주세요.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            이름
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="이름을 입력하세요"
              autoComplete="name"
              style={fieldStyle}
            />
          </label>

          <label style={{ ...labelStyle, marginTop: "22px" }}>
            생년월일
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "8px",
              }}
            >
              <input
                name="birth"
                type="text"
                readOnly
                required
                value={form.birth}
                placeholder="년-월-일"
                onClick={openPicker}
                style={{ ...fieldStyle, cursor: "pointer" }}
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
                  onChange={(e) => setPickerYear(Number(e.target.value))}
                  style={{ ...fieldStyle, minHeight: "44px", padding: "0 10px" }}
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
                  onChange={(e) => setPickerMonth(Number(e.target.value))}
                  style={{ ...fieldStyle, minHeight: "44px", padding: "0 10px" }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
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
                {["일", "월", "화", "수", "목", "금", "토"].map((dayName) => (
                  <div key={dayName} className="calendarDayName">
                    {dayName}
                  </div>
                ))}

                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`blank-${index}`} />
                ))}

                {Array.from({ length: monthDays }, (_, i) => i + 1).map((day) => {
                  const selected =
                    parsedBirth?.year === pickerYear &&
                    parsedBirth?.month === pickerMonth &&
                    parsedBirth?.day === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={selected ? "calendarDay selected" : "calendarDay"}
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
                  style={{ ...smallButtonStyle, padding: "0 16px" }}
                >
                  삭제
                </button>

                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  style={{ ...smallButtonStyle, padding: "0 16px" }}
                >
                  닫기
                </button>
              </div>
            </section>
          )}

          <label style={{ ...labelStyle, marginTop: "22px" }}>
            출생시간
            <select
              name="time"
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
              required
              className="timeSelect"
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
          </label>

          <div className="twoCol">
            <label style={labelStyle}>
              성별
              <select
                name="gender"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                className="darkSelect"
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
                onChange={(e) => update("calendar", e.target.value)}
                className="darkSelect"
              >
                <option value="양력">양력</option>
                <option value="음력">음력(평달)</option>
                <option value="음력(윤달)">음력(윤달)</option>
              </select>
            </label>
          </div>

          {error && <p className="errorMessage">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="submitButton"
          >
            {loading ? "무료 사주 분석 중..." : "무료 사주 분석 시작"}
          </button>
        </form>

        <p className="privacyText">
          입력하신 정보는 사주 분석을 위한 용도로만 사용됩니다.
        </p>
      </section>

      {freeResult && (
        <section className="resultCard">
          <div className="resultEyebrow">FREE SAJU RESULT</div>
          <h2>{form.name || "고객"}님의 무료 사주 분석</h2>

          {yongshin && (
            <div style={{ marginTop: "20px", padding: "20px", borderRadius: "14px", border: "1px solid #d8d0c3", background: "#f8f5ee" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "#777" }}>참고용 오행 분석</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <div style={{ padding: "14px", borderRadius: "10px", background: "#fff" }}><div style={{ fontSize: "12px", color: "#777" }}>용신</div><strong style={{ display: "block", marginTop: "5px", fontSize: "20px" }}>{yongshin.yongshin}</strong></div>
                <div style={{ padding: "14px", borderRadius: "10px", background: "#fff" }}><div style={{ fontSize: "12px", color: "#777" }}>희신</div><strong style={{ display: "block", marginTop: "5px", fontSize: "20px" }}>{yongshin.heesin}</strong></div>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "12px", lineHeight: 1.6, color: "#777" }}>{yongshin.reason}</p>
              <p style={{ margin: "8px 0 0", fontSize: "11px", lineHeight: 1.5, color: "#999" }}>※ 전통 명리의 확정 판정이 아닌 명운의 참고용 분석입니다.</p>
            </div>
          )}

          <div className="resultText">
            {renderFreeResult(freeResult)}
          </div>

          <div className="premiumBox">
            <div className="premiumEyebrow">PREMIUM SAJU REPORT</div>
            <h3>더 깊은 상세 사주 분석이 필요하신가요?</h3>
            <p>
              재물운, 사업운, 직업운, 인간관계, 2026년 운세,
              장기 흐름까지 개인별 프리미엄 분석을 확인할 수 있습니다.
            </p>

            <Link href="/payment" className="premiumButton">
              상세 사주 분석 보기 · 9,900원
            </Link>
          </div>
        </section>
      )}

      <style jsx>{`
        .sajuPage {
          min-height: 100vh;
          padding: 58px 20px 82px;
          background:
            radial-gradient(circle at 50% 0%, rgba(225, 185, 105, 0.13), transparent 30%),
            linear-gradient(180deg, #f7f2e8 0%, #fbf8f1 58%, #f5efe4 100%);
          color: #17243a;
        }

        .sajuCard,
        .resultCard {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          border: 1px solid #dfd4c2;
          border-radius: 26px;
          background: rgba(255, 253, 249, 0.97);
          box-shadow: 0 24px 60px rgba(31, 39, 53, 0.09);
        }

        .sajuCard {
          padding: 46px 38px 34px;
        }

        .pageHeader {
          margin-bottom: 34px;
          text-align: center;
        }

        .eyebrow,
        .resultEyebrow,
        .premiumEyebrow {
          color: #a97924;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
        }

        .pageHeader h1 {
          margin: 12px 0 10px;
          color: #17243a;
          font-size: 38px;
          line-height: 1.25;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .pageHeader p {
          margin: 0;
          color: #786f64;
          font-size: 16px;
        }

        .calendarButton {
          min-width: 78px;
          border: 1px solid #d9c9ad;
          border-radius: 12px;
          background: #f6efe2;
          color: #8b651f;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .datePicker {
          margin-top: 14px;
          padding: 16px;
          border: 1px solid #dfd4c2;
          border-radius: 16px;
          background: #fffaf1;
          box-shadow: 0 14px 34px rgba(31, 39, 53, 0.08);
        }

        .pickerTop {
          display: grid;
          grid-template-columns: 44px 1fr 1fr 44px;
          gap: 8px;
          align-items: center;
        }

        .calendarGrid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 7px;
          margin-top: 14px;
          text-align: center;
        }

        .calendarDayName {
          padding: 8px 0;
          color: #a97924;
          font-size: 12px;
          font-weight: 800;
        }

        .calendarDay {
          min-height: 42px;
          border: 1px solid #eee4d4;
          border-radius: 10px;
          background: #fff;
          color: #243148;
          font-size: 14px;
          cursor: pointer;
        }

        .calendarDay.selected {
          border-color: #c99535;
          background: #dcae52;
          color: #152136;
          font-weight: 900;
        }

        .pickerBottom {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
        }

        .timeSelect,
        .darkSelect {
          width: 100%;
          box-sizing: border-box;
          min-height: 56px;
          padding: 0 18px;
          border: 1px solid #ddd2bf;
          border-radius: 12px;
          background: #fffdfa;
          color: #17243a;
          font-size: 16px;
          outline: none;
          cursor: pointer;
        }

        .timeSelect:focus,
        .darkSelect:focus {
          border-color: #b9862e;
          box-shadow: 0 0 0 3px rgba(185, 134, 46, 0.11);
        }

        .timeSelect option,
        .darkSelect option {
          background: #fff;
          color: #17243a;
        }

        .twoCol {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 22px;
        }

        .errorMessage {
          margin: 18px 0 0;
          color: #b44237;
          font-size: 13px;
          line-height: 1.7;
        }

        .submitButton {
          width: 100%;
          min-height: 60px;
          margin-top: 28px;
          border: 1px solid #c99535;
          border-radius: 14px;
          background: linear-gradient(90deg, #d7a746 0%, #f0c66d 50%, #d7a746 100%);
          color: #142137;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(183, 132, 39, 0.17);
        }

        .submitButton:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .privacyText {
          margin: 17px 0 0;
          text-align: center;
          color: #8d857a;
          font-size: 12px;
          line-height: 1.7;
        }

        .resultCard {
          margin-top: 26px;
          padding: 38px;
        }

        .resultCard h2 {
          margin: 12px 0 20px;
          color: #17243a;
          font-size: 28px;
        }

        .resultText {
          padding: 24px;
          border: 1px solid #e8dfd1;
          border-radius: 16px;
          background: #f8f3ea;
          color: #4d4b47;
          font-size: 15px;
          line-height: 1.95;
        }

        .resultText :global(.resultHeadingLarge) {
          margin: 26px 0 12px;
          color: #17243a;
          font-size: 24px;
          line-height: 1.4;
        }

        .resultText :global(.resultHeading) {
          margin: 24px 0 10px;
          color: #9a6d20;
          font-size: 20px;
          line-height: 1.45;
        }

        .resultText :global(.resultHeadingSmall) {
          margin: 20px 0 8px;
          color: #72511a;
          font-size: 17px;
          line-height: 1.5;
        }

        .resultText :global(.resultParagraph) {
          margin: 0 0 12px;
        }

        .resultText :global(.resultList) {
          margin: 8px 0 18px;
          padding-left: 22px;
        }

        .resultText :global(.resultList li) {
          margin-bottom: 7px;
        }

        .resultText :global(strong) {
          color: #17243a;
          font-weight: 900;
        }

        .premiumBox {
          margin-top: 26px;
          padding: 28px;
          border: 1px solid #dec99f;
          border-radius: 18px;
          background: linear-gradient(135deg, #f5ead4, #fffaf1);
          text-align: center;
        }

        .premiumBox h3 {
          margin: 10px 0;
          color: #17243a;
          font-size: 23px;
        }

        .premiumBox p {
          max-width: 680px;
          margin: 0 auto 20px;
          color: #6f685e;
          font-size: 14px;
          line-height: 1.8;
        }

        .premiumButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 54px;
          padding: 0 28px;
          border-radius: 12px;
          background: #b9852c;
          color: #fff;
          text-decoration: none;
          font-size: 15px;
          font-weight: 900;
        }

        @media (max-width: 640px) {
          .sajuPage {
            padding: 30px 12px 58px;
          }

          .sajuCard,
          .resultCard {
            padding: 30px 18px 26px;
            border-radius: 20px;
          }

          .pageHeader {
            margin-bottom: 28px;
          }

          .pageHeader h1 {
            font-size: 30px;
          }

          .pageHeader p {
            font-size: 14px;
          }

          .twoCol {
            grid-template-columns: 1fr;
          }

          .pickerTop {
            grid-template-columns: 40px 1fr 1fr 40px;
          }

          .timeSelect,
          .darkSelect {
            font-size: 14px;
          }

          .resultCard h2 {
            font-size: 24px;
          }

          .resultText :global(.resultHeadingLarge) {
            font-size: 21px;
          }

          .resultText :global(.resultHeading) {
            font-size: 18px;
          }

          .premiumButton {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>
    </main>
  );
}