"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UsageBenefits from "../UsageBenefits";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

type Yongshin = {
  yongshin: string;
  heesin: string;
  reason: string;
};

const TIME_OPTIONS = [
  { value: "모름", label: "모름" },
  { value: "子(자) 23:30 ~ 01:29", label: "子(자) 23:30 ~ 01:29" },
  { value: "丑(축) 01:30 ~ 03:29", label: "丑(축) 01:30 ~ 03:29" },
  { value: "寅(인) 03:30 ~ 05:29", label: "寅(인) 03:30 ~ 05:29" },
  { value: "卯(묘) 05:30 ~ 07:29", label: "卯(묘) 05:30 ~ 07:29" },
  { value: "辰(진) 07:30 ~ 09:29", label: "辰(진) 07:30 ~ 09:29" },
  { value: "巳(사) 09:30 ~ 11:29", label: "巳(사) 09:30 ~ 11:29" },
  { value: "午(오) 11:30 ~ 13:29", label: "午(오) 11:30 ~ 13:29" },
  { value: "未(미) 13:30 ~ 15:29", label: "未(미) 13:30 ~ 15:29" },
  { value: "申(신) 15:30 ~ 17:29", label: "申(신) 15:30 ~ 17:29" },
  { value: "酉(유) 17:30 ~ 19:29", label: "酉(유) 17:30 ~ 19:29" },
  { value: "戌(술) 19:30 ~ 21:29", label: "戌(술) 19:30 ~ 21:29" },
  { value: "亥(해) 21:30 ~ 23:29", label: "亥(해) 21:30 ~ 23:29" },
];

const PREMIUM_FEATURES = [
  {
    title: "재물·사업·직업운",
    text: "돈과 일에 관한 흐름을 더 자세히 살펴보세요.",
  },
  {
    title: "인연·인간관계",
    text: "나의 관계 성향과 인연의 흐름을 확인하세요.",
  },
  {
    title: "앞으로의 운세 흐름",
    text: "신년 운세와 장기 흐름을 함께 살펴보세요.",
  },
  {
    title: "AI 상담 포함",
    text: "결제 후 7일간 최대 20회 질문할 수 있습니다.",
  },
];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseBirth(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
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
  if (savedTime === "모름" || enteredTime === "모름") return false;

  const savedMinutes = toMinutes(savedTime);
  const enteredMinutes = toMinutes(enteredTime);
  const savedRange = parseRange(savedTime);
  const enteredRange = parseRange(enteredTime);

  function isInside(
    minutes: number,
    range: { start: number; end: number }
  ) {
    return range.start <= range.end
      ? minutes >= range.start && minutes <= range.end
      : minutes >= range.start || minutes <= range.end;
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
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

function renderFreeResult(text: string) {
  const nodes: React.ReactNode[] = [];
  let bullets: string[] = [];

  function flushBullets() {
    if (!bullets.length) return;

    nodes.push(
      <ul className="resultList" key={`list-${nodes.length}`}>
        {bullets.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    bullets = [];
  }

  text.replace(/\r\n/g, "\n").split("\n").forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushBullets();
      return;
    }

    if (/^[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*]\s+/, ""));
      return;
    }

    flushBullets();

    if (line.startsWith("### ")) {
      nodes.push(
        <h4 className="resultHeadingSmall" key={`h4-${index}`}>
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h3 className="resultHeading" key={`h3-${index}`}>
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      nodes.push(
        <h2 className="resultHeadingLarge" key={`h2-${index}`}>
          {renderInline(line.slice(2))}
        </h2>
      );
    } else {
      nodes.push(
        <p className="resultParagraph" key={`p-${index}`}>
          {renderInline(line)}
        </p>
      );
    }
  });

  flushBullets();
  return nodes;
}

// 입력값과 사주 결과를 보내지 않고 고정된 단계 이름만 기록합니다.
function trackFunnelEvent(
  eventName: "free_saju_complete" | "premium_guide_click" | "premium_guide_view" | "begin_checkout"
) {
  try {
    const analyticsWindow = window as Window & { dataLayer?: unknown[] };
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
    function queueEvent(..._args: unknown[]) {
      analyticsWindow.dataLayer!.push(arguments);
    }
    queueEvent("event", eventName, {
      send_to: "G-E5JM4F9VDF",
      page_location: window.location.origin + window.location.pathname,
      ...(eventName === "begin_checkout" ? {
        currency: "KRW",
        value: 9900,
        items: [{ item_id: "myeongun_premium_saju", item_name: "명운 상세 사주", price: 9900, quantity: 1 }],
      } : {}),
    });
  } catch {
    // 추적 오류가 분석이나 결제 흐름을 중단하지 않도록 합니다.
  }
}

