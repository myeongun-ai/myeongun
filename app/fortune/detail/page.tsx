"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

type PremiumSection = {
  title: string;
  summary: string;
  points: string[];
  advice: string;
};

type PremiumResult = {
  headline: string;
  overview: string;
  strengths: string[];
  cautions: string[];
  opportunity: string;
  sections: PremiumSection[];
  actionPlan: string[];
  disclaimer: string;
};

type StrengthInfo = { level: string; score: number; reason: string; };
type YongshinInfo = { yongshin: string; heesin: string; reason: string; };

type CachedPremium = {
  saju: SajuForm;
  result: PremiumResult;
  strength?: StrengthInfo;
  yongshin?: YongshinInfo;
};

function sameSaju(a: SajuForm, b: SajuForm) {
  return (
    a.name === b.name &&
    a.birth === b.birth &&
    a.time === b.time &&
    a.gender === b.gender &&
    a.calendar === b.calendar
  );
}

const sectionMeta = [
  { label: "PERSONALITY", short: "성향" },
  { label: "WEALTH", short: "재물" },
  { label: "BUSINESS", short: "사업" },
  { label: "CAREER", short: "직업" },
  { label: "RELATIONSHIP", short: "관계" },
  { label: "WELLNESS", short: "생활" },
  { label: "2026 FLOW", short: "2026" },
  { label: "LONG TERM", short: "장기" },
];

