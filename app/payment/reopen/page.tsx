"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReopenPaymentPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!name.trim() || !birth) {
      setMessage("이름과 생년월일을 입력해주세요.");
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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "재열람 확인에 실패했습니다.");
      }

      // 결제한 브라우저에 저장되어 있는 동일 사주 정보인지 마지막으로 확인합니다.
      const saved = localStorage.getItem("myeongun_saju");

      if (!saved) {
        throw new Error(
          "이 브라우저에 저장된 사주 결과가 없습니다. 새로 사주를 입력해주세요."
        );
      }

      const saju = JSON.parse(saved);

      if (
        String(saju?.name || "").trim() !== name.trim() ||
        String(saju?.birth || "") !== birth
      ) {
        throw new Error(
          "저장된 사주 정보와 입력한 정보가 일치하지 않습니다."
        );
      }

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
          결제 후 7일 동안 같은 브라우저에서 다시 열 수 있습니다.
          <br />
          개인정보 보호를 위해 이름과 생년월일을 다시 확인합니다.
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
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                border: "1px solid #d8cfbf",
                borderRadius: "10px",
                background: "#fff",
                fontSize: "14px",
              }}
            />
          </label>

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
            생년월일
            <input
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                border: "1px solid #d8cfbf",
                borderRadius: "10px",
                background: "#fff",
                fontSize: "14px",
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
          새 사주를 입력하면 기존 재열람 이용권은 종료됩니다.
        </p>
      </section>
    </main>
  );
}
