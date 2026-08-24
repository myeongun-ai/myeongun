"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentYear);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    sessionStorage.removeItem("myeongun_session_active");
  }, []);

  function update<K extends keyof SajuForm>(key: K, value: SajuForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const years = useMemo(
    () => Array.from({ length: currentYear - 1930 + 1 }, (_, i) => currentYear - i),
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const data = new FormData(e.currentTarget);
    const payload: SajuForm = {
      name: String(data.get("name") || "").trim(),
      birth: String(data.get("birth") || ""),
      time: String(data.get("time") || ""),
      gender: String(data.get("gender") || "남성"),
      calendar: String(data.get("calendar") || "양력"),
    };

    if (!payload.name || !payload.birth || !payload.time) {
      setError("이름, 생년월일, 출생시간을 모두 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
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
      sessionStorage.setItem("myeongun_session_active", "1");
      router.push("/payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "사주 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = {
    display: "grid",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#2d312b",
  } as const;

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d8cdbc",
    borderRadius: "10px",
    background: "#fff",
    fontSize: "14px",
  } as const;

  return (
    <main className="inner">
      <section style={{ textAlign: "center", padding: "56px 20px 26px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#b08a3e", fontWeight: 700, marginBottom: "12px" }}>
          MY SAJU
        </div>
        <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: "44px", fontWeight: 500, color: "#20251f" }}>
          나의 사주
        </h1>
        <p style={{ margin: "14px 0 0", color: "#777064", fontSize: "14px", lineHeight: 1.8 }}>
          생년월일과 출생시간을 입력하면 나의 흐름을 살펴볼 수 있습니다.
        </p>
      </section>

      <section style={{ maxWidth: "820px", margin: "0 auto", background: "#fffdf8", border: "1px solid #dccfbf", borderRadius: "18px", padding: "28px", boxShadow: "0 10px 30px rgba(0,0,0,.04)" }}>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            이름
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="이름을 입력해주세요"
              autoComplete="name"
              style={fieldStyle}
            />
          </label>

          <div className="twoCol" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "16px", marginTop: "18px" }}>
            <label style={labelStyle}>
              생년월일
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
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
                  style={{ border: "none", borderRadius: "10px", padding: "0 16px", background: "#20251f", color: "#fff", fontWeight: 700 }}
                >
                  달력
                </button>
              </div>
            </label>

            <label style={labelStyle}>
              출생시간
              <input
                name="time"
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
                required
                style={fieldStyle}
              />
            </label>
          </div>

          {pickerOpen && (
            <section style={{ marginTop: "16px", border: "1px solid #d8cdbc", borderRadius: "16px", padding: "16px", background: "#fff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 44px", gap: "8px", alignItems: "center" }}>
                <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">‹</button>

                <select
                  aria-label="연도 선택"
                  value={pickerYear}
                  onChange={(e) => setPickerYear(Number(e.target.value))}
                  style={fieldStyle}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>

                <select
                  aria-label="월 선택"
                  value={pickerMonth}
                  onChange={(e) => setPickerMonth(Number(e.target.value))}
                  style={fieldStyle}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>{month}월</option>
                  ))}
                </select>

                <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">›</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: "7px", marginTop: "14px", textAlign: "center" }}>
                {["일","월","화","수","목","금","토"].map((d) => (
                  <div key={d} style={{ padding: "8px 0", color: "#b08a3e", fontSize: "12px", fontWeight: 700 }}>{d}</div>
                ))}

                {Array.from({ length: firstDay }).map((_, i) => <div key={`blank-${i}`} />)}

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
                      style={{
                        minHeight: "42px",
                        border: "none",
                        borderRadius: "10px",
                        background: selected ? "#20251f" : "#f5f1ea",
                        color: selected ? "#fff" : "#2d312b",
                        fontSize: "14px",
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px" }}>
                <button type="button" onClick={() => { update("birth", ""); setPickerOpen(false); }}>삭제</button>
                <button type="button" onClick={() => setPickerOpen(false)}>닫기</button>
              </div>
            </section>
          )}

          <div className="twoCol" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "16px", marginTop: "18px" }}>
            <label style={labelStyle}>
              성별
              <select name="gender" value={form.gender} onChange={(e) => update("gender", e.target.value)} style={fieldStyle}>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </label>

            <label style={labelStyle}>
              달력 기준
              <select name="calendar" value={form.calendar} onChange={(e) => update("calendar", e.target.value)} style={fieldStyle}>
                <option value="양력">양력</option>
                <option value="음력">음력</option>
              </select>
            </label>
          </div>

          {error && <p style={{ margin: "18px 0 0", color: "#b42318", fontSize: "13px" }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "22px", border: "none", borderRadius: "10px", padding: "16px", background: "#20251f", color: "#fff", fontSize: "15px", fontWeight: 700 }}>
            {loading ? "사주 분석 중..." : "사주 분석 시작"}
          </button>
        </form>
      </section>

      <p style={{ textAlign: "center", color: "#9a9388", marginTop: "20px", fontSize: "12px" }}>
        입력한 정보는 현재 이용 흐름을 이어보기 위해 저장됩니다.
      </p>

      <style jsx>{`
        @media (max-width: 640px) {
          .twoCol {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
