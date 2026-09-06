"use client";

import { FormEvent, useMemo, useState } from "react";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

type Message = {
  who: "ai" | "user";
  text: string;
};

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

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseBirth(value: string) {
  const [y, m, d] = value.split("-").map(Number);

  if (!y || !m || !d) {
    return null;
  }

  return {
    year: y,
    month: m,
    day: d,
  };
}

function renderAIAnswer(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  const headingPattern =
    /^(?:0?\d+\s*[.)-]?\s*)?(핵심 답변|사주 근거|2026년 흐름(?:과 질문 주제 연결)?|질문 주제 해석|시기별(?: 또는 상황별)? 주의점|실전 조언)\s*:?\s*$/;

  const lines = normalized.split("\n");
  const sections: { title: string; content: string[] }[] = [];
  const intro: string[] = [];
  let currentSection: { title: string; content: string[] } | null = null;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    const heading = line.match(headingPattern);

    if (heading) {
      currentSection = {
        title: heading[1],
        content: [],
      };

      sections.push(currentSection);
      return;
    }

    if (currentSection) {
      currentSection.content.push(line);
    } else {
      intro.push(line);
    }
  });

  if (!sections.length) {
    return <p className="aiAnswerPlain">{text}</p>;
  }

  return (
    <div className="aiAnswerStructured">
      {intro.length > 0 && (
        <div className="aiAnswerIntro">
          {intro.map((line, index) => (
            <p key={`intro-${index}`}>{line}</p>
          ))}
        </div>
      )}

      {sections.map((section, index) => (
        <section
          className="aiAnswerSection"
          key={`${section.title}-${index}`}
        >
          <div className="aiAnswerSectionHeader">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{section.title}</strong>
          </div>

          <div className="aiAnswerSectionBody">
            {section.content.map((line, lineIndex) => {
              const bullet = line.match(/^[-•]\s*(.+)$/);
              const numbered = line.match(/^\d+[.)]\s*(.+)$/);

              if (bullet || numbered) {
                return (
                  <div
                    className="aiAnswerPoint"
                    key={`${index}-${lineIndex}`}
                  >
                    <span>•</span>
                    <p>{(bullet || numbered)?.[1]}</p>
                  </div>
                );
              }

              return (
                <p key={`${index}-${lineIndex}`}>
                  {line}
                </p>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function AIPage() {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [form, setForm] = useState<SajuForm>({
    name: "",
    birth: "",
    time: "모름",
    gender: "남성",
    calendar: "양력",
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentYear);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      who: "ai",
      text:
        "안녕하세요. 명운 AI 상담입니다. 아래에 사주 정보를 입력한 뒤 궁금한 내용을 자유롭게 질문해 주세요.",
    },
  ]);

  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1920 + 1 },
        (_, index) => currentYear - index
      ),
    [currentYear]
  );

  const parsedBirth = parseBirth(form.birth);
  const monthDays = daysInMonth(pickerYear, pickerMonth);
  const firstDay = new Date(
    pickerYear,
    pickerMonth - 1,
    1
  ).getDay();

  const canChat = Boolean(
    form.name.trim() &&
      form.birth &&
      form.time &&
      form.gender &&
      form.calendar
  );

  const quickQuestions = [
    "2026년 사업운이 궁금해요",
    "2026년 재물운을 자세히 보고 싶어요",
    "직업을 바꾸는 것이 좋을까요?",
    "인간관계 흐름이 궁금해요",
  ];

  function update<K extends keyof SajuForm>(
    key: K,
    value: SajuForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError("");
  }

  function openPicker() {
    const parsed = parseBirth(form.birth);

    if (parsed) {
      setPickerYear(parsed.year);
      setPickerMonth(parsed.month);
    } else {
      setPickerYear(currentYear);
      setPickerMonth(today.getMonth() + 1);
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

    if (year < 1920 || year > currentYear) {
      return;
    }

    setPickerYear(year);
    setPickerMonth(month);
  }

  function selectDay(day: number) {
    update(
      "birth",
      `${pickerYear}-${pad2(pickerMonth)}-${pad2(day)}`
    );

    setPickerOpen(false);
  }

  async function send(preset?: string) {
    if (!canChat || loading) return;

    const q = String(preset ?? question).trim();

    if (!q) return;

    setMessages((previous) => [
      ...previous,
      {
        who: "user",
        text: q,
      },
    ]);

    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: q,
          saju: {
            name: form.name.trim(),
            birth: form.birth,
            time: form.time,
            gender: form.gender,
            calendar: form.calendar,
          },
          targetYear: 2026,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "AI 상담에 실패했습니다."
        );
      }

      const answer = String(data?.answer || "").trim();

      if (!answer) {
        throw new Error("AI 상담 답변이 비어 있습니다.");
      }

      setMessages((previous) => [
        ...previous,
        {
          who: "ai",
          text: answer,
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "AI 상담 중 오류가 발생했습니다.";

      setError(message);

      setMessages((previous) => [
        ...previous,
        {
          who: "ai",
          text: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuestionSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    send();
  }

  function resetAll() {
    setForm({
      name: "",
      birth: "",
      time: "모름",
      gender: "남성",
      calendar: "양력",
    });

    setQuestion("");
    setError("");
    setPickerOpen(false);

    setMessages([
      {
        who: "ai",
        text:
          "안녕하세요. 명운 AI 상담입니다. 아래에 사주 정보를 입력한 뒤 궁금한 내용을 자유롭게 질문해 주세요.",
      },
    ]);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="aiPage">
      <section className="aiHero">
        <span className="eyebrow">MYEONGUN AI</span>
        <h1>명운 AI 상담</h1>
        <p>
          사주 정보를 직접 입력하면 실제 만세력 계산을 바탕으로
          재물·사업·직업·인간관계·2026년 흐름을 자유롭게
          상담할 수 있습니다.
        </p>
      </section>

      <section className="sajuInputCard">
        <div className="cardTitle">
          <span>PERSONAL SAJU</span>
          <h2>상담에 사용할 사주 정보를 입력하세요</h2>
        </div>

        <div className="formGrid">
          <label className="field full">
            <span>이름</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                update("name", event.target.value)
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
              onClick={openPicker}
            >
              {form.birth || "생년월일을 선택하세요"}
              <span>📅</span>
            </button>

            {pickerOpen && (
              <div className="birthPicker">
                <div className="birthPickerHeader">
                  <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    aria-label="이전 월"
                  >
                    ‹
                  </button>

                  <div className="birthPickerSelects">
                    <select
                      aria-label="연도 선택"
                      value={pickerYear}
                      onChange={(event) =>
                        setPickerYear(
                          Number(event.target.value)
                        )
                      }
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
                      onChange={(event) =>
                        setPickerMonth(
                          Number(event.target.value)
                        )
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
                    onClick={() => moveMonth(1)}
                    aria-label="다음 월"
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
                    length: firstDay,
                  }).map((_, index) => (
                    <span key={`empty-${index}`} />
                  ))}

                  {Array.from(
                    { length: monthDays },
                    (_, index) => index + 1
                  ).map((day) => {
                    const selected =
                      parsedBirth?.year === pickerYear &&
                      parsedBirth?.month === pickerMonth &&
                      parsedBirth?.day === day;

                    return (
                      <button
                        type="button"
                        key={day}
                        className={
                          selected ? "selected" : ""
                        }
                        onClick={() => selectDay(day)}
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
                  >
                    삭제
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>

          <label className="field">
            <span>출생시간</span>
            <select
              value={form.time}
              onChange={(event) =>
                update("time", event.target.value)
              }
            >
              {TIME_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>성별</span>
            <select
              value={form.gender}
              onChange={(event) =>
                update("gender", event.target.value)
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
                  form.calendar === "양력"
                    ? "active"
                    : ""
                }
                onClick={() => update("calendar", "양력")}
              >
                양력
              </button>

              <button
                type="button"
                className={
                  form.calendar === "음력"
                    ? "active"
                    : ""
                }
                onClick={() => update("calendar", "음력")}
              >
                음력
              </button>
            </div>
          </div>
        </div>

        <div className="sajuGuide">
          <span>MANSE RYEOK BASED AI</span>
          <strong>
            입력한 사주를 실제 만세력으로 계산해 상담합니다.
          </strong>
          <p>
            일간·오행·신강신약·십성·지장간과 참고용 용신·희신을
            질문 내용과 연결해 답변합니다.
          </p>
        </div>
      </section>

      <section className="chatCard">
        <div className="chatHeader">
          <div>
            <span>AI CONSULTING</span>
            <h2>궁금한 내용을 질문해 보세요</h2>
          </div>

          {canChat && (
            <div className="connectedBadge">
              상담 준비 완료
            </div>
          )}
        </div>

        {!canChat && (
          <div className="lockedNotice">
            이름, 생년월일, 출생시간, 성별, 달력 기준을
            입력하면 상담이 활성화됩니다.
          </div>
        )}

        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={`${index}-${message.text.slice(0, 20)}`}
              className={
                message.who === "user"
                  ? "bubble userBubble"
                  : "bubble aiBubble"
              }
            >
              <small>
                {message.who === "user"
                  ? "나"
                  : "명운 AI"}
              </small>

              {message.who === "ai" ? (
                  renderAIAnswer(message.text)
                ) : (
                 <p>{message.text}</p>
                )}
            </div>
          ))}

          {loading && (
            <div className="bubble aiBubble">
              <small>명운 AI</small>
              <p>사주를 기준으로 답변을 작성하고 있습니다...</p>
            </div>
          )}
        </div>

        <div className="quickQuestions">
          {quickQuestions.map((text) => (
            <button
              key={text}
              type="button"
              disabled={!canChat || loading}
              onClick={() => send(text)}
            >
              {text}
            </button>
          ))}
        </div>

        {error && <div className="errorBox">{error}</div>}

        <form
          className="chatInput"
          onSubmit={handleQuestionSubmit}
        >
          <input
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder={
              canChat
                ? "예: 올해 사업 확장 시 주의할 점이 궁금해요"
                : "사주 정보를 먼저 입력해 주세요"
            }
            disabled={!canChat || loading}
          />

          <button
            type="submit"
            disabled={
              !canChat ||
              loading ||
              !question.trim()
            }
          >
            {loading ? "답변 중..." : "보내기"}
          </button>
        </form>
      </section>

      <button
        type="button"
        className="resetButton"
        onClick={resetAll}
      >
        다른 정보로 새 상담 시작
      </button>

      <style jsx>{`
        .aiPage {
          width: min(980px, calc(100% - 32px));
          margin: 0 auto;
          padding: 68px 0 90px;
          color: #342f28;
        }

        .aiHero {
          max-width: 760px;
          margin: 0 auto 34px;
          text-align: center;
        }

        .eyebrow {
          display: block;
          margin-bottom: 11px;
          color: #a17a36;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2.2px;
        }

        .aiHero h1 {
          margin: 0;
          color: #28241f;
          font-size: 42px;
          line-height: 1.25;
        }

        .aiHero p {
          max-width: 700px;
          margin: 17px auto 0;
          color: #777066;
          font-size: 15px;
          line-height: 1.9;
          word-break: keep-all;
        }

        .sajuInputCard,
        .chatCard {
          padding: 30px;
          border: 1px solid #e2d8c8;
          border-radius: 22px;
          background: #fffdf9;
          box-shadow: 0 14px 38px rgba(66, 52, 30, 0.06);
        }

        .chatCard {
          margin-top: 28px;
        }

        .cardTitle {
          margin-bottom: 24px;
          text-align: center;
        }

        .cardTitle span,
        .chatHeader span,
        .sajuGuide span {
          display: block;
          color: #a17a36;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .cardTitle h2,
        .chatHeader h2 {
          margin: 7px 0 0;
          color: #302b24;
          font-size: 22px;
        }

        .formGrid {
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
          color: #625b50;
          font-size: 13px;
          font-weight: 800;
        }

        .field input,
        .field select {
          width: 100%;
          min-height: 48px;
          box-sizing: border-box;
          border: 1px solid #dcd2c3;
          border-radius: 10px;
          outline: none;
          background: #fff;
          padding: 0 13px;
          color: #39342d;
          font: inherit;
          font-size: 14px;
        }

        .field input:focus,
        .field select:focus {
          border-color: #b49358;
          box-shadow: 0 0 0 3px rgba(180, 147, 88, 0.1);
        }

        .birthPickerButton {
          display: flex;
          width: 100%;
          min-height: 48px;
          box-sizing: border-box;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #dcd2c3;
          border-radius: 10px;
          background: #fff;
          padding: 0 13px;
          color: #39342d;
          font: inherit;
          font-size: 14px;
          cursor: pointer;
        }

        .birthPicker {
          margin-top: 8px;
          padding: 14px;
          border: 1px solid #dcd2c3;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 10px 25px rgba(66, 52, 30, 0.1);
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
          border: 1px solid #ddd2c0;
          border-radius: 9px;
          background: #fffaf2;
          color: #8b682d;
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
          border: 1px solid #ddd2c0;
          border-radius: 8px;
          background: #fff;
          padding: 0 8px;
          color: #39342d;
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
          background: #9a722e;
          color: #fff;
          font-weight: 900;
        }

        .pickerBottom {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee4d5;
        }

        .pickerBottom button {
          min-height: 36px;
          padding: 0 15px;
          border: 1px solid #d9cbb3;
          border-radius: 8px;
          background: #fffaf2;
          color: #765b29;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .toggleGroup {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .toggleGroup button {
          min-height: 46px;
          border: 1px solid #dcd2c3;
          border-radius: 10px;
          background: #fff;
          color: #71695e;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .toggleGroup button.active {
          border-color: #9a722e;
          background: #9a722e;
          color: #fff;
        }

        .sajuGuide {
          margin-top: 24px;
          padding: 20px 22px;
          border-radius: 15px;
          background: #f5f0e7;
          text-align: center;
        }

        .sajuGuide strong {
          display: block;
          margin-top: 7px;
          color: #3d372f;
          font-size: 16px;
        }

        .sajuGuide p {
          max-width: 760px;
          margin: 8px auto 0;
          color: #777066;
          font-size: 13px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .chatHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .connectedBadge {
          flex: 0 0 auto;
          padding: 8px 12px;
          border-radius: 999px;
          background: #9a722e;
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }

        .lockedNotice {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 11px;
          background: #f5f0e7;
          color: #777066;
          font-size: 13px;
          line-height: 1.7;
          text-align: center;
        }

        .messages {
          display: grid;
          gap: 12px;
        }

        .bubble {
          max-width: 82%;
          padding: 15px 17px;
          border-radius: 14px;
        }

        .aiBubble {
          justify-self: start;
          border: 1px solid #e3d8c5;
          background: #fffaf2;
        }

        .userBubble {
          justify-self: end;
          background: #9a722e;
          color: #fff;
        }

        .bubble small {
          display: block;
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 900;
          opacity: 0.72;
        }

        .bubble p {
          margin: 0;
          font-size: 14px;
          line-height: 1.8;
          white-space: pre-wrap;
          word-break: keep-all;
        }

        .aiAnswerPlain {
          margin: 0;
          font-size: 14px;
          line-height: 1.85;
          white-space: pre-wrap;
          word-break: keep-all;
        }

        .aiAnswerStructured {
          display: grid;
          gap: 12px;
        }

        .aiAnswerIntro {
          padding: 13px 14px;
          border: 1px solid #eadfce;
          border-radius: 11px;
          background: #fffdf9;
        }

        .aiAnswerIntro p {
          margin: 0;
          color: #5f584e;
          font-size: 14px;
          line-height: 1.85;
        }

        .aiAnswerSection {
          overflow: hidden;
          border: 1px solid #e2d7c5;
          border-radius: 12px;
          background: #fffdf9;
        }

        .aiAnswerSectionHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 13px;
          border-bottom: 1px solid #eadfce;
          background:
            linear-gradient(
              135deg,
              #f4ead7 0%,
              #fffaf2 100%
            );
        }

        .aiAnswerSectionHeader > span {
          display: flex;
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #9a722e;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .aiAnswerSectionHeader strong {
          color: #4a4033;
          font-size: 13px;
          line-height: 1.4;
        }

        .aiAnswerSectionBody {
          display: grid;
          gap: 9px;
          padding: 13px 14px 15px;
        }

        .aiAnswerSectionBody > p {
          margin: 0;
          color: #5f584e;
          font-size: 14px;
          line-height: 1.85;
          word-break: keep-all;
        }

        .aiAnswerPoint {
          display: grid;
          grid-template-columns: 14px 1fr;
          gap: 7px;
          align-items: start;
          padding: 9px 10px;
          border-radius: 9px;
          background: #f7f2e9;
        }

        .aiAnswerPoint > span {
          color: #9a722e;
          font-size: 12px;
          font-weight: 900;
          line-height: 1.8;
        }

        .aiAnswerPoint > p {
          margin: 0;
          color: #5d564c;
          font-size: 13px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .quickQuestions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 20px;
        }

        .quickQuestions button {
          min-height: 46px;
          border: 1px solid #d8cdbc;
          border-radius: 11px;
          background: #fffdf8;
          color: #4b453c;
          padding: 9px 12px;
          font-size: 13px;
          line-height: 1.5;
          cursor: pointer;
        }

        .quickQuestions button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .chatInput {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          margin-top: 16px;
        }

        .chatInput input {
          min-width: 0;
          min-height: 50px;
          box-sizing: border-box;
          border: 1px solid #d8cdbc;
          border-radius: 11px;
          outline: none;
          padding: 0 14px;
          background: #fff;
          color: #39342d;
          font-size: 14px;
        }

        .chatInput button {
          min-width: 92px;
          border: 0;
          border-radius: 11px;
          background: #20251f;
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .chatInput button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .errorBox {
          margin-top: 16px;
          padding: 14px 16px;
          border: 1px solid #e7c7c0;
          border-radius: 11px;
          background: #fff5f2;
          color: #9a4939;
          font-size: 13px;
          line-height: 1.7;
        }

        .resetButton {
          display: block;
          width: 100%;
          min-height: 54px;
          margin-top: 20px;
          border: 1px solid #cdbd9e;
          border-radius: 11px;
          background: #fffaf0;
          color: #765b29;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        @media (max-width: 680px) {
          .aiPage {
            width: min(100% - 28px, 980px);
            padding: 42px 0 70px;
          }

          .aiHero h1 {
            font-size: 34px;
          }

          .aiHero p {
            font-size: 14px;
            line-height: 1.8;
          }

          .sajuInputCard,
          .chatCard {
            padding: 18px;
            border-radius: 17px;
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
          }

          .birthPicker {
            padding: 12px 9px;
          }

          .birthPickerHeader {
            grid-template-columns: 34px 1fr 34px;
            gap: 6px;
          }

          .birthPickerHeader > button {
            width: 34px;
            height: 38px;
          }

          .chatHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .bubble {
            max-width: 92%;
          }

          .quickQuestions {
            grid-template-columns: 1fr;
          }

          .chatInput {
            grid-template-columns: 1fr;
          }

          .chatInput button {
            min-height: 48px;
          }
        }
      `}</style>
      <style jsx global>{`
        .aiAnswerPlain {
          margin: 0;
          font-size: 14px;
          line-height: 1.85;
          white-space: pre-wrap;
          word-break: keep-all;
        }

        .aiAnswerStructured {
          display: grid;
          gap: 12px;
        }

        .aiAnswerIntro {
          padding: 13px 14px;
          border: 1px solid #eadfce;
          border-radius: 11px;
          background: #fffdf9;
        }

        .aiAnswerIntro p {
          margin: 0;
          color: #5f584e;
          font-size: 14px;
          line-height: 1.85;
        }

        .aiAnswerSection {
          overflow: hidden;
          border: 1px solid #e2d7c5;
          border-radius: 12px;
          background: #fffdf9;
        }

        .aiAnswerSectionHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 13px;
          border-bottom: 1px solid #eadfce;
          background:
            linear-gradient(
              135deg,
              #f4ead7 0%,
              #fffaf2 100%
            );
        }

        .aiAnswerSectionHeader > span {
          display: flex;
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #9a722e;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .aiAnswerSectionHeader strong {
          color: #4a4033;
          font-size: 13px;
          line-height: 1.4;
        }

        .aiAnswerSectionBody {
          display: grid;
          gap: 9px;
          padding: 13px 14px 15px;
        }

        .aiAnswerSectionBody > p {
          margin: 0;
          color: #5f584e;
          font-size: 14px;
          line-height: 1.85;
          word-break: keep-all;
        }

        .aiAnswerPoint {
          display: grid;
          grid-template-columns: 14px 1fr;
          gap: 7px;
          align-items: start;
          padding: 9px 10px;
          border-radius: 9px;
          background: #f7f2e9;
        }

        .aiAnswerPoint > span {
          color: #9a722e;
          font-size: 12px;
          font-weight: 900;
          line-height: 1.8;
        }

        .aiAnswerPoint > p {
          margin: 0;
          color: #5d564c;
          font-size: 13px;
          line-height: 1.8;
          word-break: keep-all;
        }
      `}</style>
    </main>
  );
}