export default function FortuneDetailPage() {
  const router = useRouter();

  const [saju, setSaju] = useState<SajuForm | null>(null);
  const [result, setResult] = useState<PremiumResult | null>(null);
  const [strength, setStrength] = useState<StrengthInfo | null>(null);
  const [yongshin, setYongshin] = useState<YongshinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPremiumResult() {
      try {
        const active =
          sessionStorage.getItem("myeongun_session_active") === "1";

        if (!active) {
          router.replace("/payment/reopen");
          return;
        }

        const saved = localStorage.getItem("myeongun_saju");

        if (!saved) {
          router.replace("/saju");
          return;
        }

        const parsedSaju = JSON.parse(saved) as SajuForm;

        const accessResponse = await fetch("/api/payment/access", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            saju: parsedSaju,
          }),
        });

        if (!accessResponse.ok) {
          router.replace("/payment");
          return;
        }

        const accessData = await accessResponse.json();

        if (!accessData?.paid) {
          router.replace("/payment");
          return;
        }

        if (cancelled) return;

        setSaju(parsedSaju);

        try {
          const cachedText = localStorage.getItem("myeongun_premium_result");

          if (cachedText) {
            const cached = JSON.parse(cachedText) as CachedPremium;

            if (
              cached?.saju &&
              cached?.result &&
              cached?.strength &&
              cached?.yongshin &&
              sameSaju(cached.saju, parsedSaju)
            ) {
              setResult(cached.result);
              setStrength(cached.strength || null);
              setYongshin(cached.yongshin || null);
              setLoading(false);
              return;
            }
          }
        } catch {
          localStorage.removeItem("myeongun_premium_result");
        }

        const detailResponse = await fetch("/api/fortune/detail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            saju: parsedSaju,
          }),
        });

        const detailData = await detailResponse.json();

        if (!detailResponse.ok || !detailData?.result) {
          throw new Error(
            detailData?.error || "상세 사주 분석을 불러오지 못했습니다."
          );
        }

        if (cancelled) return;

        setResult(detailData.result);
        setStrength(detailData.strength || null);
        setYongshin(detailData.yongshin || null);

        localStorage.setItem(
          "myeongun_premium_result",
          JSON.stringify({
            saju: parsedSaju,
            result: detailData.result,
            strength: detailData.strength || null,
            yongshin: detailData.yongshin || null,
          })
        );
      } catch (err) {
        console.error("상세 사주 로딩 오류:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "상세 사주 분석 중 오류가 발생했습니다."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPremiumResult();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const topSections = useMemo(() => {
    if (!result) return [];
    return result.sections.slice(0, 8);
  }, [result]);

  if (loading) {
    return (
      <main className="loadingPage">
        <section className="loadingCard">
          <div className="loadingSeal">命</div>
          <div className="loadingEyebrow">MYEONGUN PREMIUM REPORT</div>
          <h1>상세 사주를 준비하고 있습니다</h1>
          <p>
            결제 이용권과 사주 정보를 확인한 뒤
            <br />
            개인별 프리미엄 분석을 불러오고 있습니다.
          </p>

          <div className="loadingBar">
            <span />
          </div>
        </section>

        <style jsx>{`
          .loadingPage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 30px 20px;
            background:
              radial-gradient(
                circle at top,
                rgba(177, 137, 64, 0.12),
                transparent 34%
              ),
              #f4f0e7;
            color: #3d4039;
          }

          .loadingCard {
            width: 100%;
            max-width: 560px;
            padding: 52px 30px;
            text-align: center;
          }

          .loadingSeal {
            display: grid;
            place-items: center;
            width: 66px;
            height: 66px;
            margin: 0 auto 22px;
            border: 1px solid #b6924e;
            border-radius: 50%;
            color: #8e6b2f;
            font-family: Georgia, serif;
            font-size: 28px;
          }

          .loadingEyebrow {
            color: #a6803b;
            font-size: 10px;
            letter-spacing: 3px;
            font-weight: 800;
          }

          h1 {
            margin: 16px 0 13px;
            color: #22261f;
            font-size: 30px;
            font-weight: 650;
            line-height: 1.4;
          }

          p {
            margin: 0;
            color: #76736b;
            font-size: 13px;
            line-height: 1.95;
          }

          .loadingBar {
            width: 180px;
            height: 2px;
            margin: 30px auto 0;
            overflow: hidden;
            background: #ded6c7;
          }

          .loadingBar span {
            display: block;
            width: 45%;
            height: 100%;
            background: #a9823c;
            animation: loadingMove 1.4s ease-in-out infinite;
          }

          @keyframes loadingMove {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(300%);
            }
          }
        `}</style>
      </main>
    );
  }

  if (error || !saju || !result) {
    return (
      <main className="errorPage">
        <section className="errorCard">
          <div className="errorSeal">命</div>
          <div className="errorEyebrow">MYEONGUN PREMIUM</div>
          <h1>상세 사주를 불러오지 못했습니다</h1>
          <p>{error || "잠시 후 다시 시도해주세요."}</p>

          <button type="button" onClick={() => window.location.reload()}>
            다시 시도하기
          </button>
        </section>

        <style jsx>{`
          .errorPage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 30px 20px;
            background: #f4f0e7;
          }

          .errorCard {
            width: 100%;
            max-width: 520px;
            padding: 46px 30px;
            border: 1px solid #ded4c2;
            border-radius: 24px;
            background: #fffdf8;
            text-align: center;
            box-shadow: 0 18px 50px rgba(47, 42, 32, 0.06);
          }

          .errorSeal {
            display: grid;
            place-items: center;
            width: 58px;
            height: 58px;
            margin: 0 auto 18px;
            border: 1px solid #b6924e;
            border-radius: 50%;
            color: #8f6a2d;
            font-family: Georgia, serif;
            font-size: 24px;
          }

          .errorEyebrow {
            color: #a77f38;
            font-size: 10px;
            letter-spacing: 3px;
            font-weight: 800;
          }

          h1 {
            margin: 15px 0 12px;
            color: #23271f;
            font-size: 26px;
          }

          p {
            margin: 0;
            color: #77736b;
            line-height: 1.8;
            font-size: 13px;
          }

          button {
            margin-top: 24px;
            padding: 14px 28px;
            border: 0;
            border-radius: 12px;
            background: #242920;
            color: #fff;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  const name = saju.name || "고객";

  return (
    <main className="detailPage">
      <div className="topPattern" />

      <div className="detailWrap">
        <header className="reportHeader">
          <div className="brandLine">
            <span />
            <strong>MYEONGUN PREMIUM REPORT</strong>
            <span />
          </div>

          <div className="headerSeal">命</div>

          <p className="reportType">프리미엄 상세 사주 리포트</p>

          <h1>
            {name}님의
            <br />
            <em>삶의 흐름과 방향</em>
          </h1>

          <p className="headline">{result.headline}</p>

          <div className="reportMeta">
            <div>
              <span>NAME</span>
              <strong>{name}</strong>
            </div>
            <div>
              <span>BIRTH</span>
              <strong>{saju.birth}</strong>
            </div>
            <div>
              <span>TIME</span>
              <strong>{saju.time}</strong>
            </div>
            <div>
              <span>TYPE</span>
              <strong>
                {saju.gender} · {saju.calendar}
              </strong>
            </div>
          </div>
        </header>

        {(strength || yongshin) && (
          <section style={{ marginBottom: "26px", padding: "24px", borderRadius: "18px", border: "1px solid rgba(199,161,89,0.25)", background: "rgba(199,161,89,0.07)" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", color: "#b88b43" }}>명운 핵심 오행 요약</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginTop: "16px" }}>
              {strength && <div style={{ padding: "15px", borderRadius: "12px", background: "rgba(255,255,255,0.7)" }}><span style={{ display: "block", fontSize: "12px", color: "#777" }}>신강·신약</span><strong style={{ display: "block", marginTop: "5px", fontSize: "20px", color: "#2e2a24" }}>{strength.level} {strength.score}점</strong></div>}
              {yongshin && <div style={{ padding: "15px", borderRadius: "12px", background: "rgba(255,255,255,0.7)" }}><span style={{ display: "block", fontSize: "12px", color: "#777" }}>용신</span><strong style={{ display: "block", marginTop: "5px", fontSize: "20px", color: "#2e2a24" }}>{yongshin.yongshin}</strong></div>}
              {yongshin && <div style={{ padding: "15px", borderRadius: "12px", background: "rgba(255,255,255,0.7)" }}><span style={{ display: "block", fontSize: "12px", color: "#777" }}>희신</span><strong style={{ display: "block", marginTop: "5px", fontSize: "20px", color: "#2e2a24" }}>{yongshin.heesin}</strong></div>}
            </div>
            {strength && <p style={{ margin: "14px 0 0", fontSize: "12px", lineHeight: 1.7, color: "#6f685f" }}>{strength.reason}</p>}
            {yongshin && <p style={{ margin: "7px 0 0", fontSize: "12px", lineHeight: 1.7, color: "#6f685f" }}>{yongshin.reason}</p>}
            <p style={{ margin: "8px 0 0", fontSize: "11px", lineHeight: 1.6, color: "#999" }}>※ 신강·신약과 용신·희신은 명운 엔진의 참고용 분석값입니다.</p>
          </section>
        )}
        <section className="introPanel">
          <div className="introHead">
            <div>
              <span className="microLabel">01 · DESTINY OVERVIEW</span>
              <h2>전체 흐름 요약</h2>
            </div>
            <div className="verticalMark">名運</div>
          </div>

          <p className="overviewText">{result.overview}</p>

          <div className="insightGrid">
            <article className="insightCard">
              <span className="insightIndex">A</span>
              <div>
                <strong>활용하기 좋은 강점</strong>
                <ul>
                  {result.strengths.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="insightCard">
              <span className="insightIndex">B</span>
              <div>
                <strong>주의하고 보완할 점</strong>
                <ul>
                  {result.cautions.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          </div>

          <div className="opportunityBox">
            <div className="opportunityTitle">
              <span>KEY OPPORTUNITY</span>
              <strong>앞으로 활용할 핵심 기회</strong>
            </div>
            <p>{result.opportunity}</p>
          </div>
        </section>

        <section className="reportIndex">
          <div className="indexTitle">
            <span>REPORT INDEX</span>
            <h2>상세 분석 목차</h2>
          </div>

          <div className="indexGrid">
            {topSections.map((section, index) => (
              <a
                href={`#premium-section-${index}`}
                key={`${section.title}-${index}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{sectionMeta[index]?.label || "ANALYSIS"}</small>
                  <strong>{section.title}</strong>
                </div>
                <b>→</b>
              </a>
            ))}
          </div>
        </section>

        <div className="sectionList">
          {result.sections.map((section, index) => (
            <article
              className="analysisCard"
              id={`premium-section-${index}`}
              key={`${section.title}-${index}`}
            >
              <div className="analysisSide">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <small>{sectionMeta[index]?.label || "ANALYSIS"}</small>
              </div>

              <div className="analysisMain">
                <div className="analysisTitle">
                  <span>{sectionMeta[index]?.short || "분석"}</span>
                  <h2>{section.title}</h2>
                </div>

                <p className="analysisSummary">{section.summary}</p>

                <div className="keyPointTitle">
                  <span>KEY POINTS</span>
                  <div />
                </div>

                <div className="pointGrid">
                  {section.points.map((point, pointIndex) => (
                    <div key={`${point}-${pointIndex}`}>
                      <span>{String(pointIndex + 1).padStart(2, "0")}</span>
                      <p>{point}</p>
                    </div>
                  ))}
                </div>

                <div className="adviceBox">
                  <div className="adviceMark">名</div>
                  <div>
                    <strong>명운의 조언</strong>
                    <p>{section.advice}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="actionSection">
          <div className="actionHead">
            <span>MYEONGUN ACTION PLAN</span>
            <h2>{name}님을 위한 실천 방향</h2>
            <p>
              좋은 흐름은 기다리는 것보다 준비하고 활용할 때 더 의미가
              있습니다.
            </p>
          </div>

          <div className="actionList">
            {result.actionPlan.map((item, index) => (
              <div key={`${item}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="closingSection">
          <div className="closingSeal">命</div>
          <span>MYEONGUN · PREMIUM SAJU</span>
          <h2>운을 아는 것은 방향을 준비하는 일입니다.</h2>
          <p>
            사주 해석은 가능성과 흐름을 살펴보는 하나의 관점입니다.
            <br />
            현실의 선택과 경험을 함께 살피며 자신에게 맞는 방향을 만들어
            가세요.
          </p>
        </section>

        <div className="notice">
          <strong>안내</strong>
          <p>{result.disclaimer}</p>
        </div>

        <div className="bottomActions">
          <Link href="/saju" className="secondaryButton">
            새 사주 입력하기
          </Link>

          <Link href="/" className="primaryButton">
            명운 홈으로
          </Link>
        </div>

        <footer className="reportFooter">
          MYEONGUN PREMIUM · PERSONAL FORTUNE REPORT
        </footer>
      </div>

      <style jsx>{`
        .detailPage {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          padding: 0 20px 100px;
          background:
            radial-gradient(
              circle at 15% 3%,
              rgba(182, 144, 73, 0.11),
              transparent 25%
            ),
            radial-gradient(
              circle at 90% 28%,
              rgba(50, 59, 43, 0.055),
              transparent 22%
            ),
            #f3efe6;
          color: #474942;
        }

        .topPattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 5px;
          background: linear-gradient(
            90deg,
            #252b22,
            #b38a42,
            #d4b873,
            #b38a42,
            #252b22
          );
        }

        .detailWrap {
          position: relative;
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
        }

        .reportHeader {
          padding: 76px 20px 48px;
          text-align: center;
        }

        .brandLine {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .brandLine span {
          width: 58px;
          height: 1px;
          background: #c5ad7a;
        }

        .brandLine strong {
          color: #957033;
          font-size: 9px;
          letter-spacing: 3.5px;
          font-weight: 800;
        }

        .headerSeal {
          display: grid;
          place-items: center;
          width: 76px;
          height: 76px;
          margin: 29px auto 20px;
          border: 1px solid #ad8642;
          border-radius: 50%;
          color: #8d692d;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 31px;
          box-shadow: inset 0 0 0 7px rgba(174, 133, 63, 0.05);
        }

        .reportType {
          margin: 0;
          color: #8d887e;
          font-size: 12px;
          letter-spacing: 1.5px;
        }

        .reportHeader h1 {
          margin: 13px 0 20px;
          color: #20251e;
          font-size: clamp(36px, 6vw, 56px);
          line-height: 1.27;
          font-weight: 500;
          letter-spacing: -1.5px;
        }

        .reportHeader h1 em {
          color: #8d682c;
          font-family: Georgia, "Times New Roman", serif;
          font-style: normal;
          font-weight: 500;
        }

        .headline {
          max-width: 720px;
          margin: 0 auto;
          color: #716e66;
          font-size: 15px;
          line-height: 1.95;
          word-break: keep-all;
        }

        .reportMeta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin-top: 40px;
          border-top: 1px solid #d6cdbd;
          border-bottom: 1px solid #d6cdbd;
        }

        .reportMeta div {
          padding: 19px 13px;
          border-right: 1px solid #d6cdbd;
        }

        .reportMeta div:last-child {
          border-right: 0;
        }

        .reportMeta span {
          display: block;
          margin-bottom: 7px;
          color: #a18b62;
          font-size: 8px;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .reportMeta strong {
          display: block;
          color: #3d4139;
          font-size: 13px;
          font-weight: 650;
        }

        .introPanel,
        .reportIndex,
        .analysisCard {
          border: 1px solid #ddd3c1;
          background: rgba(255, 253, 248, 0.9);
          box-shadow: 0 18px 50px rgba(55, 46, 31, 0.035);
        }

        .introPanel {
          padding: 42px;
          border-radius: 26px;
        }

        .introHead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .microLabel {
          color: #a07b39;
          font-size: 9px;
          letter-spacing: 2.5px;
          font-weight: 800;
        }

        .introHead h2,
        .indexTitle h2 {
          margin: 9px 0 0;
          color: #242921;
          font-size: 28px;
          font-weight: 650;
          letter-spacing: -0.7px;
        }

        .verticalMark {
          color: #c5b594;
          font-family: Georgia, serif;
          font-size: 15px;
          letter-spacing: 5px;
          writing-mode: vertical-rl;
        }

        .overviewText {
          margin: 28px 0 0;
          color: #5c5b55;
          font-size: 14px;
          line-height: 2.15;
          white-space: pre-line;
          word-break: keep-all;
        }

        .insightGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-top: 31px;
        }

        .insightCard {
          display: flex;
          gap: 16px;
          padding: 23px;
          border-radius: 17px;
          background: #f5f0e6;
        }

        .insightIndex {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 31px;
          height: 31px;
          border: 1px solid #c8ab72;
          border-radius: 50%;
          color: #987134;
          font-family: Georgia, serif;
          font-size: 12px;
        }

        .insightCard strong {
          display: block;
          margin: 5px 0 13px;
          color: #78602e;
          font-size: 12px;
        }

        .insightCard ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .insightCard li {
          position: relative;
          margin-bottom: 8px;
          padding-left: 14px;
          color: #5a5954;
          font-size: 12px;
          line-height: 1.7;
        }

        .insightCard li::before {
          content: "·";
          position: absolute;
          left: 0;
          color: #a9823c;
          font-weight: 900;
        }

        .opportunityBox {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 26px;
          margin-top: 15px;
          padding: 25px 27px;
          border-radius: 17px;
          background: #252b22;
        }

        .opportunityTitle span {
          display: block;
          margin-bottom: 8px;
          color: #cda95e;
          font-size: 8px;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .opportunityTitle strong {
          color: #fff;
          font-size: 13px;
        }

        .opportunityBox p {
          margin: 0;
          color: #e2e0d9;
          font-size: 12px;
          line-height: 1.9;
          word-break: keep-all;
        }

        .reportIndex {
          margin-top: 22px;
          padding: 36px 40px 40px;
          border-radius: 24px;
        }

        .indexTitle span {
          color: #a07b39;
          font-size: 9px;
          letter-spacing: 2.5px;
          font-weight: 800;
        }

        .indexGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 9px;
          margin-top: 25px;
        }

        .indexGrid a {
          display: grid;
          grid-template-columns: 38px 1fr 20px;
          align-items: center;
          gap: 13px;
          padding: 17px;
          border: 1px solid #e1d9cb;
          border-radius: 13px;
          background: #faf7f0;
          color: inherit;
          text-decoration: none;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .indexGrid a:hover {
          transform: translateY(-2px);
          border-color: #b89a61;
        }

        .indexGrid > a > span {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #eee4d1;
          color: #896528;
          font-size: 10px;
          font-weight: 800;
        }

        .indexGrid small {
          display: block;
          margin-bottom: 4px;
          color: #a28d65;
          font-size: 7px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .indexGrid strong {
          color: #343830;
          font-size: 12px;
        }

        .indexGrid b {
          color: #a27e3d;
          font-size: 14px;
          font-weight: 400;
        }

        .sectionList {
          display: grid;
          gap: 22px;
          margin-top: 22px;
        }

        .analysisCard {
          display: grid;
          grid-template-columns: 120px 1fr;
          scroll-margin-top: 20px;
          border-radius: 26px;
          overflow: hidden;
        }

        .analysisSide {
          padding: 38px 25px;
          background: #293027;
          color: #fff;
        }

        .analysisSide > span {
          display: block;
          color: #d2ae65;
          font-family: Georgia, serif;
          font-size: 34px;
        }

        .analysisSide small {
          display: block;
          margin-top: 13px;
          color: #aaa99f;
          font-size: 7px;
          line-height: 1.7;
          letter-spacing: 1.8px;
          word-break: break-word;
        }

        .analysisMain {
          padding: 38px 40px 40px;
        }

        .analysisTitle span {
          display: inline-block;
          margin-bottom: 8px;
          color: #997231;
          font-size: 10px;
          font-weight: 800;
        }

        .analysisTitle h2 {
          margin: 0;
          color: #232820;
          font-size: 27px;
          line-height: 1.4;
          font-weight: 650;
          letter-spacing: -0.6px;
        }

        .analysisSummary {
          margin: 22px 0 0;
          color: #5b5a54;
          font-size: 14px;
          line-height: 2.05;
          white-space: pre-line;
          word-break: keep-all;
        }

        .keyPointTitle {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 30px;
        }

        .keyPointTitle span {
          flex: 0 0 auto;
          color: #a17b38;
          font-size: 8px;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .keyPointTitle div {
          width: 100%;
          height: 1px;
          background: #e0d7c8;
        }

        .pointGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 17px;
        }

        .pointGrid div {
          display: flex;
          gap: 12px;
          padding: 17px;
          border-radius: 13px;
          background: #f6f2e9;
        }

        .pointGrid span {
          flex: 0 0 auto;
          color: #9d7738;
          font-family: Georgia, serif;
          font-size: 10px;
        }

        .pointGrid p {
          margin: 0;
          color: #56564f;
          font-size: 12px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .adviceBox {
          display: flex;
          gap: 18px;
          margin-top: 19px;
          padding: 22px;
          border: 1px solid #d9cdb7;
          border-radius: 14px;
          background: #fffaf0;
        }

        .adviceMark {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 36px;
          height: 36px;
          border: 1px solid #b99758;
          border-radius: 50%;
          color: #946e2f;
          font-family: Georgia, serif;
          font-size: 14px;
        }

        .adviceBox strong {
          color: #815f28;
          font-size: 11px;
        }

        .adviceBox p {
          margin: 7px 0 0;
          color: #5e5b54;
          font-size: 12px;
          line-height: 1.9;
          white-space: pre-line;
          word-break: keep-all;
        }

        .actionSection {
          margin-top: 30px;
          padding: 48px 44px;
          border-radius: 27px;
          background:
            radial-gradient(
              circle at 90% 0,
              rgba(215, 179, 105, 0.12),
              transparent 30%
            ),
            #232a21;
          color: #fff;
          box-shadow: 0 18px 50px rgba(33, 37, 29, 0.12);
        }

        .actionHead {
          text-align: center;
        }

        .actionHead > span {
          color: #d1ac60;
          font-size: 9px;
          letter-spacing: 3px;
          font-weight: 800;
        }

        .actionHead h2 {
          margin: 11px 0 10px;
          font-size: 29px;
          font-weight: 550;
        }

        .actionHead p {
          margin: 0;
          color: #bfc1b8;
          font-size: 12px;
          line-height: 1.8;
        }

        .actionList {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 30px;
        }

        .actionList div {
          display: flex;
          gap: 14px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.045);
        }

        .actionList span {
          flex: 0 0 auto;
          color: #d8b56b;
          font-family: Georgia, serif;
          font-size: 11px;
        }

        .actionList p {
          margin: 0;
          color: #e5e6e0;
          font-size: 12px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .actionList div:last-child:nth-child(odd) {
          grid-column: 1 / -1;
        }

        .closingSection {
          padding: 54px 20px 45px;
          text-align: center;
        }

        .closingSeal {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          margin: 0 auto 18px;
          border: 1px solid #b5914e;
          border-radius: 50%;
          color: #8c682d;
          font-family: Georgia, serif;
          font-size: 22px;
        }

        .closingSection > span {
          color: #a68243;
          font-size: 8px;
          letter-spacing: 2.5px;
          font-weight: 800;
        }

        .closingSection h2 {
          margin: 12px 0;
          color: #2b3028;
          font-size: 24px;
          font-weight: 550;
        }

        .closingSection p {
          margin: 0;
          color: #79756d;
          font-size: 12px;
          line-height: 1.9;
        }

        .notice {
          padding: 17px 20px;
          border: 1px solid #ded5c6;
          border-radius: 13px;
          background: rgba(239, 233, 222, 0.75);
        }

        .notice strong {
          display: block;
          margin-bottom: 5px;
          color: #7c6c50;
          font-size: 10px;
        }

        .notice p {
          margin: 0;
          color: #878278;
          font-size: 10px;
          line-height: 1.75;
        }

        .bottomActions {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 28px;
        }

        .bottomActions :global(a) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 160px;
          padding: 15px 24px;
          border-radius: 11px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 750;
        }

        .bottomActions :global(.secondaryButton) {
          border: 1px solid #b8ab94;
          background: transparent;
          color: #474b43;
        }

        .bottomActions :global(.primaryButton) {
          border: 1px solid #252b22;
          background: #252b22;
          color: #fff;
        }

        .reportFooter {
          margin-top: 36px;
          text-align: center;
          color: #aaa294;
          font-size: 8px;
          letter-spacing: 2px;
        }

        @media (max-width: 760px) {
          .detailPage {
            padding: 0 14px 70px;
          }

          .reportHeader {
            padding: 58px 5px 36px;
          }

          .brandLine span {
            width: 25px;
          }

          .brandLine strong {
            font-size: 7px;
            letter-spacing: 2.2px;
          }

          .headerSeal {
            width: 65px;
            height: 65px;
            margin-top: 24px;
            font-size: 27px;
          }

          .reportHeader h1 {
            font-size: 36px;
          }

          .headline {
            font-size: 13px;
          }

          .reportMeta {
            grid-template-columns: repeat(2, 1fr);
          }

          .reportMeta div:nth-child(2) {
            border-right: 0;
          }

          .reportMeta div:nth-child(1),
          .reportMeta div:nth-child(2) {
            border-bottom: 1px solid #d6cdbd;
          }

          .introPanel {
            padding: 29px 22px;
            border-radius: 20px;
          }

          .introHead h2,
          .indexTitle h2 {
            font-size: 23px;
          }

          .overviewText {
            font-size: 13px;
          }

          .insightGrid,
          .indexGrid,
          .pointGrid,
          .actionList {
            grid-template-columns: 1fr;
          }

          .opportunityBox {
            grid-template-columns: 1fr;
            gap: 13px;
          }

          .reportIndex {
            padding: 29px 21px;
            border-radius: 20px;
          }

          .analysisCard {
            grid-template-columns: 1fr;
            border-radius: 20px;
          }

          .analysisSide {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 17px 22px;
          }

          .analysisSide > span {
            font-size: 25px;
          }

          .analysisSide small {
            max-width: 160px;
            margin-top: 0;
            text-align: right;
          }

          .analysisMain {
            padding: 28px 22px 29px;
          }

          .analysisTitle h2 {
            font-size: 24px;
          }

          .analysisSummary {
            font-size: 13px;
          }

          .actionSection {
            padding: 38px 21px;
            border-radius: 21px;
          }

          .actionHead h2 {
            font-size: 24px;
          }

          .actionList div:last-child:nth-child(odd) {
            grid-column: auto;
          }
        }

        @media (max-width: 450px) {
          .reportHeader h1 {
            font-size: 32px;
          }

          .reportMeta strong {
            font-size: 12px;
          }

          .insightCard {
            padding: 19px;
          }

          .indexGrid a {
            grid-template-columns: 35px 1fr 16px;
            padding: 14px;
          }

          .adviceBox {
            gap: 13px;
            padding: 18px;
          }

          .bottomActions {
            flex-direction: column;
          }

          .bottomActions :global(a) {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>
    </main>
  );
}