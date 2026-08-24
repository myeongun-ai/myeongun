"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

export default function SajuPage() {
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

  function update<K extends keyof SajuForm>(key: K, value: SajuForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const parsed = await response.json();

      if (!response.ok) {
        throw new Error(parsed?.error || "사주 분석에 실패했습니다.");
      }

      localStorage.setItem("myeongun_saju", JSON.stringify(payload));
      localStorage.setItem("myeongun_saju_result", JSON.stringify(parsed));

      router.push("/payment");
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
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "3px",
            color: "#b08a3e",
            fontWeight: 700,
            marginBottom: "12px",
          }}
        >
          MY SAJU
        </div>

        <h1
          style={{
            margin: 0,
            fontFamily: "Georgia, serif",
            fontSize: "44px",
            fontWeight: 500,
            color: "#20251f",
          }}
        >
          나의 사주
        </h1>

        <p
          style={{
            margin: "14px 0 0",
            color: "#777064",
            fontSize: "14px",
            lineHeight: 1.8,
          }}
        >
          생년월일과 출생시간을 입력하면 나의 흐름을 살펴볼 수 있습니다.
        </p>
      </section>

      <section
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          background: "#fffdf8",
          border: "1px solid #dccfbf",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
        }}
      >
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
              marginTop: "18px",
            }}
          >
            <label style={labelStyle}>
              생년월일
              <input
                name="birth"
                type="date"
                value={form.birth}
                onChange={(e) => update("birth", e.target.value)}
                required
                style={fieldStyle}
              />
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
              marginTop: "18px",
            }}
          >
            <label style={labelStyle}>
              성별
              <select
                name="gender"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                style={fieldStyle}
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
                style={fieldStyle}
              >
                <option value="양력">양력</option>
                <option value="음력">음력</option>
              </select>
            </label>
          </div>

          {error && (
            <p
              style={{
                margin: "18px 0 0",
                color: "#b42318",
                fontSize: "13px",
                lineHeight: 1.6,
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
              marginTop: "22px",
              border: "none",
              borderRadius: "10px",
              padding: "16px",
              background: "#20251f",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "사주 분석 중..." : "사주 분석 시작"}
          </button>
        </form>
      </section>

      <p
        style={{
          textAlign: "center",
          color: "#9a9388",
          marginTop: "20px",
          fontSize: "12px",
        }}
      >
        입력한 정보는 이 브라우저에서 사주 결과를 이어보기 위해 저장됩니다.
      </p>
    </main>
  );
}
