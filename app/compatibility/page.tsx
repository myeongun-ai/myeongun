"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

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
    setError("");
  }

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAnalyze || loading) return;

    setLoading(true);
    setError("");
    setResult("");
    setPeople(null);

    try {
      const response = await fetch("/api/fortune/compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        throw new Error(
          data?.error || "궁합 분석 중 오류가 발생했습니다."
        );
      }

      const resultText = String(data?.result || "").trim();

      if (!resultText) {
        throw new Error("궁합 분석 결과가 비어 있습니다.");
      }

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

              <label className="field full">
                <span>생년월일</span>
                <input
                  type="date"
                  value={me.birth}
                  onChange={(e) => updateMe("birth", e.target.value)}
                />
              </label>

              <label className="field">
                <span>출생시간</span>
                <input
                  type="time"
                  value={me.time}
                  onChange={(e) => updateMe("time", e.target.value)}
                />
              </label>

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

              <label className="field full">
                <span>생년월일</span>
                <input
                  type="date"
                  value={partner.birth}
                  onChange={(e) =>
                    updatePartner("birth", e.target.value)
                  }
                />
              </label>

              <label className="field">
                <span>출생시간</span>
                <input
                  type="time"
                  value={partner.time}
                  onChange={(e) =>
                    updatePartner("time", e.target.value)
                  }
                />
              </label>

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

        {error && <div className="errorBox">{error}</div>}

        <button
          type="submit"
          className="analyzeButton"
          disabled={!canAnalyze || loading}
        >
          {loading ? "두 사람의 궁합을 분석하고 있습니다..." : "궁합 분석 시작"}
        </button>

        <p className="privacyText">
          입력한 정보는 궁합 분석을 위한 요청에 사용됩니다.
        </p>
      </form>

      {result && (
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
            {renderCompatibilityResult(result)}
          </div>

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

      <div className="homeLinkWrap">
        <Link href="/" className="homeLink">
          홈으로
        </Link>
      </div>

      <style jsx>{`
        .compatPage {
          width: min(1120px, calc(100% - 32px));
          margin: 0 auto;
          padding: 68px 0 90px;
          color: #342f28;
        }

        .compatHero {
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

        .compatHero h1 {
          margin: 0;
          color: #28241f;
          font-size: 42px;
          line-height: 1.25;
        }

        .compatHero p {
          max-width: 680px;
          margin: 17px auto 0;
          color: #777066;
          font-size: 15px;
          line-height: 1.9;
          word-break: keep-all;
        }

        .compatForm {
          padding: 30px;
          border: 1px solid #e2d8c8;
          border-radius: 22px;
          background: #fffdf9;
          box-shadow: 0 14px 38px rgba(66, 52, 30, 0.06);
        }

        .personGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr);
          align-items: stretch;
          gap: 18px;
        }

        .personCard {
          padding: 26px;
          border: 1px solid #e3d8c5;
          border-radius: 18px;
          background: #fffaf2;
        }

        .personCardHeader {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid #e8ddcb;
        }

        .personNumber {
          display: flex;
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #9a722e;
          color: #fff;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .personLabel {
          display: block;
          margin-bottom: 3px;
          color: #a17a36;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .personCardHeader h2 {
          margin: 0;
          color: #302b24;
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
          border: 1px solid #ddccb0;
          border-radius: 50%;
          background: #fff;
          color: #9a722e;
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

        .analysisGuide {
          margin-top: 24px;
          padding: 20px 22px;
          border-radius: 15px;
          background: #f5f0e7;
          text-align: center;
        }

        .analysisGuide span {
          display: block;
          color: #a17a36;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .analysisGuide strong {
          display: block;
          margin-top: 7px;
          color: #3d372f;
          font-size: 16px;
        }

        .analysisGuide p {
          max-width: 760px;
          margin: 8px auto 0;
          color: #777066;
          font-size: 13px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .analyzeButton {
          display: block;
          width: 100%;
          min-height: 58px;
          margin-top: 22px;
          border: 0;
          border-radius: 12px;
          background: #9a722e;
          color: #fff;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .analyzeButton:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #876324;
        }

        .analyzeButton:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .privacyText {
          margin: 10px 0 0;
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
          color: #a17a36;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .resultTitle h2 {
          margin: 8px 0 0;
          color: #2f2a24;
          font-size: 28px;
        }

        .resultTitle p {
          margin: 10px 0 0;
          color: #81796e;
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
          background: #fffaf2;
        }

        .summaryCard > span {
          color: #a17a36;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .summaryCard > strong {
          display: block;
          margin-top: 6px;
          color: #302b24;
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
          border-top: 1px solid #ebe2d5;
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
          color: #b38a46;
          font-size: 26px;
          text-align: center;
        }

        .noticeBox {
          margin-top: 26px;
          padding: 18px;
          border-radius: 14px;
          background: #f5f0e7;
          color: #777066;
          font-size: 12px;
          line-height: 1.8;
          text-align: center;
        }

        .resetButton {
          display: block;
          width: 100%;
          min-height: 54px;
          margin-top: 18px;
          border: 1px solid #cdbd9e;
          border-radius: 11px;
          background: #fffaf0;
          color: #765b29;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .homeLinkWrap {
          margin-top: 28px;
          text-align: center;
        }

        .homeLink {
          color: #82672f;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
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
          .compatPage {
            width: min(100% - 28px, 1120px);
            padding: 42px 0 70px;
          }

          .compatHero {
            margin-bottom: 24px;
          }

          .compatHero h1 {
            font-size: 34px;
          }

          .compatHero p {
            font-size: 14px;
            line-height: 1.8;
          }

          .compatForm {
            padding: 18px;
            border-radius: 17px;
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
        .premiumCompatibilityResult {
          display: grid;
          gap: 22px;
        }

        .compatIntroCard {
          padding: 24px 26px;
          border: 1px solid #e3d8c5;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              rgba(183, 143, 72, 0.09),
              rgba(255, 253, 249, 0.8)
            );
        }

        .compatIntroMark {
          display: block;
          margin-bottom: 10px;
          color: #9a722e;
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
          border: 1px solid #d8c8ab;
          border-radius: 18px;
          background: #fffdf9;
          box-shadow: 0 12px 30px rgba(79, 61, 31, 0.08);
        }

        .compatAnalysisHeader {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 24px 19px;
          border-bottom: 1px solid #dcc9a9;
          background:
            linear-gradient(
              135deg,
              #f2e6cf 0%,
              #fffaf2 100%
            );
        }

        .compatSectionNumber,
        .compatSummaryMark {
          display: flex;
          width: 54px;
          height: 54px;
          flex: 0 0 54px;
          align-items: center;
          justify-content: center;
          border: 1px solid #9a722e;
          border-radius: 50%;
          background: #9a722e;
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
          color: #a17a36;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .compatSectionTitleWrap h3 {
          margin: 0;
          color: #302b24;
          font-size: 20px;
          line-height: 1.45;
        }

        .compatAnalysisContent {
          padding: 22px 26px 25px;
          background: #fffdf9;
        }

        .compatParagraph {
          margin: 0 0 13px;
          color: #625b50;
          font-size: 15px;
          line-height: 1.95;
          word-break: keep-all;
        }

        .compatParagraph:last-child {
          margin-bottom: 0;
        }

        .compatHeadingSmall {
          margin: 20px 0 10px;
          color: #6f5527;
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
          color: #a77d36;
          font-size: 11px;
          font-weight: 900;
        }

        .compatAnalysisCard:last-child {
          border: 2px solid #c5a66d;
        }

        .compatAnalysisCard:last-child .compatAnalysisHeader {
          background:
            linear-gradient(
              135deg,
              #ead7ae,
              #fff8e8
            );
        }

        @media (max-width: 680px) {
          .premiumCompatibilityResult {
            gap: 16px;
          }

          .compatIntroCard {
            padding: 20px 18px;
            border-radius: 14px;
          }

          .compatSectionGrid {
            gap: 18px;
          }

          .compatAnalysisCard {
            border-radius: 15px;
          }

          .compatAnalysisHeader {
            align-items: flex-start;
            gap: 12px;
            padding: 18px 16px 16px;
          }

          .compatSectionNumber,
          .compatSummaryMark {
            width: 44px;
            height: 44px;
            flex-basis: 44px;
            font-size: 14px;
          }

          .compatSummaryMark {
            font-size: 17px;
          }

          .compatSectionTitleWrap h3 {
            font-size: 18px;
          }

          .compatAnalysisContent {
            padding: 18px 16px 20px;
          }

          .compatParagraph {
            font-size: 14px;
            line-height: 1.9;
            word-break: normal;
          }

          .compatResultList li {
            padding: 12px 13px 12px 35px;
            font-size: 13px;
          }

          .compatResultList li::before {
            top: 12px;
            left: 13px;
          }
        }
      `}</style>
    </main>
  );
}