export default function SajuPage() {
  const homeResultTracked = useRef(false);
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
  const [yongshin, setYongshin] = useState<Yongshin | null>(null);
  const [showInputForm, setShowInputForm] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentYear);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    let scrollTimer: number | undefined;

    try {
      const fromHome =
        sessionStorage.getItem("myeongun_free_saju_from_home") === "1";

      // 홈의 무료 결과에는 홈에서 방금 입력한 정보를 사용합니다.
      const savedFormText = fromHome
        ? sessionStorage.getItem("myeongun_saju")
        : sessionStorage.getItem("myeongun_paid_saju") ||
          sessionStorage.getItem("myeongun_active_saju") ||
          sessionStorage.getItem("myeongun_saju");

      if (!savedFormText) return;

      const savedForm = JSON.parse(savedFormText) as SajuForm;
      setForm(savedForm);

      const savedBirth = parseBirth(savedForm.birth);
      if (savedBirth) {
        setPickerYear(savedBirth.year);
        setPickerMonth(savedBirth.month);
      }

      if (!fromHome) return;

      const savedResultText =
        sessionStorage.getItem("myeongun_saju_result");
      if (!savedResultText) return;

      const savedResult = JSON.parse(savedResultText);
      const resultText = String(savedResult?.result || "").trim();
      if (!resultText) return;

      if (!homeResultTracked.current) {
        trackFunnelEvent("free_saju_complete");
        homeResultTracked.current = true;
      }
      setFreeResult(resultText);
      setYongshin(savedResult?.yongshin || null);
      setShowInputForm(false);

      scrollTimer = window.setTimeout(() => {
        sessionStorage.removeItem("myeongun_free_saju_from_home");
        document.getElementById("free-saju-result")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch {
      // 저장 정보가 손상된 경우 입력 화면을 유지합니다.
    }

    return () => {
      if (scrollTimer !== undefined) window.clearTimeout(scrollTimer);
    };
  }, []);

  function update<K extends keyof SajuForm>(
    key: K,
    value: SajuForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFreeResult("");
    setYongshin(null);
    setError("");
  }

  const years = useMemo(
    () => Array.from(
      { length: currentYear - 1930 + 1 },
      (_, index) => currentYear - index
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
    const next = new Date(pickerYear, pickerMonth - 1 + delta, 1);
    const year = next.getFullYear();
    if (year < 1930 || year > currentYear) return;

    setPickerYear(year);
    setPickerMonth(next.getMonth() + 1);
  }

  function selectDay(day: number) {
    update("birth", `${pickerYear}-${pad2(pickerMonth)}-${pad2(day)}`);
    setPickerOpen(false);
  }

  async function tryReopenExistingPaidSaju(payload: SajuForm) {
    try {
      const savedText =
        sessionStorage.getItem("myeongun_paid_saju") ||
        sessionStorage.getItem("myeongun_saju");

      if (!savedText) return false;

      const saved = JSON.parse(savedText) as SajuForm;
      if (!sameSajuForReopen(saved, payload)) return false;

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

      sessionStorage.setItem("myeongun_saju", savedText);
      sessionStorage.setItem("myeongun_session_active", "1");
      router.push("/fortune/detail");
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setFreeResult("");
    setYongshin(null);

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

      // 기존 7일 결제 이용권은 유지합니다.
      sessionStorage.removeItem("myeongun_premium_result");

      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsed = await response.json();

      if (!response.ok) {
        throw new Error(parsed?.error || "사주 분석에 실패했습니다.");
      }

      const resultText = String(parsed?.result || "").trim();
      if (!resultText) {
        throw new Error("무료 사주 결과를 불러오지 못했습니다.");
      }

      sessionStorage.setItem("myeongun_saju", JSON.stringify(payload));
      sessionStorage.setItem("myeongun_saju_result", JSON.stringify(parsed));

      trackFunnelEvent("free_saju_complete");
      setForm(payload);
      setFreeResult(resultText);
      setYongshin(parsed?.yongshin || null);
      setPickerOpen(false);
      setShowInputForm(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  function handleRetry() {
    setFreeResult("");
    setYongshin(null);
    setError("");
    setPickerOpen(false);
    setShowInputForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <section
        className="sajuCard"
        style={{ display: showInputForm ? "block" : "none" }}
      >
        <header className="pageHeader">
          <div className="eyebrow">FREE SAJU</div>
          <h1>무료 사주 분석</h1>
          <p>나의 성향과 운세의 기본 흐름을 먼저 확인해 보세요.</p>
          <div className="inputGuide">
            무료 결과 확인 후 상세 분석을 선택할 수 있습니다.
          </div>
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
              required
              style={fieldStyle}
            />
          </label>

          <label style={{ ...labelStyle, marginTop: "22px" }}>
            생년월일
            <div className="birthRow">
              <input
                name="birth"
                type="text"
                readOnly
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
            <section className="datePicker" aria-label="생년월일 선택">
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
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
                <select
                  aria-label="월 선택"
                  value={pickerMonth}
                  onChange={(e) => setPickerMonth(Number(e.target.value))}
                  style={{ ...fieldStyle, minHeight: "44px", padding: "0 10px" }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>{month}월</option>
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
                      aria-pressed={selected}
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
              <option value="" disabled>시간을 선택하세요</option>
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="fieldHint">
            출생시간을 모르시면 ‘모름’을 선택해 주세요.
          </p>

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
              달력 기준
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

          {error && <p className="errorMessage" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={loading || !form.name.trim() || !form.birth || !form.time}
            className="submitButton"
          >
            {loading ? "무료 사주 분석 중..." : "무료로 내 사주 분석하기"}
          </button>
        </form>

        <Link href="/payment/reopen" className="reopenLink">
          이용코드로 상세 사주 다시 보기 →
        </Link>

        <p className="privacyText">
          입력하신 정보는 사주 분석을 위한 용도로만 사용됩니다.
        </p>
      </section>

      {freeResult && (
        <section className="resultCard" id="free-saju-result">
          <div className="resultEyebrow">FREE SAJU RESULT</div>
          <h2>{form.name || "고객"}님의 무료 사주 분석</h2>
          <p className="resultIntro">
            나의 기본 성향과 운세 흐름을 확인해 보세요.
            더 자세한 분석은 아래에서 선택할 수 있습니다.
          </p>

          <div className="resultSteps" aria-label="사주 이용 순서">
            <span className="completed">① 정보 입력</span>
            <span className="current" aria-current="step">② 무료 결과 확인</span>
            <span>③ 상세 분석 선택</span>
          </div>

          {yongshin && (
            <div className="elementBox">
              <div className="elementLabel">참고용 오행 분석</div>
              <div className="elementGrid">
                <div>
                  <span>나에게 가장 도움이 되는 기운 (용신)</span>
                  <strong>{yongshin.yongshin}</strong>
                </div>
                <div>
                  <span>함께 도움이 되는 기운 (희신)</span>
                  <strong>{yongshin.heesin}</strong>
                </div>
              </div>
              <p>{yongshin.reason}</p>
              <small>
                ※ 전통 명리의 확정 판정이 아닌 명운의 참고용 분석입니다.
              </small>
            </div>
          )}

          <div className="resultText">{renderFreeResult(freeResult)}</div>

          <UsageBenefits compact />

          <div className="premiumBox">
            <div className="premiumEyebrow">MYEONGUN PREMIUM</div>
            <h3>내 재물운과 앞으로의 흐름이 더 궁금하신가요?</h3>
            <p className="premiumIntro">
              무료 분석에서 확인한 나의 성향을 바탕으로,
              일과 돈, 인연과 앞으로의 흐름을 더 자세히 살펴보세요.
            </p>

            <div className="comparison">
              <div className="compareCard">
                <span>지금 확인한 내용</span>
                <strong>무료 사주</strong>
                <p>기본 성향과 운세 방향</p>
                <b>0원</b>
              </div>
              <div className="compareCard premiumCompare">
                <span>더 자세히 알고 싶다면</span>
                <strong>상세 사주</strong>
                <p>개인별 상세 분석 + AI 상담</p>
                <b>9,900원 <small>1회 결제</small></b>
              </div>
            </div>

            <div className="premiumFeatures">
              {PREMIUM_FEATURES.map((feature) => (
                <div className="premiumFeature" key={feature.title}>
                  <span className="featureCheck" aria-hidden="true">✓</span>
                  <div>
                    <strong>{feature.title}</strong>
                    <p>{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/payment"
              onClick={() => trackFunnelEvent("premium_guide_click")}
              className="premiumButton"
              style={{
                display: "flex",
                width: "min(100%, 430px)",
                minHeight: "82px",
                boxSizing: "border-box",
                margin: "0 auto",
                padding: "13px 22px",
                border: "2px solid #8f6018",
                borderRadius: "16px",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "5px",
                background: "linear-gradient(135deg, #9f6d1e 0%, #c99434 48%, #a36f1e 100%)",
                color: "#ffffff",
                textDecoration: "none",
                boxShadow: "0 12px 26px rgba(133, 88, 18, 0.28)",
              }}
            >
              <strong style={{ color: "#fff", fontSize: "19px", lineHeight: 1.4 }}>
                상세 사주 안내 보기 →
              </strong>
              <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
                9,900원 · AI 상담 7일간 최대 20회 포함
              </span>
            </Link>

            <Link href="/payment/reopen" className="reopenLink">
              이용코드로 상세 사주 다시 보기 →
            </Link>

            <p className="premiumPaymentGuide">
              다음 화면에서 제공 내용과 이용 조건을 확인한 후
              결제를 진행합니다.
            </p>
            <div className="premiumNotices">
              <p>결제 후 발급되는 이용코드는 재열람을 위해 별도로 보관해 주세요.</p>
              <p>
                사주 분석은 참고용 콘텐츠이며 미래의 결과를 보장하지 않습니다.
              </p>
              <Link href="/refund">환불정책 확인</Link>
            </div>
          </div>

          <button type="button" className="retryButton" onClick={handleRetry}>
            다른 사주 다시 보기
          </button>
        </section>
      )}

      <style jsx>{`
        .sajuPage {
          min-height: 100vh;
          padding: 58px 20px 82px;
          background:
            radial-gradient(circle at 50% 0%, rgba(225,185,105,.13), transparent 30%),
            linear-gradient(180deg, #f7f2e8, #fbf8f1 58%, #f5efe4);
          color: #17243a;
        }
        .sajuCard, .resultCard {
          box-sizing: border-box;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          border: 1px solid #dfd4c2;
          border-radius: 26px;
          background: rgba(255,253,249,.97);
          box-shadow: 0 24px 60px rgba(31,39,53,.09);
        }
        .sajuCard { padding: 46px 38px 34px; }
        .pageHeader { margin-bottom: 34px; text-align: center; }
        .eyebrow, .resultEyebrow, .premiumEyebrow {
          color: #a97924;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
        }
        .pageHeader h1 {
          margin: 12px 0 10px;
          font-size: 38px;
          line-height: 1.25;
          font-weight: 900;
          letter-spacing: -.04em;
        }
        .pageHeader p {
          margin: 0;
          color: #786f64;
          font-size: 16px;
          line-height: 1.7;
        }
        .inputGuide {
          margin-top: 13px;
          color: #8b651f;
          font-size: 13px;
          line-height: 1.7;
        }
        .birthRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
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
          box-shadow: 0 14px 34px rgba(31,39,53,.08);
        }
        .pickerTop {
          display: grid;
          grid-template-columns: 44px minmax(0,1fr) minmax(0,1fr) 44px;
          gap: 8px;
          align-items: center;
        }
        .calendarGrid {
          display: grid;
          grid-template-columns: repeat(7,minmax(0,1fr));
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
        .timeSelect, .darkSelect {
          width: 100%;
          box-sizing: border-box;
          min-height: 56px;
          padding: 0 18px;
          border: 1px solid #ddd2bf;
          border-radius: 12px;
          background: #fffdfa;
          color: #17243a;
          font-size: 16px;
          cursor: pointer;
        }
        .timeSelect:focus, .darkSelect:focus {
          border-color: #b9862e;
          box-shadow: 0 0 0 3px rgba(185,134,46,.11);
        }
        .timeSelect option, .darkSelect option {
          background: #fff;
          color: #17243a;
        }
        .fieldHint {
          margin: 9px 0 0;
          color: #786f64;
          font-size: 12px;
          line-height: 1.6;
        }
        .twoCol {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
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
          background: linear-gradient(90deg,#d7a746,#f0c66d 50%,#d7a746);
          color: #142137;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(183,132,39,.17);
        }
        .submitButton:disabled {
          border-color: #d8c7a7;
          background: #e8dcc6;
          box-shadow: none;
          cursor: default;
        }
        .sajuPage :global(.reopenLink) {
          display: block;
          width: fit-content;
          max-width: 100%;
          box-sizing: border-box;
          margin: 18px auto 0;
          padding: 13px 18px;
          border: 1px solid #d9c9ad;
          border-radius: 12px;
          background: #fffaf1;
          color: #805719;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.6;
          text-align: center;
          text-decoration: none;
        }
        .sajuPage :global(.reopenLink:hover) {
          border-color: #b9852c;
          background: #fff4df;
        }
        .sajuPage :global(.reopenLink:focus-visible) {
          outline: 3px solid #17243a;
          outline-offset: 3px;
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
          padding: 44px;
          scroll-margin-top: 24px;
        }
        .resultCard h2 {
          margin: 12px 0 14px;
          font-size: 30px;
          line-height: 1.35;
          letter-spacing: -.035em;
        }
        .resultIntro {
          margin: 0;
          color: #786f64;
          font-size: 14px;
          line-height: 1.8;
          word-break: keep-all;
        }
        .resultSteps {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 8px;
          margin: 22px 0;
        }
        .resultSteps span {
          padding: 12px 8px;
          border: 1px solid #e6dccb;
          border-radius: 10px;
          background: #f8f5ef;
          color: #82796c;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.5;
        }
        .resultSteps .completed { color: #726343; }
        .resultSteps .current {
          border-color: #c99535;
          background: #f6ead4;
          color: #805719;
        }
        .elementBox {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #d8d0c3;
          border-radius: 14px;
          background: #f8f5ee;
        }
        .elementLabel {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          color: #777;
        }
        .elementGrid {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .elementGrid > div {
          padding: 14px;
          border-radius: 10px;
          background: #fff;
        }
        .elementGrid span {
          font-size: 12px;
          line-height: 1.6;
          color: #777;
        }
        .elementGrid strong {
          display: block;
          margin-top: 5px;
          font-size: 20px;
        }
        .elementBox p {
          margin: 12px 0 0;
          color: #777;
          font-size: 12px;
          line-height: 1.6;
        }
        .elementBox small {
          display: block;
          margin-top: 8px;
          color: #888;
          font-size: 11px;
          line-height: 1.5;
        }
        .resultText {
          padding: 30px;
          border: 1px solid #e6dccb;
          border-radius: 18px;
          background: #fffdf9;
          color: #45433f;
          font-size: 15.5px;
          line-height: 1.92;
          overflow-wrap: anywhere;
        }
        .resultText :global(.resultHeadingLarge) {
          margin: 34px 0 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2d6c2;
          color: #17243a;
          font-size: 25px;
          line-height: 1.4;
          letter-spacing: -.025em;
        }
        .resultText :global(.resultHeading) {
          margin: 30px 0 14px;
          padding: 11px 14px;
          border-left: 4px solid #c89535;
          border-radius: 0 10px 10px 0;
          background: linear-gradient(90deg,#f6ead4,rgba(246,234,212,.28) 72%,transparent);
          color: #805719;
          font-size: 20px;
          line-height: 1.45;
          letter-spacing: -.02em;
        }
        .resultText :global(.resultHeadingSmall) {
          margin: 22px 0 10px;
          color: #72511a;
          font-size: 17px;
          font-weight: 900;
          line-height: 1.5;
        }
        .resultText :global(.resultParagraph) {
          margin: 0 0 15px;
          word-break: keep-all;
        }
        .resultText :global(.resultList) {
          margin: 10px 0 20px;
          padding: 15px 18px 15px 38px;
          border: 1px solid #eee3d2;
          border-radius: 12px;
          background: #fbf7ef;
        }
        .resultText :global(.resultList li) { margin-bottom: 8px; }
        .resultText :global(.resultList li:last-child) { margin-bottom: 0; }
        .resultText :global(strong) { color: #17243a; font-weight: 900; }
        .premiumBox {
          margin-top: 30px;
          padding: 34px 30px;
          border: 1px solid #d7bd8c;
          border-radius: 20px;
          background:
            radial-gradient(circle at 50% 0%,rgba(222,174,82,.16),transparent 48%),
            linear-gradient(135deg,#f6ead3,#fffaf1);
          box-shadow: 0 14px 34px rgba(122,84,25,.08);
          text-align: center;
        }
        .premiumBox h3 {
          margin: 12px 0;
          font-size: 25px;
          line-height: 1.45;
          letter-spacing: -.035em;
          word-break: keep-all;
        }
        .premiumIntro {
          max-width: 650px;
          margin: 0 auto 22px;
          color: #6f685e;
          font-size: 14px;
          line-height: 1.8;
          word-break: keep-all;
        }
        .comparison {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 12px;
          margin-bottom: 20px;
          text-align: left;
        }
        .compareCard {
          display: flex;
          flex-direction: column;
          padding: 20px;
          border: 1px solid #e4d9c8;
          border-radius: 14px;
          background: rgba(255,255,255,.65);
        }
        .compareCard > span { color: #786f64; font-size: 11px; }
        .compareCard > strong { margin-top: 7px; font-size: 18px; }
        .compareCard p {
          margin: 10px 0 16px;
          color: #6f685e;
          font-size: 13px;
          line-height: 1.6;
        }
        .compareCard b { margin-top: auto; font-size: 24px; }
        .compareCard b small {
          display: inline-block;
          color: #786f64;
          font-size: 11px;
          font-weight: 600;
        }
        .premiumCompare {
          border-color: #c99535;
          background: #fff3da;
        }
        .premiumFeatures {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 14px;
          margin: 0 0 26px;
          text-align: left;
        }
        .premiumFeature {
          display: flex;
          gap: 10px;
          padding: 15px;
          border-radius: 12px;
          background: rgba(255,255,255,.55);
        }
        .featureCheck { color: #9f6d1e; font-weight: 900; }
        .premiumFeature strong { font-size: 14px; }
        .premiumFeature p {
          margin: 6px 0 0;
          color: #6f685e;
          font-size: 12px;
          line-height: 1.7;
          word-break: keep-all;
        }
        .premiumButton { transition: transform .16s ease; }
        .premiumButton:hover { transform: translateY(-2px); }
        .premiumButton:focus-visible {
          outline: 3px solid #17243a;
          outline-offset: 4px;
        }
        .premiumPaymentGuide {
          max-width: 600px;
          margin: 15px auto 0;
          color: #756b5d;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.7;
          word-break: keep-all;
        }
        .premiumNotices {
          margin-top: 19px;
          padding-top: 16px;
          border-top: 1px solid #e2d2b7;
          color: #827666;
          font-size: 11px;
          line-height: 1.7;
        }
        .premiumNotices p { margin: 0 0 5px; }
        .premiumNotices :global(a) {
          display: inline-block;
          margin-top: 5px;
          color: #805719;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .retryButton {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          margin: 18px auto 0;
          padding: 0 24px;
          border: 1px solid #d8c7a7;
          border-radius: 12px;
          background: #fffdfa;
          color: #7f5b1f;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }
        .retryButton:hover {
          border-color: #b9852c;
          background: #fff8ec;
        }
        @media (max-width: 640px) {
          .sajuPage { padding: 30px 12px 58px; }
          .sajuCard, .resultCard {
            padding: 30px 18px 26px;
            border-radius: 20px;
          }
          .pageHeader { margin-bottom: 28px; }
          .pageHeader h1 { font-size: 30px; }
          .pageHeader p { font-size: 14px; }
          .twoCol { grid-template-columns: 1fr; }
          .pickerTop {
            grid-template-columns: 36px minmax(0,1fr) minmax(0,1fr) 36px;
            gap: 5px;
          }
          .datePicker { padding: 12px; }
          .timeSelect, .darkSelect { font-size: 14px; }
          .resultCard h2 { font-size: 24px; }
          .resultSteps { gap: 5px; }
          .resultSteps span { padding: 10px 4px; font-size: 11px; }
          .resultText {
            padding: 20px 16px;
            font-size: 14.5px;
            line-height: 1.85;
          }
          .resultText :global(.resultHeadingLarge) {
            margin-top: 28px;
            font-size: 21px;
          }
          .resultText :global(.resultHeading) {
            margin-top: 25px;
            padding: 10px 11px;
            font-size: 18px;
          }
          .resultText :global(.resultList) {
            padding: 13px 12px 13px 31px;
          }
          .premiumBox { padding: 26px 16px; }
          .premiumBox h3 { font-size: 22px; }
          .comparison { gap: 8px; }
          .compareCard { padding: 15px 12px; }
          .compareCard b { font-size: 22px; }
          .premiumFeatures { grid-template-columns: 1fr; gap: 9px; }
          .retryButton { width: 100%; box-sizing: border-box; }
        }
      `}</style>
    </main>
  );
}