"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function parseBirth(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function ReopenPaymentPage() {
  const router = useRouter();

  const today = new Date();
  const currentYear = today.getFullYear();

  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentYear);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);

  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1930 + 1 },
        (_, index) => currentYear - index
      ),
    [currentYear]
  );

  const parsedBirth = parseBirth(birth);
  const monthDays = daysInMonth(pickerYear, pickerMonth);
  const firstDay = new Date(pickerYear, pickerMonth - 1, 1).getDay();

  function openPicker() {
    const parsed = parseBirth(birth);

    if (parsed) {
      setPickerYear(parsed.year);
      setPickerMonth(parsed.month);
    }

    setPickerOpen(true);
  }

  function moveMonth(delta: number) {
    let nextYear = pickerYear;
    let nextMonth = pickerMonth + delta;

    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    if (nextYear < 1930 || nextYear > currentYear) {
      return;
    }

    setPickerYear(nextYear);
    setPickerMonth(nextMonth);
  }

  function selectDay(day: number) {
    const selected = new Date(pickerYear, pickerMonth - 1, day);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (selected > now) {
      return;
    }

    setBirth(`${pickerYear}-${pad2(pickerMonth)}-${pad2(day)}`);
    setPickerOpen(false);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!name.trim() || !birth || !code.trim()) {
      setMessage("이름, 생년월일, 재열람 코드를 모두 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/payment/reopen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim(),
          birth,
          code: code.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "재열람 확인에 실패했습니다.");
      }

      if (!result?.saju) {
        throw new Error("재열람할 사주 정보를 불러오지 못했습니다.");
      }

      localStorage.setItem("myeongun_saju", JSON.stringify(result.saju));
      localStorage.setItem("myeongun_paid_saju", JSON.stringify(result.saju));
      sessionStorage.setItem("myeongun_session_active", "1");

      router.replace("/fortune/detail");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "재열람 확인 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "13px 14px",
    border: "1px solid #d8cfbf",
    borderRadius: "10px",
    background: "#fff",
    fontSize: "14px",
  };

  const pickerButtonStyle = {
    minHeight: "42px",
    border: "1px solid #d8cfbf",
    borderRadius: "9px",
    background: "#fff",
    color: "#35322d",
    fontWeight: 800,
    cursor: "pointer",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f1e8",
        display: "grid",
        placeItems: "center",
        padding: "30px 20px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#fffdf8",
          border: "1px solid #ddd3c2",
          borderRadius: "22px",
          padding: "42px 34px",
          boxShadow: "0 15px 40px rgba(0,0,0,.07)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            letterSpacing: "2px",
            color: "#a17a27",
            fontWeight: 700,
          }}
        >
          MYEONGUN PREMIUM
        </div>

        <h1
          style={{
            textAlign: "center",
            margin: "14px 0 10px",
            color: "#20251f",
            fontSize: "28px",
          }}
        >
          결제한 상세 사주 다시 보기
        </h1>

        <p
          style={{
            textAlign: "center",
            margin: "0 0 28px",
            color: "#777",
            fontSize: "13px",
            lineHeight: 1.8,
          }}
        >
          결제 후 7일 동안 PC와 휴대폰 등 다른 기기에서도 다시 열 수 있습니다.
          <br />
          결제 완료 화면에서 발급된 8자리 재열람 코드를 입력해주세요.
        </p>

        <form onSubmit={submit}>
          <label
            style={{
              display: "grid",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#35322d",
            }}
          >
            이름
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="결제할 때 입력한 이름"
              style={inputStyle}
            />
          </label>

          <div
            style={{
              display: "grid",
              gap: "8px",
              marginTop: "16px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#35322d",
            }}
          >
            <span>생년월일</span>

            <button
              type="button"
              onClick={openPicker}
              style={{
                ...inputStyle,
                minHeight: "48px",
                textAlign: "left",
                cursor: "pointer",
                color: birth ? "#20251f" : "#888",
              }}
            >
              {birth || "생년월일을 선택하세요"}
            </button>

            {pickerOpen && (
              <section
                style={{
                  marginTop: "4px",
                  padding: "14px",
                  border: "1px solid #d8cfbf",
                  borderRadius: "14px",
                  background: "#fff",
                  boxShadow: "0 12px 28px rgba(0,0,0,.08)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "42px minmax(0,1fr) minmax(0,1fr) 42px",
                    gap: "7px",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    aria-label="이전 월"
                    style={pickerButtonStyle}
                  >
                    ‹
                  </button>

                  <select
                    aria-label="연도 선택"
                    value={pickerYear}
                    onChange={(e) => setPickerYear(Number(e.target.value))}
                    style={{
                      ...inputStyle,
                      minWidth: 0,
                      minHeight: "42px",
                      padding: "0 8px",
                      fontWeight: 700,
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
                    onChange={(e) => setPickerMonth(Number(e.target.value))}
                    style={{
                      ...inputStyle,
                      minWidth: 0,
                      minHeight: "42px",
                      padding: "0 8px",
                      fontWeight: 700,
                    }}
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map(
                      (month) => (
                        <option key={month} value={month}>
                          {month}월
                        </option>
                      )
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={() => moveMonth(1)}
                    aria-label="다음 월"
                    style={pickerButtonStyle}
                  >
                    ›
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "5px",
                    marginTop: "14px",
                    textAlign: "center",
                  }}
                >
                  {["일", "월", "화", "수", "목", "금", "토"].map((dayName) => (
                    <div
                      key={dayName}
                      style={{
                        padding: "7px 0",
                        color: "#8b8377",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      {dayName}
                    </div>
                  ))}

                  {Array.from({ length: firstDay }, (_, index) => (
                    <div key={`blank-${index}`} />
                  ))}

                  {Array.from({ length: monthDays }, (_, index) => index + 1).map(
                    (day) => {
                      const selected =
                        parsedBirth?.year === pickerYear &&
                        parsedBirth?.month === pickerMonth &&
                        parsedBirth?.day === day;

                      const date = new Date(pickerYear, pickerMonth - 1, day);
                      const now = new Date();
                      now.setHours(23, 59, 59, 999);
                      const future = date > now;

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={future}
                          onClick={() => selectDay(day)}
                          style={{
                            aspectRatio: "1 / 1",
                            border: selected
                              ? "1px solid #20251f"
                              : "1px solid transparent",
                            borderRadius: "50%",
                            background: selected ? "#20251f" : "transparent",
                            color: future
                              ? "#cfc8bc"
                              : selected
                                ? "#fff"
                                : "#35322d",
                            fontSize: "12px",
                            cursor: future ? "default" : "pointer",
                          }}
                        >
                          {day}
                        </button>
                      );
                    }
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginTop: "14px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setBirth("");
                      setPickerOpen(false);
                    }}
                    style={{ ...pickerButtonStyle, padding: "0 16px" }}
                  >
                    삭제
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    style={{ ...pickerButtonStyle, padding: "0 16px" }}
                  >
                    닫기
                  </button>
                </div>
              </section>
            )}
          </div>

          <label
            style={{
              display: "grid",
              gap: "8px",
              marginTop: "16px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#35322d",
            }}
          >
            재열람 코드
            <input
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 8)
                )
              }
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              maxLength={8}
              placeholder="예: AB7K9M2P"
              style={{
                ...inputStyle,
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            />
          </label>

          {message && (
            <p
              style={{
                margin: "16px 0 0",
                color: "#b42318",
                fontSize: "12px",
                lineHeight: 1.7,
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "22px",
              minHeight: "54px",
              border: "none",
              borderRadius: "10px",
              background: "#20251f",
              color: "#fff",
              fontWeight: 800,
              fontSize: "15px",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "확인 중..." : "상세 사주 다시 보기"}
          </button>
        </form>

        <p
          style={{
            margin: "18px 0 0",
            color: "#9a9286",
            fontSize: "11px",
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          재열람 코드는 결제한 상세 사주에만 사용할 수 있으며 7일 후 만료됩니다.
        </p>
      </section>
    </main>
  );
}
