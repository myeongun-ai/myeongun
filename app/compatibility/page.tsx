"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import UsageBenefits from "../UsageBenefits";

type PersonForm = {
  name: string;
  birth: string;
  time: string;
  gender: "남성" | "여성";
  calendar: "양력" | "음력";
};

type PersonSummary = {
  name?: string;
  dayMaster?: {
    stem?: string;
    element?: string;
    yinYang?: string;
  };
  fiveElements?: Record<string, number>;
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

type DeepCompatibility = {
  headline: string;
  overview: string;
  sections: { title: string; analysis: string; advice: string }[];
  actionPlan: string[];
  disclaimer: string;
};

type PremiumUsage = { used: number; remaining: number; busy: boolean; expiresAt?: number };

type CompatibilityPeople = {
  me?: PersonSummary;
  partner?: PersonSummary;
};

const emptyMe: PersonForm = {
  name: "",
  birth: "",
  time: "",
  gender: "남성",
  calendar: "양력",
};

const emptyPartner: PersonForm = {
  name: "",
  birth: "",
  time: "",
  gender: "여성",
  calendar: "양력",
};

// 기존 유료 이용권은 출생시간 문자열 자체로 인증하므로 값을 변경하지 않습니다.
const BIRTH_TIME_OPTIONS = [
  "子(자) 23:30 ~ 01:29",
  "丑(축) 01:30 ~ 03:29",
  "寅(인) 03:30 ~ 05:29",
  "卯(묘) 05:30 ~ 07:29",
  "辰(진) 07:30 ~ 09:29",
  "巳(사) 09:30 ~ 11:29",
  "午(오) 11:30 ~ 13:29",
  "未(미) 13:30 ~ 15:29",
  "申(신) 15:30 ~ 17:29",
  "酉(유) 17:30 ~ 19:29",
  "戌(술) 19:30 ~ 21:29",
  "亥(해) 21:30 ~ 23:29",
];

function isPersonForm(value: unknown): value is PersonForm {
  if (!value || typeof value !== "object") return false;
  const person = value as Record<string, unknown>;
  return typeof person.name === "string" && typeof person.birth === "string" &&
    typeof person.time === "string" &&
    (person.gender === "남성" || person.gender === "여성") &&
    (person.calendar === "양력" || person.calendar === "음력");
}

function readSavedMe(): PersonForm | null {
  try {
    // 결제/재열람 정보를 최우선으로 사용합니다.
    for (const key of ["myeongun_paid_saju", "myeongun_active_saju", "myeongun_saju"]) {
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (isPersonForm(parsed) && parsed.name.trim() && parsed.birth) return parsed;
    }
  } catch {
    // 저장된 값이 손상되었더라도 직접 입력할 수 있습니다.
  }
  return null;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseBirth(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

function renderCompatibilityResult(text: string) {
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

  function getSectionNumber(title: string) {
    const match = title.match(/^(\d+)\./);
    return match?.[1] || "";
  }

  function getSectionTitle(title: string) {
    return title.replace(/^\d+\.\s*/, "");
  }

  function renderContent(content: string[], sectionIndex: number) {
    const nodes: React.ReactNode[] = [];
    let bullets: string[] = [];

    function flushBullets() {
      if (!bullets.length) return;

      nodes.push(
        <ul
          className="compatResultList"
          key={`list-${sectionIndex}-${nodes.length}`}
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
            className="compatHeadingSmall"
            key={`h4-${sectionIndex}-${lineIndex}`}
          >
            {renderInline(line.slice(4))}
          </h4>
        );
        return;
      }

      nodes.push(
        <p
          className="compatParagraph"
          key={`p-${sectionIndex}-${lineIndex}`}
        >
          {renderInline(line)}
        </p>
      );
    });

    flushBullets();

    return nodes;
  }

  return (
    <div className="premiumCompatibilityResult">
      {intro.length > 0 && (
        <section className="compatIntroCard">
          <span className="compatIntroMark">MYEONGUN · COMPATIBILITY</span>

          {intro.map((line, index) => (
            <p className="compatParagraph" key={`intro-${index}`}>
              {renderInline(line)}
            </p>
          ))}
        </section>
      )}

      <div className="compatSectionGrid">
        {sections.map((section, index) => {
          const number = getSectionNumber(section.title);
          const title = getSectionTitle(section.title);

          return (
            <section
              className="compatAnalysisCard"
              key={`${section.title}-${index}`}
            >
              <header className="compatAnalysisHeader">
                {number ? (
                  <div className="compatSectionNumber">
                    {number.padStart(2, "0")}
                  </div>
                ) : (
                  <div className="compatSummaryMark">結</div>
                )}

                <div className="compatSectionTitleWrap">
                  <span className="compatSectionLabel">
                    LOVE · PARTNERSHIP
                  </span>
                  <h3>{renderInline(title)}</h3>
                </div>
              </header>

              <div className="compatAnalysisContent">
                {renderContent(section.content, index)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function CompatibilityPage() {
  const [me, setMe] = useState<PersonForm>(emptyMe);
  const [partner, setPartner] = useState<PersonForm>(emptyPartner);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [people, setPeople] = useState<CompatibilityPeople | null>(null);
  const [mode, setMode] = useState<"free" | "premium">("free");
  const [deepResult, setDeepResult] = useState<DeepCompatibility | null>(null);
  const [usage, setUsage] = useState<PremiumUsage | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);

  useEffect(() => {
    const saved = readSavedMe();
    if (saved) setMe(saved);
  }, []);

  const today = new Date();
  const currentYear = today.getFullYear();

  const [mePickerOpen, setMePickerOpen] = useState(false);
  const [mePickerYear, setMePickerYear] = useState(currentYear);
  const [mePickerMonth, setMePickerMonth] = useState(today.getMonth() + 1);

  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [partnerPickerYear, setPartnerPickerYear] = useState(currentYear);
  const [partnerPickerMonth, setPartnerPickerMonth] = useState(
    today.getMonth() + 1
  );

  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1920 + 1 },
        (_, index) => currentYear - index
      ),
    [currentYear]
  );

  const canAnalyze = useMemo(() => {
    return Boolean(
      me.name.trim() &&
        me.birth &&
        me.time &&
        partner.name.trim() &&
        partner.birth &&
        partner.time
    );
  }, [me, partner]);

  function updateMe<K extends keyof PersonForm>(
    key: K,
    value: PersonForm[K]
  ) {
    setMe((prev) => ({
      ...prev,
      [key]: value,
    }));
    setResult("");
    setPeople(null);
    setDeepResult(null);
    setUsage(null);
    setError("");
  }

  function updatePartner<K extends keyof PersonForm>(
    key: K,
    value: PersonForm[K]
  ) {
    setPartner((prev) => ({
      ...prev,
      [key]: value,
    }));
    setResult("");
    setPeople(null);
    setDeepResult(null);
    setError("");
  }

  function openMePicker() {
    const parsed = parseBirth(me.birth);

    if (parsed) {
      setMePickerYear(parsed.year);
      setMePickerMonth(parsed.month);
    } else {
      setMePickerYear(currentYear);
      setMePickerMonth(today.getMonth() + 1);
    }

    setPartnerPickerOpen(false);
    setMePickerOpen(true);
  }

  function openPartnerPicker() {
    const parsed = parseBirth(partner.birth);

    if (parsed) {
      setPartnerPickerYear(parsed.year);
      setPartnerPickerMonth(parsed.month);
    } else {
      setPartnerPickerYear(currentYear);
      setPartnerPickerMonth(today.getMonth() + 1);
    }

    setMePickerOpen(false);
    setPartnerPickerOpen(true);
  }

  function changeMePickerMonth(amount: number) {
    let year = mePickerYear;
    let month = mePickerMonth + amount;

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

    setMePickerYear(year);
    setMePickerMonth(month);
  }

  function changePartnerPickerMonth(amount: number) {
    let year = partnerPickerYear;
    let month = partnerPickerMonth + amount;

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

    setPartnerPickerYear(year);
    setPartnerPickerMonth(month);
  }

  function selectMeBirth(day: number) {
    const value =
      `${mePickerYear}-${pad2(mePickerMonth)}-${pad2(day)}`;

    updateMe("birth", value);
    setMePickerOpen(false);
  }

  function selectPartnerBirth(day: number) {
    const value =
      `${partnerPickerYear}-${pad2(partnerPickerMonth)}-${pad2(day)}`;

    updatePartner("birth", value);
    setPartnerPickerOpen(false);
  }

  async function checkPremiumUsage() {
    if (!me.name.trim() || !me.birth || !me.time) {
      setError("먼저 결제한 본인의 이름·생년월일·출생시간을 입력해 주세요.");
      return;
    }
    setCheckingUsage(true);
    setError("");
    try {
      const response = await fetch("/api/fortune/compatibility/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", me: { ...me, name: me.name.trim() } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "이용권 확인에 실패했습니다.");
      setUsage({ used: data.used, remaining: data.remaining, busy: data.busy, expiresAt: data.expiresAt });
    } catch (err) {
      setUsage(null);
      setError(err instanceof Error ? err.message : "이용권 확인에 실패했습니다.");
    } finally {
      setCheckingUsage(false);
    }
  }

  async function copyDeepResult() {
    if (!deepResult) return;
    const text = [deepResult.headline, deepResult.overview,
      ...deepResult.sections.flatMap((section, index) => [
        `${index + 1}. ${section.title}`, section.analysis, section.advice,
      ]), "실천 조언", ...deepResult.actionPlan, deepResult.disclaimer].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      window.alert("심화 궁합 결과를 복사했습니다. 메모장 등에 붙여넣어 저장해 주세요.");
    } catch {
      window.alert("자동 복사에 실패했습니다. 화면의 내용을 직접 복사해 주세요.");
    }
  }

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAnalyze || loading || (mode === "premium" && (!usage || usage.remaining <= 0 || usage.busy))) return;

    setLoading(true);
    setError("");
    setResult("");
    setPeople(null);
    setDeepResult(null);

    try {
      const isPremium = mode === "premium";
      const response = await fetch(isPremium ? "/api/fortune/compatibility/premium" : "/api/fortune/compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isPremium ? { action: "analyze" } : {}),
          me: {
            ...me,
            name: me.name.trim(),
          },
          partner: {
            ...partner,
            name: partner.name.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (isPremium) setUsage(null);
        if (isPremium && typeof data?.remaining === "number") {
          setUsage({ used: data.used, remaining: data.remaining, busy: Boolean(data.busy) });
        }
        throw new Error(
          data?.error || "궁합 분석 중 오류가 발생했습니다."
        );
      }

      if (isPremium) {
        const deep = data?.result as DeepCompatibility | undefined;
        if (!deep || !Array.isArray(deep.sections)) {
          throw new Error("심화 궁합 결과를 확인하지 못했습니다.");
        }
        setDeepResult(deep);
        setUsage({ used: data.used, remaining: data.remaining, busy: Boolean(data.busy), expiresAt: data.expiresAt });
        window.setTimeout(() => document.getElementById("compatibility-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        return;
      }

      const resultText = String(data?.result || "").trim();

      if (!resultText) {
        throw new Error("궁합 분석 결과가 비어 있습니다.");
      }

      try {
        sessionStorage.setItem(
          "myeongun_recent_compatibility",
          JSON.stringify({
            date: new Date().toISOString(),
            meName: me.name.trim(),
            partnerName: partner.name.trim(),
          })
        );
      } catch {}


      setResult(resultText);
      setPeople(data?.people || null);

      window.setTimeout(() => {
        document
          .getElementById("compatibility-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "궁합 분석 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setMe(emptyMe);
    setPartner(emptyPartner);
    setResult("");
    setPeople(null);
    setDeepResult(null);
    setUsage(null);
    setMode("free");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="compatPage">
      <section className="compatHero">
        <span className="eyebrow">LOVE · PARTNERSHIP</span>
        <h1>두 사람의 궁합</h1>
        <p>
          두 사람의 출생정보를 각각 입력하면 실제 만세력 계산을
          바탕으로 성향·애정·대화·생활·재물·결혼 흐름을 함께
          분석합니다.
        </p>
      </section>

      <form className="compatForm" onSubmit={analyze}>
        <div className="personGrid">
          <section className="personCard">
            <div className="personCardHeader">
              <span className="personNumber">01</span>
              <div>
                <span className="personLabel">MY INFORMATION</span>
                <h2>나의 정보</h2>
              </div>
            </div>

            <div className="fieldGrid">
              <label className="field full">
                <span>이름</span>
                <input
                  type="text"
                  value={me.name}
                  onChange={(e) => updateMe("name", e.target.value)}
                  placeholder="이름을 입력하세요"
                  autoComplete="off"
                />
              </label>

              <div className="field full">
                <span>생년월일</span>

                <button
                  type="button"
                  className="birthPickerButton"
                  onClick={openMePicker}
                >
                  {me.birth || "생년월일을 선택하세요"}
                  <span>📅</span>
                </button>

                {mePickerOpen && (
                  <div className="birthPicker">
                    <div className="birthPickerHeader">
                      <button
                        type="button"
                        onClick={() => changeMePickerMonth(-1)}
                      >
                        ‹
                      </button>

                      <div className="birthPickerSelects">
                        <select
                          value={mePickerYear}
                          onChange={(e) =>
                            setMePickerYear(Number(e.target.value))
                          }
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}년
                            </option>
                          ))}
                        </select>

                        <select
                          value={mePickerMonth}
                          onChange={(e) =>
                            setMePickerMonth(Number(e.target.value))
                          }
                        >
                          {Array.from({ length: 12 }, (_, index) => index + 1).map(
                            (month) => (
                              <option key={month} value={month}>
                                {month}월
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => changeMePickerMonth(1)}
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
                        length: new Date(
                          mePickerYear,
                          mePickerMonth - 1,
                          1
                        ).getDay(),
                      }).map((_, index) => (
                        <span key={`empty-${index}`} />
                      ))}

                      {Array.from({
                        length: daysInMonth(
                          mePickerYear,
                          mePickerMonth
                        ),
                      }).map((_, index) => {
                        const day = index + 1;
                        const selected =
                          me.birth ===
                          `${mePickerYear}-${pad2(
                            mePickerMonth
                          )}-${pad2(day)}`;

                        return (
                          <button
                            type="button"
                            key={day}
                            className={selected ? "selected" : ""}
                            onClick={() => selectMeBirth(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>              

              <div className="field">
                <span>출생시간</span>
                <select
                  value={me.time}
                  onChange={(e) => updateMe("time", e.target.value)}
                  aria-label="나의 출생시간"
                >
                  <option value="">출생시간을 선택하세요</option>
                  {me.time && me.time !== "모름" && !BIRTH_TIME_OPTIONS.includes(me.time) && (
                    <option value={me.time}>{me.time} (기존 저장값)</option>
                  )}
                  {BIRTH_TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                  <option value="모름">모름</option>
                </select>
              </div>

              <label className="field">
                <span>성별</span>
                <select
                  value={me.gender}
                  onChange={(e) =>
                    updateMe(
                      "gender",
                      e.target.value as PersonForm["gender"]
                    )
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
                    className={me.calendar === "양력" ? "active" : ""}
                    onClick={() => updateMe("calendar", "양력")}
                  >
                    양력
                  </button>
                  <button
                    type="button"
                    className={me.calendar === "음력" ? "active" : ""}
                    onClick={() => updateMe("calendar", "음력")}
                  >
                    음력
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="relationshipSymbol" aria-hidden="true">
            <span>＋</span>
          </div>

          <section className="personCard">
            <div className="personCardHeader">
              <span className="personNumber">02</span>
              <div>
                <span className="personLabel">PARTNER INFORMATION</span>
                <h2>상대방 정보</h2>
              </div>
            </div>

            <div className="fieldGrid">
              <label className="field full">
                <span>이름</span>
                <input
                  type="text"
                  value={partner.name}
                  onChange={(e) =>
                    updatePartner("name", e.target.value)
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
                  onClick={openPartnerPicker}
                >
                  {partner.birth || "생년월일을 선택하세요"}
                  <span>📅</span>
                </button>

                {partnerPickerOpen && (
                  <div className="birthPicker">
                    <div className="birthPickerHeader">
                      <button
                        type="button"
                        onClick={() => changePartnerPickerMonth(-1)}
                      >
                        ‹
                      </button>

                      <div className="birthPickerSelects">
                        <select
                          value={partnerPickerYear}
                          onChange={(e) =>
                            setPartnerPickerYear(Number(e.target.value))
                          }
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}년
                            </option>
                          ))}
                        </select>

                        <select
                          value={partnerPickerMonth}
                          onChange={(e) =>
                            setPartnerPickerMonth(Number(e.target.value))
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
                        onClick={() => changePartnerPickerMonth(1)}
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
                        length: new Date(
                          partnerPickerYear,
                          partnerPickerMonth - 1,
                          1
                        ).getDay(),
                      }).map((_, index) => (
                        <span key={`partner-empty-${index}`} />
                      ))}

                      {Array.from({
                        length: daysInMonth(
                          partnerPickerYear,
                          partnerPickerMonth
                        ),
                      }).map((_, index) => {
                        const day = index + 1;
                        const selected =
                          partner.birth ===
                          `${partnerPickerYear}-${pad2(
                            partnerPickerMonth
                          )}-${pad2(day)}`;

                        return (
                          <button
                            type="button"
                            key={day}
                            className={selected ? "selected" : ""}
                            onClick={() => selectPartnerBirth(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="field">
                <span>출생시간</span>
                <select
                  value={partner.time}
                  onChange={(e) => updatePartner("time", e.target.value)}
                  aria-label="상대방 출생시간"
                >
                  <option value="">출생시간을 선택하세요</option>
                  {partner.time && partner.time !== "모름" && !BIRTH_TIME_OPTIONS.includes(partner.time) && (
                    <option value={partner.time}>{partner.time} (기존 저장값)</option>
                  )}
                  {BIRTH_TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                  <option value="모름">모름</option>
                </select>
              </div>

              <label className="field">
                <span>성별</span>
                <select
                  value={partner.gender}
                  onChange={(e) =>
                    updatePartner(
                      "gender",
                      e.target.value as PersonForm["gender"]
                    )
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
                      partner.calendar === "양력" ? "active" : ""
                    }
                    onClick={() =>
                      updatePartner("calendar", "양력")
                    }
                  >
                    양력
                  </button>
                  <button
                    type="button"
                    className={
                      partner.calendar === "음력" ? "active" : ""
                    }
                    onClick={() =>
                      updatePartner("calendar", "음력")
                    }
                  >
                    음력
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="analysisGuide">
          <span>MYEONGUN COMPATIBILITY</span>
          <strong>두 사람의 사주를 함께 비교합니다.</strong>
          <p>
            단순한 생년월일 숫자 점수가 아니라 두 사람의 일간,
            오행, 신강·신약, 십성, 지장간과 참고용 용신·희신을
            바탕으로 관계의 특징을 분석합니다.
          </p>
        </section>

        <section className="premiumModeChooser" aria-label="궁합 분석 종류">
          <button type="button" className={mode === "free" ? "modeOption selected" : "modeOption"}
            onClick={() => { setMode("free"); setUsage(null); setError(""); setDeepResult(null); setResult(""); }}>
            무료 궁합 <small>누구나 이용 가능</small>
          </button>
          <button type="button" className={mode === "premium" ? "modeOption selected" : "modeOption"}
            onClick={() => { setMode("premium"); setUsage(null); setError(""); setDeepResult(null); setResult(""); }}>
            심화 궁합 <small>9,900원 결제 고객 · 7일간 3회</small>
          </button>
        </section>
        {mode === "premium" && (
          <div className="premiumUsagePanel">
            <strong>심화 궁합 이용권</strong>
            <p>결제한 본인의 정보를 정확히 입력해 주세요. 상대방 정보는 매회 변경할 수 있습니다.</p>
            <button type="button" className="checkUsageButton" onClick={checkPremiumUsage} disabled={checkingUsage || loading}>
              {checkingUsage ? "이용권 확인 중..." : "남은 심화 궁합 횟수 확인"}
            </button>
            {!usage && <p>심화 궁합 분석을 시작하려면 먼저 위 버튼에서 유효한 결제 이용권을 확인해 주세요.</p>}
            {usage && <p className="usageCount">남은 횟수 <strong>{usage.remaining} / 3회</strong>{usage.busy ? " · 다른 분석 진행 중" : ""}</p>}
            <p>분석 성공 시 1회 차감됩니다. 결과는 별도로 저장되지 않으니 화면에서 복사해 보관해 주세요.</p>
            <p>이용권이 없거나 다른 기기에서 재접속한 경우 아래 이용코드 버튼으로 이용권을 복원한 뒤 다시 이용해 주세요. 처음 이용하는 고객은 <Link href="/payment">상세 사주 결제 안내</Link>를 확인해 주세요.</p>
            <Link href="/payment/reopen?returnTo=%2Fcompatibility" className="reopenLink">
              이용코드로 심화 궁합 다시 보기 →
            </Link>
          </div>
        )}
        {error && <div className="errorBox">{error}</div>}

        <button
          type="submit"
          className="analyzeButton"
          disabled={!canAnalyze || loading || (mode === "premium" && (!usage || usage.remaining <= 0 || usage.busy))}
        >
          {loading ? "두 사람의 궁합을 분석하고 있습니다..." : mode === "premium" ? !usage ? "이용권 확인 후 심화 궁합 분석 가능" : usage.busy ? "다른 심화 궁합 분석 진행 중" : usage.remaining <= 0 ? "심화 궁합 이용 횟수 없음" : "심화 궁합 분석 시작 (1회 사용)" : "무료 궁합 분석 시작"}
        </button>

        <p className="privacyText">
          입력한 정보는 궁합 분석을 위한 요청에 사용됩니다.
        </p>
      </form>

      {(result || deepResult) && (
        <section
          className="resultArea"
          id="compatibility-result"
        >
          <div className="resultTitle">
            <span>COMPATIBILITY REPORT</span>
            <h2>
              {me.name}님과 {partner.name}님의 궁합 분석
            </h2>
            <p>
              두 사람의 만세력 구성과 관계의 상호작용을 함께
              살펴본 결과입니다.
            </p>
          </div>

          {people && (
            <div className="summaryGrid">
              <article className="summaryCard">
                <span>MY SAJU</span>
                <strong>{people.me?.name || me.name}</strong>
                <dl>
                  <div>
                    <dt>일간</dt>
                    <dd>
                      {people.me?.dayMaster?.stem || "-"} ·{" "}
                      {people.me?.dayMaster?.element || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>신강·신약</dt>
                    <dd>{people.me?.strength?.level || "-"}</dd>
                  </div>
                  <div>
                    <dt>참고 용신</dt>
                    <dd>
                      {people.me?.yongshin?.yongshin || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>참고 희신</dt>
                    <dd>
                      {people.me?.yongshin?.heesin || "-"}
                    </dd>
                  </div>
                </dl>
              </article>

              <div className="summaryHeart" aria-hidden="true">
                ♥
              </div>

              <article className="summaryCard">
                <span>PARTNER SAJU</span>
                <strong>
                  {people.partner?.name || partner.name}
                </strong>
                <dl>
                  <div>
                    <dt>일간</dt>
                    <dd>
                      {people.partner?.dayMaster?.stem || "-"} ·{" "}
                      {people.partner?.dayMaster?.element || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>신강·신약</dt>
                    <dd>
                      {people.partner?.strength?.level || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>참고 용신</dt>
                    <dd>
                      {people.partner?.yongshin?.yongshin || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>참고 희신</dt>
                    <dd>
                      {people.partner?.yongshin?.heesin || "-"}
                    </dd>
                  </div>
                </dl>
              </article>
            </div>
          )}

          <div className="resultBody">
            {deepResult ? (
              <div className="deepResult">
                <h3>{deepResult.headline}</h3>
                <p>{deepResult.overview}</p>
                {deepResult.sections.map((section, index) => (
                  <section className="deepSection" key={`${section.title}-${index}`}>
                    <h3>{index + 1}. {section.title}</h3>
                    <p>{section.analysis}</p>
                    <h4>실천 조언</h4>
                    <p>{section.advice}</p>
                  </section>
                ))}
                <section className="deepSection">
                  <h3>실천 계획</h3>
                  <ul>{deepResult.actionPlan.map((item, index) => <li key={index}>{item}</li>)}</ul>
                </section>
                <p className="deepDisclaimer">{deepResult.disclaimer}</p>
                <button type="button" className="copyResultButton" onClick={copyDeepResult}>심화 궁합 전체 결과 복사하기</button>
                <p className="deepDisclaimer">결과는 서버에 별도 저장되지 않습니다. 페이지를 닫기 전에 복사하여 보관해 주세요.</p>
                {usage && <p className="usageCount">남은 심화 궁합 분석: {usage.remaining} / 3회</p>}
              </div>
            ) : renderCompatibilityResult(result)}
          </div>

          <UsageBenefits compact />

          {!deepResult && <div className="premiumBox">
             <div className="premiumEyebrow">PREMIUM SAJU REPORT</div>

             <h3>두 사람의 관계를 더 깊이 알고 싶으신가요?</h3>

             <p>
                 결혼·장기 관계, 재물·생활 궁합과 앞으로의 관계 방향을
                 결제 고객에게 제공되는 심화 궁합 3회 혜택으로 확인할 수 있습니다.
             </p>

             <Link href="/payment" className="premiumButton">
                <span className="premiumButtonTitle">
                   상세 사주 전체보기
                </span>
                <strong className="premiumButtonPrice">
                   9,900원 결제하기 →
                </strong>
             </Link>

             <div className="premiumPaymentGuide">
                결제 후 7일간 상세 사주 재열람, AI 상담 최대 20회, 심화 궁합 3회를 이용할 수 있습니다.
             </div>
          </div>}

          <div className="noticeBox">
            본 궁합 분석은 전통 명리 관점을 참고한 AI 분석입니다.
            관계의 실제 모습과 미래는 두 사람의 대화, 신뢰,
            생활환경과 선택에 따라 달라질 수 있습니다.
          </div>

          <button
            type="button"
            className="resetButton"
            onClick={resetAll}
          >
            다른 두 사람 궁합 분석하기
          </button>
        </section>
      )}
      <style jsx>{`
        .compatPage {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
          padding: 58px 0 82px;
          color: #17243a;
        }

        .compatHero {
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

        .compatHero h1 {
          margin: 0;
          color: #17243a;
          font-size: 38px;
          line-height: 1.25;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .compatHero p {
          max-width: 680px;
          margin: 14px auto 0;
          color: #786f64;
          font-size: 16px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .compatForm {
          padding: 34px;
          border: 1px solid #dfd4c2;
          border-radius: 26px;
          background: rgba(255, 253, 249, 0.97);
          box-shadow: 0 24px 60px rgba(31, 39, 53, 0.09);
        }

        .personGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr);
          align-items: stretch;
          gap: 18px;
        }

        .personCard {
          padding: 26px;
          border: 1px solid #e4d8c6;
          border-radius: 18px;
          background: #fbf6ed;
        }

        .personCardHeader {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid #e6dac8;
        }

        .personNumber {
          display: flex;
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          align-items: center;
          justify-content: center;
          border: 1px solid #c99535;
          border-radius: 50%;
          background: linear-gradient(135deg, #c89232, #e2b252);
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1px;
          box-shadow: 0 7px 16px rgba(183, 132, 39, 0.18);
        }

        .personLabel {
          display: block;
          margin-bottom: 3px;
          color: #a97924;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .personCardHeader h2 {
          margin: 0;
          color: #17243a;
          font-size: 20px;
        }

        .relationshipSymbol {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .relationshipSymbol span {
          display: flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border: 1px solid #decba9;
          border-radius: 50%;
          background: #fffdfa;
          color: #a87828;
          font-size: 24px;
        }

        .fieldGrid {
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

        .timeFieldRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 72px;
          gap: 8px;
          align-items: stretch;
        }

        .timeFieldRow input {
          min-width: 0;
        }

        .timeFieldRow input:disabled {
          background: #f1ece3;
          color: #9a9286;
          cursor: not-allowed;
          opacity: 1;
        }

        .unknownTimeButton {
          min-height: 54px;
          box-sizing: border-box;
          border: 1px solid #ddd2bf;
          border-radius: 12px;
          background: #fffdfa;
          color: #6f685e;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .unknownTimeButton.active {
          border-color: #b9862e;
          background: #b9862e;
          color: #fff;
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
          max-width: 760px;
          margin: 8px auto 0;
          color: #756d62;
          font-size: 13px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .premiumModeChooser { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
        .modeOption { padding: 17px 12px; border: 1px solid #dfd4c2; border-radius: 13px; background: #fffdfa; color: #51493e; font-weight: 900; cursor: pointer; font-size: 16px; }
        .modeOption.selected { border: 2px solid #b9862e; background: #f7eddc; color: #805d21; }
        .modeOption small { display: block; margin-top: 5px; font-size: 12px; font-weight: 500; }
        .premiumUsagePanel { margin-top: 16px; padding: 20px; border: 1px solid #dec99f; border-radius: 14px; background: #fffaf1; color: #5d564c; line-height: 1.7; }
        .premiumUsagePanel p { margin: 8px 0; font-size: 13px; }
        .compatPage :global(.reopenLink) {
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
        .compatPage :global(.reopenLink:hover) {
          border-color: #b9852c;
          background: #fff4df;
        }
        .compatPage :global(.reopenLink:focus-visible) {
          outline: 3px solid #17243a;
          outline-offset: 3px;
        }
        .checkUsageButton, .copyResultButton { border: 0; border-radius: 11px; background: #a66f18; color: white; padding: 13px 18px; font-weight: 900; cursor: pointer; }
        .checkUsageButton:disabled { opacity: .6; cursor: default; }
        .usageCount { font-weight: 800; color: #805d21; }
        .deepResult { display: grid; gap: 18px; }
        .deepResult > h3 { font-size: 23px; color: #805d21; }
        .deepResult p, .deepResult li { line-height: 1.9; color: #5f5a52; white-space: pre-line; }
        .deepSection { padding: 22px; border: 1px solid #dfd4c2; border-radius: 16px; background: #fffdfa; }
        .deepSection h3 { margin: 0 0 15px; color: #17243a; font-size: 19px; }
        .deepSection h4 { margin-bottom: 6px; color: #805d21; }
        .deepDisclaimer { font-size: 12px; }
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
          color: #142137;
          cursor: default;
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

        .summaryGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 54px minmax(0, 1fr);
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .summaryCard {
          padding: 22px;
          border: 1px solid #e0d4c1;
          border-radius: 16px;
          background: #fbf6ed;
        }

        .summaryCard > span {
          color: #a97924;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .summaryCard > strong {
          display: block;
          margin-top: 6px;
          color: #17243a;
          font-size: 20px;
        }

        .summaryCard dl {
          margin: 16px 0 0;
        }

        .summaryCard dl > div {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 9px 0;
          border-top: 1px solid #e8dece;
        }

        .summaryCard dt {
          color: #8b8378;
          font-size: 12px;
        }

        .summaryCard dd {
          margin: 0;
          color: #51493e;
          font-size: 12px;
          font-weight: 800;
          text-align: right;
        }

        .summaryHeart {
          color: #b9862e;
          font-size: 28px;
          text-align: center;
        }

        .noticeBox {
          margin-top: 26px;
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
@media (max-width: 820px) {
          .personGrid,
          .summaryGrid {
            grid-template-columns: 1fr;
          }

          .relationshipSymbol {
            min-height: 34px;
          }

          .relationshipSymbol span {
            width: 36px;
            height: 36px;
            font-size: 20px;
          }

          .summaryHeart {
            line-height: 1;
          }
        }

        @media (max-width: 680px) {
          .premiumModeChooser { grid-template-columns: 1fr; }
          .compatPage {
            width: min(100% - 24px, 1120px);
            padding: 30px 0 58px;
          }

          .compatHero {
            margin-bottom: 22px;
          }

          .compatHero h1 {
            font-size: 30px;
          }

          .compatHero p {
            font-size: 14px;
            line-height: 1.8;
          }

          .compatForm {
            padding: 18px;
            border-radius: 20px;
          }

          .personCard {
            padding: 20px 16px;
            border-radius: 15px;
          }

          .personCardHeader {
            margin-bottom: 20px;
          }

          .personNumber {
            width: 44px;
            height: 44px;
            flex-basis: 44px;
          }

          .fieldGrid {
            grid-template-columns: 1fr;
          }

          .timeFieldRow {
            grid-template-columns: minmax(0, 1fr) 68px;
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

          .summaryCard {
            padding: 19px 17px;
          }
        }
      `}</style>

      <style jsx global>{`
        .premiumBox {
          margin-top: 28px;
          padding: 28px 24px;
          border: 1px solid #dcc28f;
          border-radius: 18px;
          background: linear-gradient(135deg, #f7eddc 0%, #fffaf1 100%);
          text-align: center;
          box-shadow: 0 12px 30px rgba(133, 88, 18, 0.08);
        }

        .premiumEyebrow {
          display: block;
          margin-bottom: 8px;
          color: #a97924;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .premiumBox h3 {
          margin: 0;
          color: #17243a;
          font-size: 22px;
          line-height: 1.45;
        }

        .premiumBox p {
          max-width: 650px;
          margin: 10px auto 20px;
          color: #756d62;
          font-size: 14px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .premiumButton {
          display: flex !important;
          width: min(100%, 430px) !important;
          min-height: 82px !important;
          box-sizing: border-box;
          margin: 0 auto;
          padding: 13px 28px;
          border: 2px solid #80520f;
          border-radius: 16px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 4px;
          background: #a66f18 !important;
          color: #ffffff !important;
          text-decoration: none !important;
          box-shadow: 0 12px 26px rgba(133, 88, 18, 0.3);
        }

        .premiumButtonTitle {
          display: block;
          color: #ffffff !important;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.35;
        }

        .premiumButtonPrice {
          display: block;
          color: #ffffff !important;
          font-size: 20px;
          font-weight: 900;
          line-height: 1.35;
        }

        .premiumPaymentGuide {
          max-width: 680px;
          margin: 13px auto 0;
          color: #7b6b50;
          font-size: 12px;
          line-height: 1.7;
          word-break: keep-all;
        }
        body {
          background:
            radial-gradient(circle at 50% 0%, rgba(225, 185, 105, 0.13), transparent 30%),
            linear-gradient(180deg, #f7f2e8 0%, #fbf8f1 58%, #f5efe4 100%);
        }

        .premiumCompatibilityResult {
          display: grid;
          gap: 22px;
        }

        .compatIntroCard {
          padding: 24px 26px;
          border: 1px solid #e4d8c6;
          border-radius: 16px;
          background: linear-gradient(135deg, #f5ead7, #fffaf1);
        }

        .compatIntroMark {
          display: block;
          margin-bottom: 10px;
          color: #a97924;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.8px;
        }

        .compatSectionGrid {
          display: grid;
          gap: 24px;
        }

        .compatAnalysisCard {
          overflow: hidden;
          border: 1px solid #dfd4c2;
          border-radius: 18px;
          background: #fffdfa;
          box-shadow: 0 14px 34px rgba(31, 39, 53, 0.08);
        }

        .compatAnalysisHeader {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 24px 19px;
          border-bottom: 1px solid #dec99f;
          background: linear-gradient(135deg, #f1e4ca 0%, #fffaf2 100%);
        }

        .compatSectionNumber,
        .compatSummaryMark {
          display: flex;
          width: 54px;
          height: 54px;
          flex: 0 0 54px;
          align-items: center;
          justify-content: center;
          border: 1px solid #b9862e;
          border-radius: 50%;
          background: #b9862e;
          color: #fff;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1px;
          box-shadow: 0 5px 14px rgba(154, 114, 46, 0.18);
        }

        .compatSummaryMark {
          font-size: 20px;
        }

        .compatSectionTitleWrap {
          min-width: 0;
          flex: 1;
        }

        .compatSectionLabel {
          display: block;
          margin-bottom: 5px;
          color: #a97924;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .compatSectionTitleWrap h3 {
          margin: 0;
          color: #17243a;
          font-size: 20px;
          line-height: 1.45;
        }

        .compatAnalysisContent {
          padding: 22px 26px 25px;
          background: #fffdfa;
        }

        .compatParagraph {
          margin: 0 0 13px;
          color: #5f5a52;
          font-size: 15px;
          line-height: 1.95;
          word-break: keep-all;
        }

        .compatParagraph:last-child {
          margin-bottom: 0;
        }

        .compatHeadingSmall {
          margin: 20px 0 10px;
          color: #76541c;
          font-size: 16px;
          line-height: 1.6;
        }

        .compatResultList {
          display: grid;
          gap: 9px;
          margin: 15px 0 4px;
          padding: 0;
          list-style: none;
        }

        .compatResultList li {
          position: relative;
          margin: 0;
          padding: 13px 15px 13px 38px;
          border-radius: 11px;
          background: #f7f2e9;
          color: #5d564c;
          font-size: 14px;
          line-height: 1.75;
        }

        .compatResultList li::before {
          content: "♥";
          position: absolute;
          top: 13px;
          left: 15px;
          color: #b9862e;
          font-size: 11px;
          font-weight: 900;
        }

        .compatAnalysisCard:last-child {
          border: 2px solid #c5a66d;
        }

        .compatAnalysisCard:last-child .compatAnalysisHeader {
          background: linear-gradient(135deg, #ead7ae, #fff8e8);
        }

        @media (max-width: 680px) {
          .premiumCompatibilityResult {
            gap: 16px;
          }

          .compatIntroCard {
            padding: 18px;
          }

          .compatAnalysisHeader {
            gap: 13px;
            padding: 18px 16px;
          }

          .compatSectionNumber,
          .compatSummaryMark {
            width: 44px;
            height: 44px;
            flex-basis: 44px;
            font-size: 14px;
          }

          .compatSectionTitleWrap h3 {
            font-size: 17px;
          }

          .compatAnalysisContent {
            padding: 18px 17px 20px;
          }

          .compatParagraph {
            font-size: 14px;
            line-height: 1.85;
          }
        }
      `}</style>
    </main>
  );
}
