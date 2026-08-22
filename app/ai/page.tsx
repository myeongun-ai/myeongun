"use client";

import { useState } from "react";

type Message = {
  who: "ai" | "user";
  text: string;
};

export default function AI() {
  const [q, setQ] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      who: "ai",
      text: "안녕하세요. 나의 사주를 바탕으로 궁금한 점을 함께 살펴볼게요. 사업, 재물, 연애, 직업 중 무엇이 궁금하신가요?",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const send = async () => {
    const question = q.trim();

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
          text: data.answer,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((m) => [
        ...m,
        {
          who: "ai",
          text: "AI 상담 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "올해 사업운은?",
    "재물운이 궁금해요",
    "직업을 바꿔도 될까요?",
    "연애운은 어떤가요?",
  ];

  return (
    <main className="inner aiPage">
      <div className="pageIntro">
        <span className="eyebrow">MYEONGUN AI</span>

        <h1>명운 AI 상담</h1>

        <p>
          내 사주를 알고 있는 AI와 운세에 대해
          <br />
          대화해 보세요.
        </p>
      </div>

      <div className="chatBox">
        <div className="messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.who === "user" ? "bubble me" : "bubble"}
            >
              <small>{m.who === "user" ? "나" : "명운 AI"}</small>
              <p>{m.text}</p>
            </div>
          ))}

          {loading && (
            <div className="bubble">
              <small>명운 AI</small>
              <p>답변을 작성하고 있습니다...</p>
            </div>
          )}
        </div>

        <div className="quickQuestions">
          {quickQuestions.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => setQ(text)}
              disabled={loading}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="chatInput">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                send();
              }
            }}
            placeholder="궁금한 것을 입력하세요"
            disabled={loading}
          />

          <button type="button" onClick={send} disabled={loading}>
            {loading ? "…" : "➤"}
          </button>
        </div>
      </div>
    </main>
  );
}