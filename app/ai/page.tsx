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
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      who: "ai",
      text:
        "안녕하세요. 명운 AI 상담입니다. 저장된 사주 정보가 있으면 그 내용을 참고해 2026년을 중심으로 재물, 사업, 직업, 인간관계와 앞으로의 흐름을 함께 살펴드릴게요.",
    },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myeongun_saju");
      if (saved) {
        setSaju(JSON.parse(saved));
      }
    } catch {
      setSaju(null);
    }
  }, []);

  const send = async (preset?: string) => {
    const question = (preset ?? q).trim();

    if (!question || loading) return;

    setMessages((m) => [
      ...m,
      {
        who: "user",
        text: question,
      },
    ]);

    setQ("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      console.error(error);

      setMessages((m) => [
        ...m,
        {
          who: "ai",
          text:
            error instanceof Error
              ? error.message
              : "AI 상담 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
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

  return (
    <main className="inner aiPage">
      <div className="pageIntro">
        <span className="eyebrow">MYEONGUN AI</span>

        <h1>명운 AI 상담</h1>

        <p>
          저장된 나의 사주 정보를 참고해 2026년을 중심으로 궁금한 내용을 AI와 대화해보세요.
        </p>
      </div>

      {!saju?.birth || !saju?.time ? (
        <section
          className="contentCard"
          style={{ maxWidth: 760, margin: "0 auto 24px", textAlign: "center" }}
        >
          <h2>사주 정보를 먼저 입력해주세요</h2>
          <p>
            사주 정보가 없어도 일반적인 질문은 가능하지만, 개인화된 답변을 원한다면
            먼저 생년월일과 출생시간을 입력하는 것이 좋습니다.
          </p>
          <Link href="/saju" className="primaryBtn inline">
            사주 입력하러 가기
          </Link>
        </section>
      ) : (
        <section
          className="contentCard"
          style={{ maxWidth: 760, margin: "0 auto 24px" }}
        >
          <h2>{saju.name ? `${saju.name}님의 사주 정보 연결됨` : "사주 정보 연결됨"}</h2>
          <p>
            {saju.birth} · {saju.time} · {saju.gender || "-"} · {saju.calendar || "-"}
          </p>
        </section>
      )}

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
                cursor: loading ? "wait" : "pointer",
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
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "답변 중..." : "보내기"}
          </button>
        </div>
      </div>
    </main>
  );
}
