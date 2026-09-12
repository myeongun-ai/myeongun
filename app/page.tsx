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
    image: "/characters/myeongun-saju.png",
    title: "종합 사주",
    text: "나의 타고난 운명과 인생의 큰 흐름을 읽다",
    href: "/saju",
  },
  {
    image: "/characters/myeongun-business.png",
    title: "재물·사업",
    text: "돈의 흐름과 기회, 성공의 길을 찾다",
    href: "/fortune/business",
  },
  {
    image: "/characters/myeongun-compatibility.png",
    title: "궁합",
    text: "두 사람의 인연과 관계의 흐름을 살펴보다",
    href: "/compatibility",
  },
  {
    image: "/characters/myeongun-2026.png",
    title: "2026 운세",
    text: "다가올 기회와 한 해의 흐름을 미리 준비하다",
    href: "/fortune/2026",
  },
  {
    image: "/characters/myeongun-ai.png",
    title: "AI 상담",
    text: "사주에 대한 궁금증을 언제든지 물어보세요",
    href: "/ai",
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
  const [yongshin, setYongshin] = useState<{ yongshin: string; heesin: string; reason: string } | null>(null);
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
          "linear-gradient(180deg, #0b0e16 0%, #090b12 72%, #07080d 100%)",
        color: "#ffffff",
        fontFamily:
          "Arial, 'Noto Sans KR', 'Malgun Gothic', sans-serif",
      }}
    >
      {/* HERO - LARGE STRUCTURE */}
      <section className="homeHero">
        <div className="homeHeroGlow homeHeroGlowOne" />
        <div className="homeHeroGlow homeHeroGlowTwo" />

        <div className="homeHeroInner">
          <div className="homeHeroCharacterWrap">
            <img
              className="homeHeroCharacter"
              src="/characters/myeongun-hero.png"
              alt="명운 한복 캐릭터"
            />
          </div>

          <div className="homeHeroText">
            <div className="homeHeroEyebrow">
              사람의 운명에는 언제나 좋은 흐름이 있습니다.
            </div>

            <h1>
              <span>당신의 흐름</span>을 읽다
            </h1>

            <p className="homeHeroLead">
              명운은 당신의 오늘과 내일을 함께 합니다.
            </p>

            <div className="homeHeroBenefits">
              <div><strong>◇</strong><span>나를 이해하는<br />시간</span></div>
              <div><strong>♡</strong><span>더 좋은 인연을<br />만드는 지혜</span></div>
              <div><strong>▥</strong><span>기회를 읽는<br />통찰</span></div>
              <div><strong>✦</strong><span>더 빛나는<br />내일을 위해</span></div>
            </div>

            <div className="homeHeroQuote">
              “좋은 날은 언제나 옵니다.”
            </div>
          </div>
        </div>

        <div className="homeQuickPanelWrap" id="free-saju">
          <div className="homeQuickPanel">
            <div className="homeQuickTabs">
              <a className="active" href="#free-saju">사주보기</a>
              <Link href="/compatibility">궁합보기</Link>
              <Link href="/fortune/2026">2026 운세</Link>
              <Link href="/ai">AI 상담</Link>
            </div>

            <form className="homeQuickForm" onSubmit={handleSubmit}>
              <div className="homeQuickField">
                <label>이름</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="homeQuickField">
                <label>생년월일</label>
                <button
                  type="button"
                  className="homeQuickBirthButton"
                  onClick={() => setCalendarOpen((prev) => !prev)}
                >
                  <span>{form.birth || "생년월일 선택"}</span>
                  <b>달력</b>
                </button>
              </div>

              <div className="homeQuickField">
                <label>출생시간</label>
                <select
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>시간을 선택하세요</option>
                  {TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="homeQuickField homeQuickFieldSmall">
                <label>성별</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>

              <div className="homeQuickField homeQuickFieldSmall">
                <label>달력 기준</label>
                <select
                  name="calendar"
                  value={form.calendar}
                  onChange={handleChange}
                >
                  <option value="양력">양력</option>
                  <option value="음력">음력(평달)</option>
                  <option value="음력(윤달)">음력(윤달)</option>
                </select>
              </div>

              <button
                type="submit"
                className="homeQuickSubmit"
                disabled={loading}
              >
                {loading ? "분석 중..." : "내 사주 무료로 보기"}
                {!loading && <span>→</span>}
              </button>

              {calendarOpen && (
                <div className="homeQuickCalendar">
                  <div className="homeQuickCalendarHead">
                    <button type="button" onClick={previousMonth}>‹</button>

                    <div>
                      <select
                        aria-label="연도 선택"
                        value={year}
                        onChange={(e) =>
                          setViewDate(new Date(Number(e.target.value), month, 1))
                        }
                      >
                        {Array.from(
                          { length: new Date().getFullYear() - 1930 + 1 },
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
                          setViewDate(new Date(year, Number(e.target.value), 1))
                        }
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

                    <button type="button" onClick={nextMonth}>›</button>
                  </div>

                  <div className="homeQuickCalendarGrid">
                    {daysOfWeek.map((day) => (
                      <div className="homeQuickCalendarWeek" key={day}>
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
                          className={
                            form.birth ===
                            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                              ? "selected"
                              : ""
                          }
                          onClick={() => selectDate(day)}
                        >
                          {day}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {error && <p className="homeQuickError">{error}</p>}
            </form>

            <div className="homeQuickBottom">
              <span>🔒 입력하신 정보는 사주 분석을 위한 용도로 사용됩니다.</span>
              <span>무료 분석 · 상세 분석 · 결제 사주 재열람 지원</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE CARDS */}
      <section className="homeServiceArea">
        <div className="homeServiceSection">
          <div className="homeSectionHeading">
            <span>MYEONGUN SERVICES</span>
            <h2>명운의 주요 서비스</h2>
            <p>사주부터 재물·사업, 궁합, 연간 운세와 AI 상담까지 한 곳에서 확인하세요.</p>
          </div>

          {/* Desktop / tablet service cards */}
          <div className="homeServiceGrid homeServiceDesktopOnly">
            {cards.map((card) => (
              <Link
                key={`desktop-${card.title}`}
                href={card.href}
                className="homeServiceCard"
              >
                <div className="homeServiceImageWrap">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="homeServiceImage"
                  />
                </div>

                <div className="homeServiceBody">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <span className="homeServiceButton">바로가기 →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile service cards: first 4 are 2×2, AI is a separate full-width row */}
          <div className="homeServiceMobileOnly">
            <div className="homeServiceMobileGrid">
              {cards.slice(0, 4).map((card) => (
                <Link
                  key={`mobile-${card.title}`}
                  href={card.href}
                  className="homeServiceCard homeServiceMobilePairCard"
                >
                  <div className="homeServiceImageWrap">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="homeServiceImage"
                    />
                  </div>

                  <div className="homeServiceBody">
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                    <span className="homeServiceButton">바로가기 →</span>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/ai"
              className="homeServiceCard homeServiceMobileAiWide"
            >
              <div className="homeServiceImageWrap">
                <img
                  src="/characters/myeongun-ai.png"
                  alt="AI 상담"
                  className="homeServiceImage"
                />
              </div>

              <div className="homeServiceBody">
                <h3>AI 상담</h3>
                <p>사주에 대한 궁금증을 언제든지 물어보세요</p>
                <span className="homeServiceButton">바로가기 →</span>
              </div>
            </Link>
          </div>

          <div className="homeUtilityGrid">
            <div className="homeUtilityItem">
              <b>01</b>
              <div><strong>이용안내</strong><span>처음 이용하시는 분</span></div>
            </div>
            <div className="homeUtilityItem">
              <b>02</b>
              <div><strong>결제안내</strong><span>간편하고 안전하게</span></div>
            </div>
            <div className="homeUtilityItem">
              <b>03</b>
              <div><strong>자주 묻는 질문</strong><span>궁금한 점을 확인하세요</span></div>
            </div>
            <div className="homeUtilityItem">
              <b>04</b>
              <div><strong>고객센터</strong><span>평일 09:00 - 18:00</span></div>
            </div>
          </div>

          <div className="homeQuoteBanner">
            <img
              src="/characters/myeongun-hero.png"
              alt=""
              className="homeQuoteCharacter"
            />
            <div>
              <span>MYEONGUN MESSAGE</span>
              <strong>“좋은 날은 언제나 옵니다.”</strong>
              <p>명운이 당신의 오늘과 더 나은 내일을 함께하겠습니다.</p>
            </div>
            <a href="#free-saju">무료 사주 시작 →</a>
          </div>
        </div>
      </section>

      {/* SUPPORT AREA */}
      <section className="homeSupportSection">
        <div className="homeSupportGrid">
          <div className="homeSupportVideoCard">
            <div className="homeSupportHeading">
              <span>MYEONGUN STORY</span>
              <h2>명운을 영상으로 만나보세요</h2>
              <p>명운이 전하는 이야기와 서비스의 흐름을 짧은 영상으로 확인하실 수 있습니다.</p>
            </div>

            <div className="homePromoFrame">
              <video
                className="homePromoVideo"
                src="/myeongun-home.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              />
            </div>

            <p className="homePromoGuide">
              영상은 자동 재생 시 음소거됩니다. 소리 버튼으로 음성을 들을 수 있습니다.
            </p>
          </div>

          <div className="homeSupportSide">
            <div className="homeSupportCard">
              <span>PAID SAJU REOPEN</span>
              <h3>이미 상세 사주를 결제하셨나요?</h3>
              <p>
                결제 후 7일 동안 재열람 코드로 PC와 휴대폰에서 다시 볼 수 있습니다.
              </p>
              <Link href="/payment/reopen">
                결제한 상세 사주 다시 보기 →
              </Link>
            </div>

            <div className="homeSupportCard homeSupportAi">
              <span>MYEONGUN AI</span>
              <h3>사주에 대해 궁금한 것이 있나요?</h3>
              <p>
                재물, 사업, 직업, 연애, 인간관계 등 궁금한 내용을 AI와 대화해보세요.
              </p>
              <Link href="/ai">
                AI 상담 시작 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RESULT */}
      {freeResult && (
        <section
          id="free-saju-result"
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

            {yongshin && (
              <div style={{ marginBottom: "24px", padding: "20px", borderRadius: "16px", border: "1px solid rgba(218,170,88,0.25)", background: "rgba(218,170,88,0.07)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", color: "#dbaa58" }}>참고용 오행 분석</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px" }}>
                  <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}><div style={{ fontSize: "12px", color: "#aaa" }}>용신</div><strong style={{ display: "block", marginTop: "5px", fontSize: "21px", color: "#f5e7c2" }}>{yongshin.yongshin}</strong></div>
                  <div style={{ padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}><div style={{ fontSize: "12px", color: "#aaa" }}>희신</div><strong style={{ display: "block", marginTop: "5px", fontSize: "21px", color: "#f5e7c2" }}>{yongshin.heesin}</strong></div>
                </div>
                <p style={{ margin: "12px 0 0", fontSize: "12px", lineHeight: 1.6, color: "#aaa" }}>{yongshin.reason}</p>
                <p style={{ margin: "7px 0 0", fontSize: "11px", lineHeight: 1.5, color: "#777" }}>※ 전통 명리의 확정 판정이 아닌 명운의 참고용 분석입니다.</p>
              </div>
            )}
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
        .homeHero {
          position: relative;
          overflow: hidden;
          min-height: 690px;
          border-bottom: 1px solid rgba(218,170,88,0.14);
          background:
            radial-gradient(circle at 78% 16%, rgba(247,214,146,0.20), transparent 15%),
            radial-gradient(circle at 18% 36%, rgba(69,92,157,0.20), transparent 28%),
            linear-gradient(135deg, #111b31 0%, #14233f 50%, #0b1426 100%);
        }
        .homeHero::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(2,7,17,0.02), rgba(2,7,17,0.38));
          opacity: .9;
        }
        .homeHero::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 180px;
          pointer-events: none;
          background: linear-gradient(180deg, transparent, rgba(5,8,15,0.62));
        }
        .homeHeroGlowOne::after {
          content: "";
          position: absolute;
          width: 150px;
          height: 150px;
          right: 70px;
          top: 80px;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 35%, #fff4cf 0%, #ead49c 48%, #c9ad6d 100%);
          box-shadow: 0 0 70px rgba(239,205,132,.28);
          opacity: .55;
        }
        .homeHeroInner {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          min-height: 525px;
          margin: 0 auto;
          padding: 34px 34px 18px;
          display: grid;
          grid-template-columns: minmax(390px, 0.92fr) minmax(0, 1.08fr);
          align-items: center;
          gap: 54px;
        }
        .homeHeroText {
          padding: 20px 0 34px;
        }
        .homeHeroEyebrow {
          color: #f1eadf;
          font-size: 17px;
          line-height: 1.7;
          margin-bottom: 15px;
          letter-spacing: -0.2px;
        }
        .homeHero h1 {
          margin: 0;
          color: #fffaf0;
          font-size: clamp(50px, 5.4vw, 74px);
          line-height: 1.08;
          letter-spacing: -4px;
          font-weight: 900;
        }
        .homeHero h1 span {
          color: #efbd60;
        }
        .homeHeroLead {
          margin: 20px 0 0;
          color: #ded8cc;
          font-size: 19px;
          line-height: 1.7;
        }
        .homeHeroBenefits {
          margin-top: 34px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          max-width: 610px;
        }
        .homeHeroBenefits > div {
          text-align: center;
          color: #eee8dd;
          font-size: 12px;
          line-height: 1.5;
        }
        .homeHeroBenefits strong {
          display: block;
          color: #efbd60;
          font-size: 27px;
          line-height: 1;
          margin-bottom: 9px;
        }
        .homeHeroQuote {
          display: inline-block;
          margin-top: 28px;
          padding: 12px 0 0;
          border-top: 1px solid rgba(239,189,96,0.62);
          color: #f2ce82;
          font-size: 16px;
          letter-spacing: 0.2px;
        }
        .homeHeroCharacterWrap {
          min-height: 500px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
        }
        .homeHeroCharacterWrap::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 16px;
          width: 78%;
          height: 50px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: rgba(0,0,0,0.28);
          filter: blur(18px);
        }
        .homeHeroCharacter {
          position: relative;
          z-index: 2;
          display: block;
          width: min(100%, 540px);
          max-height: 540px;
          object-fit: contain;
          object-position: center bottom;
          filter: drop-shadow(0 28px 44px rgba(0,0,0,0.38));
        }
        .homeHeroGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(60px);
          opacity: .55;
          pointer-events: none;
        }
        .homeHeroGlowOne {
          width: 300px;
          height: 300px;
          right: 4%;
          top: -40px;
          background: rgba(225,177,83,.13);
        }
        .homeHeroGlowTwo {
          width: 380px;
          height: 380px;
          left: -120px;
          bottom: -170px;
          background: rgba(60,85,165,.22);
        }

        .homeQuickPanelWrap {
          position: relative;
          z-index: 5;
          max-width: 1280px;
          margin: -46px auto 0;
          padding: 0 34px 34px;
        }
        .homeQuickPanel {
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(206,173,111,0.52);
          background: rgba(250,247,240,0.98);
          box-shadow: 0 24px 60px rgba(0,0,0,0.30);
          color: #172033;
        }
        .homeQuickTabs {
          min-height: 52px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #e5ded1;
        }
        .homeQuickTabs a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 0 22px;
          border-radius: 10px;
          color: #536070;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }
        .homeQuickTabs a.active {
          background: linear-gradient(135deg, #f3ca76, #e8b554);
          color: #36240a;
        }
        .homeQuickContent {
          padding: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 230px;
          gap: 18px;
          align-items: stretch;
        }
        .homeQuickInfo {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .homeQuickInfo > div {
          min-width: 0;
          padding: 14px 13px;
          border: 1px solid #e2ddd4;
          border-radius: 13px;
          background: #fff;
        }
        .homeQuickInfo span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          margin-bottom: 8px;
          border-radius: 999px;
          background: #f4ead7;
          color: #9d6b1e;
          font-size: 10px;
          font-weight: 900;
        }
        .homeQuickInfo strong {
          display: block;
          color: #1d2939;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .homeQuickInfo small {
          display: block;
          overflow: hidden;
          color: #7b8492;
          font-size: 11px;
          line-height: 1.45;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .homeQuickButton {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 100%;
          border-radius: 16px;
          background: linear-gradient(135deg, #efc46c, #e6ad45);
          color: #2e210d;
          font-size: 16px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
        }
        .homeQuickButton span {
          font-size: 21px;
        }
        .homeQuickBottom {
          padding: 0 20px 16px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          color: #7a8490;
          font-size: 11px;
        }

        .homeServiceArea {
          background:
            radial-gradient(circle at 50% 0%, rgba(255,255,255,.96), transparent 34%),
            linear-gradient(180deg, #faf7f0 0%, #f1ebe1 100%);
          color: #111827;
          border-bottom: 1px solid rgba(139,106,54,.16);
        }
        .homeServiceSection {
          max-width: 1280px;
          margin: 0 auto;
          padding: 62px 34px 52px;
        }
        .homeSectionHeading {
          text-align: center;
          margin: 0 auto 30px;
        }
        .homeSectionHeading > span {
          color: #a17025;
          font-size: 10px;
          letter-spacing: 2.4px;
          font-weight: 900;
        }
        .homeSectionHeading h2 {
          margin: 8px 0 8px;
          color: #162033;
          font-size: 31px;
          letter-spacing: -1.2px;
        }
        .homeSectionHeading p {
          margin: 0;
          color: #717a87;
          font-size: 13px;
          line-height: 1.7;
        }
        .homeServiceMobileOnly {
          display: none;
        }
        .homeServiceGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap: 14px;
          align-items: stretch;
        }
        .homeServiceCard {
          display: flex;
          min-width: 0;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e1d9cd;
          border-radius: 18px;
          background: rgba(255,255,255,.94);
          color: #111827;
          text-decoration: none;
          box-shadow: 0 13px 30px rgba(35,28,18,.075);
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .homeServiceAiCard {
          min-width: 0;
        }
        .homeServiceCard:hover {
          transform: translateY(-5px);
          border-color: rgba(197,142,48,.55);
          box-shadow: 0 20px 42px rgba(35,28,18,.13);
        }
        .homeServiceImageWrap {
          aspect-ratio: 1.22 / 1;
          overflow: hidden;
          background: #ebe8e2;
        }
        .homeServiceImage {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .homeServiceBody {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 16px 16px 15px;
        }
        .homeServiceBody h3 {
          margin: 0 0 7px;
          color: #101828;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -.45px;
        }
        .homeServiceBody p {
          min-height: 60px;
          margin: 0 0 14px;
          color: #667085;
          font-size: 12px;
          line-height: 1.65;
          font-weight: 600;
        }
        .homeServiceButton {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          margin-top: auto;
          border: 1px solid #d8a34a;
          border-radius: 999px;
          background: linear-gradient(180deg,#fffdf8,#fbf2df);
          color: #765019;
          font-size: 11px;
          font-weight: 900;
        }
        .homeUtilityGrid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          overflow: hidden;
          border: 1px solid #e1d9cc;
          border-radius: 16px;
          background: rgba(255,255,255,.88);
          box-shadow: 0 10px 26px rgba(35,28,18,.05);
        }
        .homeUtilityItem {
          min-height: 74px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-right: 1px solid #e7e1d8;
        }
        .homeUtilityItem:last-child {
          border-right: 0;
        }
        .homeUtilityItem b {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 11px;
          background: #f8eedc;
          color: #a66f19;
          font-size: 10px;
          box-shadow: inset 0 0 0 1px rgba(205,158,78,.12);
        }
        .homeUtilityItem strong,
        .homeUtilityItem span {
          display: block;
        }
        .homeUtilityItem strong {
          color: #263143;
          font-size: 12px;
          margin-bottom: 3px;
        }
        .homeUtilityItem span {
          color: #8a919c;
          font-size: 10px;
        }
        .homeQuoteBanner {
          position: relative;
          overflow: hidden;
          min-height: 104px;
          margin-top: 18px;
          padding: 18px 156px 18px 148px;
          display: flex;
          align-items: center;
          border: 1px solid rgba(218,170,88,.24);
          border-radius: 18px;
          background:
            radial-gradient(circle at 12% 80%, rgba(82,112,184,.18), transparent 24%),
            linear-gradient(110deg,#17233b 0%,#0d1b32 64%,#10192b 100%);
          color: #fff;
          box-shadow: 0 18px 36px rgba(24,30,43,.15);
        }
        .homeQuoteCharacter {
          position: absolute;
          left: 18px;
          bottom: -54px;
          width: 120px;
          height: 158px;
          object-fit: contain;
          object-position: center bottom;
        }
        .homeQuoteBanner div {
          position: relative;
          z-index: 2;
        }
        .homeQuoteBanner div > span {
          display: block;
          color: #d8aa57;
          font-size: 9px;
          letter-spacing: 1.8px;
          margin-bottom: 5px;
          font-weight: 900;
        }
        .homeQuoteBanner strong {
          display: block;
          color: #f2d58e;
          font-size: 19px;
          margin-bottom: 5px;
        }
        .homeQuoteBanner p {
          margin: 0;
          color: #aeb8c8;
          font-size: 10px;
        }
        .homeQuoteBanner > a {
          position: absolute;
          z-index: 2;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 118px;
          min-height: 38px;
          padding: 0 15px;
          border: 1px solid rgba(222,174,91,.62);
          border-radius: 999px;
          background: rgba(218,170,88,.07);
          color: #efc76f;
          font-size: 11px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
        }

        .homeQuickForm {
          position: relative;
          padding: 16px 20px 18px;
          display: grid;
          grid-template-columns: 1.12fr 1.18fr 1.42fr .72fr .86fr 1.28fr;
          gap: 9px;
          align-items: end;
        }
        .homeQuickField {
          min-width: 0;
        }
        .homeQuickField label {
          display: block;
          margin: 0 0 6px 2px;
          color: #616a76;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .4px;
        }
        .homeQuickField input,
        .homeQuickField select,
        .homeQuickBirthButton {
          width: 100%;
          height: 52px;
          box-sizing: border-box;
          border: 1px solid #ded8cf;
          border-radius: 11px;
          background: #fff;
          color: #172033;
          outline: none;
          padding: 0 12px;
          font-size: 12px;
          font-family: inherit;
        }
        .homeQuickField input::placeholder {
          color: #a3a9b1;
        }
        .homeQuickField select {
          cursor: pointer;
        }
        .homeQuickBirthButton {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          cursor: pointer;
          text-align: left;
        }
        .homeQuickBirthButton span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #606a77;
        }
        .homeQuickBirthButton b {
          flex: 0 0 auto;
          color: #9a691e;
          font-size: 10px;
        }
        .homeQuickSubmit {
          height: 52px;
          border: 0;
          border-radius: 13px;
          background: linear-gradient(135deg, #efc46c, #e6ad45);
          color: #2c1f0b;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          font-family: inherit;
        }
        .homeQuickSubmit:disabled {
          opacity: .65;
          cursor: default;
        }
        .homeQuickSubmit span {
          margin-left: 8px;
          font-size: 17px;
        }
        .homeQuickCalendar {
          grid-column: 1 / -1;
          margin-top: 2px;
          padding: 16px;
          border: 1px solid #d9d1c4;
          border-radius: 16px;
          background: #fffdf8;
          box-shadow: 0 18px 42px rgba(26,31,43,0.14);
        }
        .homeQuickCalendarHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .homeQuickCalendarHead > button {
          width: 34px;
          height: 34px;
          border: 1px solid #ddd4c5;
          border-radius: 9px;
          background: #f7f1e6;
          color: #74501b;
          font-size: 20px;
          cursor: pointer;
        }
        .homeQuickCalendarHead > div {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          min-width: 220px;
        }
        .homeQuickCalendarHead select {
          height: 36px;
          border: 1px solid #ddd4c5;
          border-radius: 9px;
          background: #fff;
          color: #283244;
          padding: 0 8px;
          font-weight: 800;
        }
        .homeQuickCalendarGrid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
          text-align: center;
        }
        .homeQuickCalendarWeek {
          padding: 6px 0;
          color: #9a691e;
          font-size: 11px;
          font-weight: 900;
        }
        .homeQuickCalendarGrid button {
          min-height: 34px;
          border: 0;
          border-radius: 8px;
          background: #f4f1eb;
          color: #303948;
          cursor: pointer;
        }
        .homeQuickCalendarGrid button.selected {
          background: #e5b153;
          color: #201605;
          font-weight: 900;
        }
        .homeQuickError {
          grid-column: 1 / -1;
          margin: 2px 0 0;
          color: #b7443d;
          font-size: 11px;
          font-weight: 700;
        }

        .homeSupportSection {
          position: relative;
          padding: 54px 24px 60px;
          background:
            radial-gradient(circle at 18% 8%, rgba(218,170,88,.08), transparent 24%),
            radial-gradient(circle at 86% 30%, rgba(68,91,160,.10), transparent 26%),
            linear-gradient(180deg, #0d111b 0%, #090c13 100%);
          border-top: 1px solid rgba(218,170,88,.08);
        }
        .homeSupportSection::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          width: min(1040px, calc(100% - 48px));
          height: 1px;
          transform: translateX(-50%);
          background: linear-gradient(90deg, transparent, rgba(218,170,88,.26), transparent);
        }
        .homeSupportGrid {
          position: relative;
          z-index: 1;
          max-width: 1040px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(300px, .72fr);
          gap: 18px;
          align-items: stretch;
        }
        .homeSupportVideoCard,
        .homeSupportCard {
          border: 1px solid rgba(218,170,88,.22);
          background:
            linear-gradient(145deg, rgba(24,29,43,.98), rgba(12,15,24,.98));
          box-shadow: 0 20px 48px rgba(0,0,0,.20);
        }
        .homeSupportVideoCard {
          padding: 20px;
          border-radius: 20px;
        }
        .homeSupportHeading {
          margin-bottom: 14px;
        }
        .homeSupportHeading > span,
        .homeSupportCard > span {
          display: block;
          color: #dbaa58;
          font-size: 9px;
          letter-spacing: 1.9px;
          font-weight: 900;
        }
        .homeSupportHeading h2 {
          margin: 7px 0 5px;
          color: #f5e6bd;
          font-size: 21px;
          letter-spacing: -.4px;
        }
        .homeSupportHeading p {
          margin: 0;
          color: #9098a8;
          font-size: 11px;
          line-height: 1.65;
        }
        .homeSupportSide {
          display: grid;
          grid-template-rows: 1fr 1fr;
          gap: 14px;
        }
        .homeSupportCard {
          position: relative;
          overflow: hidden;
          padding: 22px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .homeSupportCard::after {
          content: "";
          position: absolute;
          width: 120px;
          height: 120px;
          right: -46px;
          top: -46px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(218,170,88,.13), transparent 68%);
          pointer-events: none;
        }
        .homeSupportCard h3 {
          position: relative;
          z-index: 1;
          margin: 8px 0 7px;
          color: #f5e7c2;
          font-size: 17px;
          line-height: 1.45;
          letter-spacing: -.3px;
        }
        .homeSupportCard p {
          position: relative;
          z-index: 1;
          margin: 0 0 15px;
          color: #9ca4b3;
          font-size: 11px;
          line-height: 1.7;
        }
        .homeSupportCard a {
          position: relative;
          z-index: 1;
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 0 15px;
          border: 1px solid rgba(218,170,88,.56);
          border-radius: 999px;
          background: rgba(218,170,88,.08);
          color: #efc979;
          font-size: 10px;
          font-weight: 900;
          text-decoration: none;
          transition: background .2s ease, border-color .2s ease, transform .2s ease;
        }
        .homeSupportCard a:hover {
          transform: translateY(-1px);
          border-color: rgba(229,185,102,.86);
          background: rgba(218,170,88,.14);
        }
        .homeSupportAi {
          background:
            radial-gradient(circle at 92% 12%, rgba(82,114,201,.18), transparent 30%),
            linear-gradient(145deg, rgba(25,30,47,.98), rgba(13,16,25,.98));
        }

        .homePromoSection {
          max-width: 960px;
          margin: 0 auto;
          padding: 46px 24px 28px;
        }
        .homePromoFrame {
          width: 100%;
          aspect-ratio: 16 / 8.4;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(218,170,88,.30);
          background: #090a10;
          box-shadow: 0 14px 34px rgba(0,0,0,.22);
        }
        .homePromoVideo {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #090a10;
        }
        .homePromoGuide {
          margin: 8px 2px 0;
          color: #777f8e;
          font-size: 10px;
          line-height: 1.55;
          text-align: right;
        }
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
        @media (max-width: 1080px) {
          .homeQuickContent {
            grid-template-columns: 1fr;
          }
          .homeQuickButton {
            min-height: 54px;
          }
          .homeServiceGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .homeServiceCard:nth-child(4),
          .homeServiceCard:nth-child(5) {
            min-width: 0;
          }
        }

        @media (max-width: 900px) {
          .homeHeroInner {
            grid-template-columns: 1fr;
            text-align: center;
            padding-top: 46px;
          }
          .homeHeroBenefits {
            margin-left: auto;
            margin-right: auto;
          }
          .homeHeroCharacterWrap {
            min-height: 330px;
          }
          .homeHeroCharacter {
            max-height: 380px;
          }
          .homeServiceGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .homeHero {
            min-height: auto;
          }
          .homeHeroInner {
            min-height: auto;
            padding: 38px 16px 12px;
            gap: 4px;
          }
          .homeHeroEyebrow {
            font-size: 13px;
          }
          .homeHero h1 {
            font-size: 42px;
            letter-spacing: -2.5px;
          }
          .homeHeroLead {
            margin-top: 14px;
            font-size: 15px;
          }
          .homeHeroBenefits {
            margin-top: 24px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px 8px;
          }
          .homeHeroQuote {
            margin-top: 22px;
          }
          .homeHeroCharacterWrap {
            min-height: 280px;
          }
          .homeHeroCharacter {
            width: min(92%, 370px);
            max-height: 330px;
          }
          .homeServiceSection {
            padding: 18px 14px 28px;
          }
          .homeServiceGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 11px;
          }
          .homeServiceCard:last-child {
            grid-column: 1 / -1;
          }
          .homeServiceBody {
            padding: 13px 12px 13px;
          }
          .homeServiceBody h3 {
            font-size: 16px;
            margin-bottom: 6px;
          }
          .homeServiceBody p {
            min-height: 56px;
            font-size: 12px;
            line-height: 1.55;
          }
          .homeServiceButton {
            min-height: 32px;
            margin-top: 10px;
            font-size: 11px;
          }
          .homePromoSection {
            padding: 30px 14px 22px;
          }
          .homePromoFrame {
            aspect-ratio: 16 / 10;
            border-radius: 16px;
          }
          .homePromoGuide {
            margin-top: 8px;
            font-size: 11px;
            text-align: center;
          }
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

        @media (max-width: 900px) {
          .homeHero {
            min-height: auto;
          }
          .homeHeroInner {
            grid-template-columns: 1fr;
            text-align: center;
            padding-top: 38px;
            gap: 0;
          }
          .homeHeroText {
            order: 1;
            padding-bottom: 8px;
          }
          .homeHeroCharacterWrap {
            order: 2;
            min-height: 330px;
          }
          .homeHeroCharacter {
            max-height: 385px;
          }
          .homeHeroBenefits {
            margin-left: auto;
            margin-right: auto;
          }
          .homeQuickPanelWrap {
            margin-top: -12px;
          }
          .homeQuickInfo {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .homeQuickBottom {
            flex-direction: column;
          }
          .homeUtilityGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .homeUtilityItem:nth-child(2) {
            border-right: 0;
          }
          .homeUtilityItem:nth-child(-n+2) {
            border-bottom: 1px solid #e7e1d8;
          }
          .homeServiceGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .homeServiceCard:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 640px) {
          .homeHeroInner {
            padding: 30px 16px 8px;
          }
          .homeHeroEyebrow {
            font-size: 13px;
          }
          .homeHero h1 {
            font-size: 41px;
            letter-spacing: -2.4px;
          }
          .homeHeroLead {
            margin-top: 13px;
            font-size: 15px;
          }
          .homeHeroBenefits {
            margin-top: 22px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 15px 8px;
          }
          .homeHeroQuote {
            margin-top: 20px;
          }
          .homeHeroCharacterWrap {
            min-height: 275px;
          }
          .homeHeroCharacter {
            width: min(92%, 360px);
            max-height: 320px;
          }
          .homeQuickPanelWrap {
            padding: 0 12px 24px;
          }
          .homeQuickTabs {
            overflow-x: auto;
            padding: 9px 10px;
            gap: 5px;
          }
          .homeQuickTabs a {
            flex: 0 0 auto;
            padding: 0 14px;
            font-size: 12px;
          }
          .homeQuickContent {
            padding: 12px;
          }
          .homeQuickInfo {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .homeQuickInfo > div {
            padding: 11px 10px;
          }
          .homeQuickInfo small {
            white-space: normal;
          }
          .homeQuickBottom {
            padding: 0 13px 13px;
            font-size: 10px;
          }
          .homeServiceSection {
            padding: 38px 12px 30px;
          }
          .homeSectionHeading {
            margin-bottom: 20px;
          }
          .homeSectionHeading h2 {
            font-size: 25px;
          }
          .homeSectionHeading p {
            font-size: 12px;
          }
          .homeServiceGrid {
            gap: 10px;
          }
          .homeServiceImageWrap {
            aspect-ratio: 1 / .9;
          }
          .homeServiceBody {
            padding: 12px 10px;
          }
          .homeServiceBody h3 {
            font-size: 16px;
          }
          .homeServiceBody p {
            min-height: 54px;
            font-size: 11px;
          }
          .homeServiceButton {
            min-height: 32px;
            margin-top: 9px;
            font-size: 10px;
          }
          .homeUtilityGrid {
            grid-template-columns: 1fr;
          }
          .homeUtilityItem,
          .homeUtilityItem:nth-child(2) {
            border-right: 0;
            border-bottom: 1px solid #e7e1d8;
          }
          .homeUtilityItem:last-child {
            border-bottom: 0;
          }
          .homeQuoteBanner {
            min-height: 170px;
            padding: 20px 18px 20px 112px;
            align-items: flex-start;
            flex-direction: column;
            justify-content: center;
          }
          .homeQuoteCharacter {
            left: -18px;
            bottom: -52px;
            width: 135px;
            height: 180px;
          }
          .homeQuoteBanner strong {
            font-size: 18px;
          }
          .homeQuoteBanner > a {
            min-height: 36px;
          }
        }


        @media (max-width: 1080px) {
          .homeQuickForm {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .homeQuickSubmit {
            min-height: 48px;
          }
        }

        @media (max-width: 900px) {
          .homeSupportGrid {
            grid-template-columns: 1fr;
          }
          .homeSupportSide {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto;
          }
        }

        @media (max-width: 640px) {
          .homeQuickForm {
            padding: 12px;
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }
          .homeQuickField:nth-child(1),
          .homeQuickField:nth-child(2),
          .homeQuickField:nth-child(3),
          .homeQuickSubmit {
            grid-column: 1 / -1;
          }
          .homeQuickField input,
          .homeQuickField select,
          .homeQuickBirthButton,
          .homeQuickSubmit {
            height: 46px;
          }
          .homeQuickCalendar {
            padding: 11px;
          }
          .homeQuickCalendarHead > div {
            min-width: 0;
            width: 100%;
          }
          .homeSupportSection {
            padding: 30px 12px 38px;
          }
          .homeSupportVideoCard {
            padding: 14px;
          }
          .homeSupportHeading h2 {
            font-size: 19px;
          }
          .homeSupportSide {
            grid-template-columns: 1fr;
          }
          .homeSupportCard {
            padding: 20px;
          }
        }


        @media (max-width: 900px) {
          .homeSupportSection {
            padding: 42px 18px 46px;
          }
          .homeSupportGrid {
            grid-template-columns: 1fr;
          }
          .homeSupportSide {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto;
          }
        }

        @media (max-width: 640px) {
          .homeSupportSection {
            padding: 32px 12px 38px;
          }
          .homeSupportVideoCard {
            padding: 14px;
          }
          .homeSupportHeading h2 {
            font-size: 18px;
          }
          .homeSupportSide {
            grid-template-columns: 1fr;
          }
          .homeSupportCard {
            padding: 18px;
          }
          .homeSupportCard h3 {
            font-size: 16px;
          }
          .homePromoFrame {
            aspect-ratio: 16 / 10;
            border-radius: 14px;
          }
          .homePromoGuide {
            text-align: center;
            font-size: 9px;
          }
        }


        /* STEP 4: mobile layout optimization only */
        @media (max-width: 640px) {
          .homeHero {
            min-height: auto;
            padding-bottom: 20px;
          }
          .homeHeroInner {
            padding: 24px 16px 0;
            gap: 8px;
          }
          .homeHeroCopy {
            padding-top: 0;
            text-align: center;
          }
          .homeHeroCopy h1 {
            margin-top: 7px;
            font-size: clamp(32px, 10vw, 43px);
            line-height: 1.03;
          }
          .homeHeroCopy > p {
            margin-top: 10px;
            font-size: 12px;
          }
          .homeHeroBenefits {
            max-width: 330px;
            margin: 18px auto 0;
            gap: 10px 8px;
          }
          .homeHeroBenefit {
            min-height: 48px;
          }
          .homeHeroQuote {
            margin: 14px auto 0;
          }
          .homeHeroCharacterWrap {
            min-height: 210px;
            margin-top: -4px;
          }
          .homeHeroCharacter {
            max-height: 235px;
            object-position: center bottom;
          }

          .homeQuickForm {
            width: calc(100% - 20px);
            margin: -2px auto 0;
            border-radius: 16px;
          }
          .homeQuickTabs {
            min-height: 38px;
            padding: 0 9px;
            gap: 9px;
          }
          .homeQuickTabs button,
          .homeQuickTabs a {
            font-size: 10px;
          }
          .homeQuickFields {
            padding: 11px 10px 8px;
            gap: 8px;
          }
          .homeQuickField label {
            margin-bottom: 5px;
            font-size: 9px;
          }
          .homeQuickField input,
          .homeQuickField select,
          .homeQuickDateButton {
            min-height: 40px;
            font-size: 11px;
          }
          .homeQuickSubmit {
            min-height: 42px;
            margin-top: 2px;
          }
          .homeQuickNotice {
            padding: 0 10px 10px;
            font-size: 8px;
          }

          .homeServiceSection {
            padding: 40px 12px 38px;
          }
          .homeSectionHeading {
            margin-bottom: 22px;
          }
          .homeSectionHeading h2 {
            font-size: 24px;
          }
          .homeSectionHeading p {
            padding: 0 8px;
            font-size: 11px;
          }
          .homeServiceGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .homeServiceCard {
            border-radius: 14px;
          }
          .homeServiceCard:last-child {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: 42% 58%;
          }
          .homeServiceCard:last-child .homeServiceImageWrap {
            aspect-ratio: auto;
            min-height: 150px;
          }
          .homeServiceCard:last-child .homeServiceBody {
            justify-content: center;
          }
          .homeServiceImageWrap {
            aspect-ratio: 1.14 / 1;
          }
          .homeServiceBody {
            padding: 11px 10px 10px;
          }
          .homeServiceBody h3 {
            font-size: 15px;
          }
          .homeServiceBody p {
            min-height: 52px;
            margin-bottom: 10px;
            font-size: 10px;
            line-height: 1.55;
          }
          .homeServiceButton {
            min-height: 34px;
            font-size: 10px;
          }

          .homeUtilityGrid {
            grid-template-columns: repeat(2, minmax(0,1fr));
            margin-top: 14px;
          }
          .homeUtilityItem {
            min-height: 64px;
            padding: 0 10px;
            border-bottom: 1px solid #e7e1d8;
          }
          .homeUtilityItem:nth-child(2) {
            border-right: 0;
          }
          .homeUtilityItem:nth-child(3),
          .homeUtilityItem:nth-child(4) {
            border-bottom: 0;
          }
          .homeUtilityItem b {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }
          .homeUtilityItem strong {
            font-size: 11px;
          }
          .homeUtilityItem span {
            font-size: 9px;
          }

          .homeQuoteBanner {
            min-height: 112px;
            padding: 15px 12px 48px 96px;
          }
          .homeQuoteCharacter {
            left: 4px;
            bottom: -42px;
            width: 92px;
            height: 142px;
          }
          .homeQuoteBanner strong {
            font-size: 15px;
          }
          .homeQuoteBanner p {
            font-size: 9px;
          }
          .homeQuoteBanner > a {
            right: 12px;
            top: auto;
            bottom: 10px;
            transform: none;
            min-width: 104px;
            min-height: 32px;
            font-size: 9px;
          }

          .homeSupportSection {
            padding: 30px 10px 36px;
          }
          .homeSupportGrid {
            gap: 12px;
          }
          .homeSupportVideoCard {
            padding: 13px;
            border-radius: 16px;
          }
          .homeSupportHeading {
            margin-bottom: 10px;
          }
          .homeSupportHeading h2 {
            font-size: 17px;
          }
          .homeSupportHeading p {
            font-size: 10px;
          }
          .homePromoFrame {
            aspect-ratio: 16 / 10;
            border-radius: 13px;
          }
          .homeSupportSide {
            gap: 10px;
          }
          .homeSupportCard {
            min-height: 150px;
            padding: 17px;
            border-radius: 15px;
          }
          .homeSupportCard h3 {
            font-size: 15px;
          }
          .homeSupportCard p {
            margin-bottom: 12px;
            font-size: 10px;
          }
          .homeSupportCard a {
            min-height: 34px;
            padding: 0 13px;
            font-size: 9px;
          }
        }


        /* STEP 4B: final mobile structure corrections */
        @media (max-width: 640px) {
          /* Give the character and quick form a cleaner visual handoff. */
          .homeHeroCharacterWrap {
            margin-bottom: 8px;
          }
          .homeQuickForm {
            margin-top: 4px;
          }

          /* Keep the first four service cards as a balanced 2 x 2 grid. */
          .homeServiceGrid {
            grid-auto-flow: row;
            align-items: stretch;
          }
          .homeServiceCard:nth-child(-n+4) {
            height: 100%;
          }
          .homeServiceCard:nth-child(-n+4) .homeServiceBody {
            min-height: 138px;
          }

          /* The fifth service (AI 상담) spans the full mobile width. */
          .homeServiceGrid > .homeServiceAiCard {
            grid-column: 1 / -1 !important;
            width: 100% !important;
            max-width: none !important;
            display: grid !important;
            grid-template-columns: minmax(0, 42%) minmax(0, 58%) !important;
            align-items: stretch;
          }
          .homeServiceGrid > .homeServiceAiCard .homeServiceImageWrap {
            width: 100%;
            height: 100%;
            min-height: 154px;
            aspect-ratio: auto !important;
          }
          .homeServiceGrid > .homeServiceAiCard .homeServiceImage {
            height: 100%;
            object-fit: cover;
          }
          .homeServiceGrid > .homeServiceAiCard .homeServiceBody {
            min-width: 0;
            min-height: 154px;
            padding: 14px 13px;
            justify-content: center;
          }
          .homeServiceGrid > .homeServiceAiCard .homeServiceBody p {
            min-height: 0;
            margin-bottom: 12px;
          }
          .homeServiceGrid > .homeServiceAiCard .homeServiceButton {
            width: 100%;
          }

          /* Slightly tighten the transition into the guide/message area. */
          .homeUtilityGrid {
            margin-top: 12px;
          }
          .homeQuoteBanner {
            margin-top: 12px;
          }
        }


        @media (max-width: 640px) {
          .homeServiceGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .homeServiceGrid .homeServiceAiCard {
            grid-column: 1 / -1 !important;
            width: 100% !important;
            max-width: 100% !important;
            display: grid !important;
            grid-template-columns: minmax(0, 42%) minmax(0, 58%) !important;
            overflow: hidden !important;
          }

          .homeServiceGrid .homeServiceAiCard .homeServiceImageWrap {
            width: 100% !important;
            height: 100% !important;
            min-height: 154px !important;
            aspect-ratio: auto !important;
          }

          .homeServiceGrid .homeServiceAiCard .homeServiceImage {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }

          .homeServiceGrid .homeServiceAiCard .homeServiceBody {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 154px !important;
            padding: 14px 13px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }

          .homeServiceGrid .homeServiceAiCard .homeServiceBody p {
            min-height: 0 !important;
            margin-bottom: 12px !important;
          }

          .homeServiceGrid .homeServiceAiCard .homeServiceButton {
            width: 100% !important;
          }
        }

        @media (max-width: 640px) {
          .homeServiceDesktopOnly {
            display: none !important;
          }

          .homeServiceMobileOnly {
            display: block !important;
            width: 100% !important;
          }

          .homeServiceMobileGrid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 11px !important;
            width: 100% !important;
          }

          .homeServiceMobileGrid > .homeServiceMobilePairCard,
          .homeServiceMobileGrid > .homeServiceMobilePairCard:last-child {
            grid-column: auto !important;
            width: 100% !important;
            max-width: none !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .homeServiceMobileAiWide,
          .homeServiceMobileAiWide:last-child {
            width: 100% !important;
            max-width: none !important;
            margin-top: 11px !important;
            display: grid !important;
            grid-template-columns: minmax(0, 42%) minmax(0, 58%) !important;
            overflow: hidden !important;
          }

          .homeServiceMobileAiWide .homeServiceImageWrap,
          .homeServiceMobileAiWide:last-child .homeServiceImageWrap {
            width: 100% !important;
            height: 100% !important;
            min-height: 154px !important;
            aspect-ratio: auto !important;
          }

          .homeServiceMobileAiWide .homeServiceImage {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }

          .homeServiceMobileAiWide .homeServiceBody,
          .homeServiceMobileAiWide:last-child .homeServiceBody {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 154px !important;
            padding: 14px 13px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }

          .homeServiceMobileAiWide .homeServiceBody p {
            min-height: 0 !important;
            margin-bottom: 12px !important;
          }

          .homeServiceMobileAiWide .homeServiceButton {
            width: 100% !important;
          }
        }


        @media (max-width: 640px) {
          .homeServiceMobileAiWide {
            grid-template-columns: minmax(0, 46%) minmax(0, 54%) !important;
          }

          .homeServiceMobileAiWide .homeServiceImageWrap,
          .homeServiceMobileAiWide:last-child .homeServiceImageWrap {
            min-height: 138px !important;
            max-height: 150px !important;
          }

          .homeServiceMobileAiWide .homeServiceBody,
          .homeServiceMobileAiWide:last-child .homeServiceBody {
            min-height: 138px !important;
            padding: 12px !important;
          }

          .homeServiceMobileAiWide .homeServiceBody h3 {
            margin-bottom: 5px !important;
          }

          .homeServiceMobileAiWide .homeServiceBody p {
            margin-bottom: 9px !important;
          }
        }


        @media (max-width: 640px) {
          /* 2차 모바일 마감: 히어로의 불필요한 세로 여백을 줄입니다. */
          .homeHero {
            min-height: auto !important;
            padding-bottom: 18px !important;
          }

          .homeHeroInner {
            padding-top: 22px !important;
            padding-bottom: 0 !important;
            row-gap: 8px !important;
          }

          .homeHeroCopy {
            margin-bottom: 0 !important;
          }

          .homeHeroCharacterWrap {
            margin-top: -8px !important;
            margin-bottom: -10px !important;
          }

          /* 무료 사주 입력폼의 모바일 간격을 조금 더 조밀하게 */
          .homeQuickForm {
            margin-top: 0 !important;
          }

          .homeQuickFormBody {
            gap: 8px !important;
          }

          /* AI 상담 전체폭은 유지하되 시각적 높이는 한 단계 더 줄임 */
          .homeServiceMobileAiWide {
            grid-template-columns: minmax(0, 44%) minmax(0, 56%) !important;
          }

          .homeServiceMobileAiWide .homeServiceImageWrap,
          .homeServiceMobileAiWide:last-child .homeServiceImageWrap {
            min-height: 126px !important;
            max-height: 136px !important;
          }

          .homeServiceMobileAiWide .homeServiceBody,
          .homeServiceMobileAiWide:last-child .homeServiceBody {
            min-height: 126px !important;
            padding: 10px 11px !important;
          }

          .homeServiceMobileAiWide .homeServiceButton {
            min-height: 34px !important;
          }
        }

      `}</style>

    </main>
  );
}



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
