"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Message = {
  who: "ai" | "user";
  text: string;
};

type Saju = {
  name?: string;
  birth?: string;
  time?: string;
  gender?: string;
  calendar?: string;
};

export default function AI() {
  const [q, setQ] = useState("");
  const [saju, setSaju] = useState<Saju | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      who: "ai",
      text: "안녕하세요. 명운 AI 상담입니다. 개인화 상담을 이용하려면 먼저 나의 사주 정보를 입력해주세요.",
    },
  ]);

  useEffect(() => {
    try {
      const active = sessionStorage.getItem("myeongun_session_active") === "1";

      if (!active) {
        setSaju(null);
        return;
      }

      const saved = localStorage.getItem("myeongun_saju");
      setSaju(saved ? JSON.parse(saved) : null);
    } catch {
      setSaju(null);
    } finally {
      setReady(true);
    }
  }, []);

  const canChat = Boolean(ready && saju?.birth && saju?.time);

  const send = async (preset?: string) => {
    if (!canChat) return;

    const question = (preset ?? q).trim();
    if (!question || loading) return;

    setMessages((m) => [...m, { who: "user", text: question }]);
    setQ("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          saju,
          targetYear: 2026,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "AI 상담에 실패했습니다.");
      }

      setMessages((m) => [
        ...m,
        {
          who: "ai",
          text: String(data.answer || "").trim() || "답변을 생성하지 못했습니다.",
        },
      ]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        {
          who: "ai",
          text:
            error instanceof Error
              ? error.message
              : "AI 상담 중 오류가 발생했습니다.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "2026년 사업운이 궁금해요",
    "2026년 재물운을 자세히 보고 싶어요",
    "직업을 바꾸는 것이 좋을까요?",
    "인간관계 흐름이 궁금해요",
  ];

  if (!ready) {
    return (
      <main className="inner aiPage">
        <section className="contentCard" style={{ textAlign: "center" }}>
          <p>사주 정보를 확인하고 있습니다...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="inner aiPage">
      <div className="pageIntro">
        <span className="eyebrow">MYEONGUN AI</span>
        <h1>명운 AI 상담</h1>
        <p>
          현재 이용자가 직접 입력한 사주 정보가 있을 때만 개인화 상담을 이용할 수 있습니다.
        </p>
      </div>

      {!canChat ? (
        <>
          <section
            className="contentCard"
            style={{ maxWidth: 760, margin: "0 auto 24px", textAlign: "center" }}
          >
            <h2>사주 정보를 먼저 입력해주세요</h2>
            <p>
              개인정보를 입력하지 않은 상태에서는 사업운, 재물운, 직업운,
              인간관계 상담 답변을 제공하지 않습니다.
            </p>
            <Link href="/saju" className="primaryBtn inline">
              사주 입력하러 가기
            </Link>
          </section>

          <div className="chatBox">
            <div className="messages">
              <div className="bubble">
                <small>명운 AI</small>
                <p>
                  상담을 시작하려면 먼저 사주 정보를 입력해주세요.
                  입력 전에는 빠른 질문과 자유 질문 기능이 잠겨 있습니다.
                </p>
              </div>
            </div>

            <div
              className="quickQuestions"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              {quickQuestions.map((text) => (
                <button
                  key={text}
                  type="button"
                  disabled
                  style={{
                    width: "100%",
                    border: "1px solid #ded8ce",
                    borderRadius: "12px",
                    background: "#f4f1eb",
                    color: "#aaa298",
                    padding: "11px 13px",
                    fontSize: "13px",
                    lineHeight: 1.45,
                    cursor: "not-allowed",
                    opacity: 0.75,
                  }}
                >
                  {text}
                </button>
              ))}
            </div>

            <div
              className="chatInput"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "10px",
                marginTop: "14px",
              }}
            >
              <input
                value=""
                readOnly
                disabled
                placeholder="사주 입력 후 상담을 이용할 수 있습니다"
                style={{
                  minWidth: 0,
                  border: "1px solid #ded8ce",
                  borderRadius: "12px",
                  padding: "13px 14px",
                  fontSize: "14px",
                  background: "#f4f1eb",
                  color: "#aaa298",
                }}
              />
              <button
                type="button"
                disabled
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "0 20px",
                  background: "#a8aaa5",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "not-allowed",
                }}
              >
                잠김
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <section
            className="contentCard"
            style={{ maxWidth: 760, margin: "0 auto 24px" }}
          >
            <h2>
              {saju?.name
                ? `${saju.name}님의 사주 정보 연결됨`
                : "사주 정보 연결됨"}
            </h2>
            <p>
              {saju?.birth} · {saju?.time} · {saju?.gender || "-"} ·{" "}
              {saju?.calendar || "-"}
            </p>
          </section>

          <div className="chatBox">
            <div className="messages">
              {messages.map((m, i) => (
                <div
                  key={`${i}-${m.text.slice(0, 20)}`}
                  className={m.who === "user" ? "bubble me" : "bubble"}
                >
                  <small>{m.who === "user" ? "나" : "명운 AI"}</small>
                  <p style={{ whiteSpace: "pre-wrap" }}>{m.text}</p>
                </div>
              ))}

              {loading && (
                <div className="bubble">
                  <small>명운 AI</small>
                  <p>답변을 작성하고 있습니다...</p>
                </div>
              )}
            </div>

            <div
              className="quickQuestions"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              {quickQuestions.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => send(text)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    border: "1px solid #d8cdbc",
                    borderRadius: "12px",
                    background: "#fffdf8",
                    color: "#3f3a32",
                    padding: "11px 13px",
                    fontSize: "13px",
                    lineHeight: 1.45,
                  }}
                >
                  {text}
                </button>
              ))}
            </div>

            <div
              className="chatInput"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "10px",
                marginTop: "14px",
              }}
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    send();
                  }
                }}
                placeholder="궁금한 내용을 입력하세요"
                disabled={loading}
                style={{
                  minWidth: 0,
                  border: "1px solid #d8cdbc",
                  borderRadius: "12px",
                  padding: "13px 14px",
                  fontSize: "14px",
                  background: "#fff",
                }}
              />

              <button
                type="button"
                onClick={() => send()}
                disabled={loading}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "0 20px",
                  background: "#20251f",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {loading ? "답변 중..." : "보내기"}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
