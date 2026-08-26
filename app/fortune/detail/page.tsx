"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type CachedPremium = {
  saju: SajuForm;
  result: PremiumResult;
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

export default function FortuneDetailPage() {
  const router = useRouter();

  const [saju, setSaju] = useState<SajuForm | null>(null);
  const [result, setResult] = useState<PremiumResult | null>(null);
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

            if (cached?.saju && cached?.result && sameSaju(cached.saju, parsedSaju)) {
              setResult(cached.result);
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

        localStorage.setItem(
          "myeongun_premium_result",
          JSON.stringify({
            saju: parsedSaju,
            result: detailData.result,
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

  if (loading) {
    return (
      <main className="loadingPage">
        <div>
          <span>MYEONGUN PREMIUM</span>
          <h1>상세 사주를 분석하고 있습니다</h1>
          <p>
            결제 이용권과 사주 정보를 확인한 뒤
            <br />
            개인별 프리미엄 분석을 준비하고 있습니다.
          </p>
        </div>

        <style jsx>{`
          .loadingPage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 30px;
            background: #f5f1e8;
            text-align: center;
            color: #77746d;
          }

          span {
            color: #b08a3e;
            font-size: 11px;
            letter-spacing: 3px;
            font-weight: 700;
          }

          h1 {
            margin: 16px 0 12px;
            color: #20251f;
            font-size: 28px;
          }

          p {
            margin: 0;
            line-height: 1.9;
            font-size: 13px;
          }
        `}</style>
      </main>
    );
  }

  if (error || !saju || !result) {
    return (
      <main className="errorPage">
        <section>
          <span>MYEONGUN PREMIUM</span>
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
            background: #f5f1e8;
          }

          section {
            width: 100%;
            max-width: 520px;
            padding: 38px 30px;
            border: 1px solid #ddd3c2;
            border-radius: 20px;
            background: #fffdf8;
            text-align: center;
          }

          span {
            color: #b08a3e;
            font-size: 11px;
            letter-spacing: 3px;
            font-weight: 700;
          }

          h1 {
            margin: 15px 0 12px;
            color: #20251f;
          }

          p {
            color: #777;
            line-height: 1.8;
          }

          button {
            margin-top: 18px;
            padding: 13px 24px;
            border: 0;
            border-radius: 10px;
            background: #20251f;
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
      <div className="detailWrap">
        <header className="pageHeader">
          <div className="eyebrow">MYEONGUN PREMIUM</div>
          <h1>{name}님의 상세 사주 분석</h1>
          <p>{result.headline}</p>
        </header>

        <section className="sajuInfo">
          <div className="infoEyebrow">YOUR SAJU</div>
          <h2>{name}님의 사주 정보</h2>

          <div className="infoGrid">
            <div>
              <span>생년월일</span>
              <strong>{saju.birth}</strong>
            </div>
            <div>
              <span>출생시간</span>
              <strong>{saju.time}</strong>
            </div>
            <div>
              <span>성별</span>
              <strong>{saju.gender}</strong>
            </div>
            <div>
              <span>달력 기준</span>
              <strong>{saju.calendar}</strong>
            </div>
          </div>
        </section>

        <section className="summaryCard">
          <div className="sectionEyebrow">MYEONGUN SUMMARY</div>
          <h2>{name}님의 종합 사주 흐름</h2>
          <p>{result.overview}</p>

          <div className="summaryGrid">
            <div>
              <strong>강점</strong>
              <span>{result.strengths.join(" · ")}</span>
            </div>
            <div>
              <strong>주의할 점</strong>
              <span>{result.cautions.join(" · ")}</span>
            </div>
            <div className="wide" style={{ gridColumn: "1 / -1", width: "100%", boxSizing: "border-box", justifySelf: "stretch" }}>
              <strong>핵심 기회</strong>
              <span>{result.opportunity}</span>
            </div>
          </div>
        </section>

        <div className="sectionList">
          {result.sections.map((section, index) => (
            <article className="contentCard" key={`${section.title}-${index}`}>
              <div className="cardTitle">
                <span className="cardNumber">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{section.title}</h2>
              </div>

              <p className="intro">{section.summary}</p>

              <div className="divider" />

              <ul>
                {section.points.map((point, pointIndex) => (
                  <li key={`${point}-${pointIndex}`}>{point}</li>
                ))}
              </ul>

              <div className="adviceBox">
                <strong>명운의 조언</strong>
                <p>{section.advice}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="finalAdvice">
          <div className="finalEyebrow">MYEONGUN ACTION PLAN</div>
          <h2>{name}님을 위한 실천 방향</h2>

          <div className="actionGrid">
            {result.actionPlan.map((item, index) => (
              <div key={`${item}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="notice">{result.disclaimer}</div>

        <div className="backButton">
          <Link href="/saju">새 사주 입력하기</Link>
        </div>
      </div>

      <style jsx>{`
        .detailPage {
          min-height: 100vh;
          background: #f5f1e8;
          padding: 70px 20px 100px;
          color: #3e403b;
        }

        .detailWrap {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
        }

        .pageHeader {
          text-align: center;
          margin-bottom: 42px;
        }

        .eyebrow,
        .infoEyebrow,
        .sectionEyebrow,
        .finalEyebrow {
          color: #b08a3e;
          font-size: 11px;
          letter-spacing: 3px;
          font-weight: 700;
        }

        .pageHeader h1 {
          margin: 14px 0 14px;
          color: #20251f;
          font-size: 40px;
          line-height: 1.35;
          font-weight: 600;
        }

        .pageHeader p {
          max-width: 700px;
          margin: 0 auto;
          color: #77746d;
          font-size: 15px;
          line-height: 1.9;
        }

        .sajuInfo {
          margin-bottom: 22px;
          padding: 30px 34px;
          border-radius: 20px;
          background: #20251f;
          color: #fff;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
        }

        .sajuInfo h2 {
          margin: 12px 0 22px;
          font-size: 24px;
          font-weight: 600;
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .infoGrid div {
          padding: 14px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }

        .infoGrid span {
          display: block;
          color: #c9c9c5;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .infoGrid strong {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
        }

        .summaryCard,
        .contentCard {
          background: #fffdf8;
          border: 1px solid #ddd3c2;
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.035);
        }

        .summaryCard {
          padding: 36px;
          margin-bottom: 20px;
        }

        .summaryCard h2 {
          margin: 10px 0 16px;
          color: #20251f;
          font-size: 26px;
        }

        .summaryCard > p {
          margin: 0;
          color: #62605b;
          font-size: 14px;
          line-height: 2;
          white-space: pre-line;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 26px;
        }

        .summaryGrid div {
          padding: 17px;
          border-radius: 12px;
          background: #f7f2e8;
        }

        .summaryGrid .wide {
          grid-column: 1 / -1;
        }

        .summaryGrid strong {
          display: block;
          margin-bottom: 8px;
          color: #806126;
          font-size: 12px;
        }

        .summaryGrid span {
          color: #555;
          font-size: 13px;
          line-height: 1.75;
        }

        .sectionList {
          display: grid;
          gap: 20px;
        }

        .contentCard {
          padding: 33px 36px;
        }

        .cardTitle {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cardNumber {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #efe4cd;
          color: #8b6829;
          font-size: 11px;
          font-weight: 800;
        }

        .cardTitle h2 {
          margin: 0;
          color: #20251f;
          font-size: 23px;
          font-weight: 600;
        }

        .intro {
          margin: 18px 0 0;
          color: #62605b;
          font-size: 14px;
          line-height: 2;
          white-space: pre-line;
        }

        .divider {
          height: 1px;
          margin: 23px 0;
          background: #e5ddcf;
        }

        .contentCard ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .contentCard li {
          position: relative;
          padding-left: 20px;
          margin-bottom: 12px;
          color: #555;
          font-size: 14px;
          line-height: 1.85;
        }

        .contentCard li::before {
          content: "•";
          position: absolute;
          left: 2px;
          color: #b08a3e;
          font-weight: 800;
        }

        .adviceBox {
          margin-top: 24px;
          padding: 19px 20px;
          border-radius: 12px;
          background: #f7f2e8;
        }

        .adviceBox strong {
          color: #806126;
          font-size: 12px;
        }

        .adviceBox p {
          margin: 8px 0 0;
          color: #5f5d58;
          font-size: 13px;
          line-height: 1.85;
          white-space: pre-line;
        }

        .finalAdvice {
          margin-top: 30px;
          padding: 42px 35px;
          border-radius: 20px;
          background: #20251f;
          color: #fff;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
        }

        .finalAdvice h2 {
          margin: 12px 0 25px;
          text-align: center;
          font-size: 27px;
          font-weight: 600;
        }

        .finalEyebrow {
          text-align: center;
        }

        .actionGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .actionGrid div {
          padding: 18px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
        }

        .actionGrid span {
          color: #d0aa58;
          font-size: 11px;
          font-weight: 700;
        }

        .actionGrid p {
          margin: 8px 0 0;
          color: #e7e7e3;
          font-size: 13px;
          line-height: 1.75;
        }

        .notice {
          margin-top: 18px;
          padding: 16px 18px;
          border-radius: 10px;
          background: #eee8dc;
          color: #89847a;
          font-size: 11px;
          line-height: 1.75;
        }

        .backButton {
          margin-top: 30px;
          text-align: center;
        }

        .backButton a {
          display: inline-block;
          padding: 15px 42px;
          border-radius: 10px;
          background: #20251f;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        @media (max-width: 700px) {
          .detailPage {
            padding: 45px 14px 70px;
          }

          .pageHeader h1 {
            font-size: 29px;
          }

          .sajuInfo,
          .summaryCard,
          .contentCard,
          .finalAdvice {
            padding: 25px 20px;
            border-radius: 16px;
          }

          .infoGrid,
          .summaryGrid,
          .actionGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .summaryGrid .wide {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 450px) {
          .pageHeader h1 {
            font-size: 26px;
          }

          .infoGrid,
          .summaryGrid,
          .actionGrid {
            grid-template-columns: 1fr;
          }

          .summaryGrid .wide {
            grid-column: auto;
          }

          .cardTitle h2 {
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  );
}
