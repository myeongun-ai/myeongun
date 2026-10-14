"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import Link from "next/link";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => any;
  }
}

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

const features = [
  {
    title: "나의 성향과 강점",
    text: "타고난 성향과 강점을 더 자세히 이해해 보세요.",
  },
  {
    title: "재물·사업·직업운",
    text: "돈과 일에 관한 운세의 흐름을 살펴보세요.",
  },
  {
    title: "인연과 앞으로의 흐름",
    text: "인간관계와 앞으로의 운세 방향을 확인하세요.",
  },
  {
    title: "AI 상담 포함",
    text: "결제 후 7일간 최대 20회 질문할 수 있습니다.",
  },
];

function readSavedSaju(): SajuForm | null {
  try {
    const saved = sessionStorage.getItem("myeongun_saju");
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    if (
      typeof parsed?.name !== "string" ||
      !parsed.name.trim() ||
      typeof parsed?.birth !== "string" ||
      !parsed.birth ||
      typeof parsed?.time !== "string" ||
      !parsed.time ||
      typeof parsed?.gender !== "string" ||
      !parsed.gender ||
      typeof parsed?.calendar !== "string" ||
      !parsed.calendar
    ) {
      return null;
    }

    return {
      name: parsed.name.trim(),
      birth: parsed.birth,
      time: parsed.time,
      gender: parsed.gender,
      calendar: parsed.calendar,
    };
  } catch {
    return null;
  }
}

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saju, setSaju] = useState<SajuForm | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setSaju(readSavedSaju());
    setSessionChecked(true);
  }, []);

  const handlePayment = async () => {
    if (!confirmed || loading) return;
    setErrorMessage("");

    const parsedSaju = readSavedSaju();

    if (!parsedSaju) {
      setSaju(null);
      setConfirmed(false);
      setErrorMessage(
        "사주 정보를 확인할 수 없습니다. 먼저 무료 사주를 분석해 주세요."
      );
      return;
    }

    setSaju(parsedSaju);

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      setErrorMessage(
        "현재 결제를 준비할 수 없습니다. 잠시 후 다시 시도해 주세요."
      );
      return;
    }

    if (!window.TossPayments) {
      setErrorMessage(
        "결제창을 불러오지 못했습니다. 페이지를 새로고침한 후 다시 시도해 주세요."
      );
      return;
    }

    setLoading(true);

    try {
      const tossPayments = window.TossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: "ANONYMOUS",
      });

      const orderId =
        "MYEONGUN-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 8);

      const prepareResponse = await fetch("/api/payment/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          saju: parsedSaju,
        }),
      });

      const prepareResult = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(
          prepareResult?.message ||
            "결제 준비 정보를 저장하지 못했습니다."
        );
      }

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: 9900,
        },
        orderId,
        orderName: "명운 상세 사주 분석",
        customerName: "명운 고객",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (
        code === "USER_CANCEL" ||
        code === "PAY_PROCESS_CANCELED"
      ) {
        return;
      }

      setErrorMessage(
        "결제창을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  const canPay =
    sessionChecked &&
    !!saju &&
    scriptReady &&
    !scriptError &&
    confirmed &&
    !loading;

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v2/standard"
        strategy="afterInteractive"
        onReady={() => {
          setScriptReady(true);
          setScriptError(false);
        }}
        onError={() => {
          setScriptReady(false);
          setScriptError(true);
        }}
      />

      <main className="paymentPage">
        <section className="paymentCard">
          <header className="pageHeader">
            <div className="eyebrow">MYEONGUN PREMIUM</div>
            <h1>명운 상세 사주 분석</h1>
            <p>
              무료 분석에서 궁금했던 나의 일과 돈,
              인연과 앞으로의 흐름을 더 자세히 살펴보세요.
            </p>
            <div className="heroPrice">
              <strong>9,900원</strong>
              <span>1회 결제</span>
            </div>
            <div className="heroBenefit">
              개인별 상세 사주 분석 + AI 상담 7일간 최대 20회
            </div>
          </header>

          <div className="steps" aria-label="이용 순서">
            <span>① 무료 결과 확인</span>
            <span className="active" aria-current="step">
              ② 이용 조건·결제
            </span>
            <span>③ 상세 분석 확인</span>
          </div>

          <section className="targetBox" aria-label="분석 대상 정보">
            <h2>분석 대상 확인</h2>
            {!sessionChecked ? (
              <p>사주 정보를 확인하고 있습니다.</p>
            ) : saju ? (
              <>
                <div className="targetName">{saju.name}님</div>
                <dl className="targetDetails">
                  <div>
                    <dt>생년월일</dt>
                    <dd>{saju.birth} · {saju.calendar}</dd>
                  </div>
                  <div>
                    <dt>출생시간</dt>
                    <dd>{saju.time}</dd>
                  </div>
                  <div>
                    <dt>성별</dt>
                    <dd>{saju.gender}</dd>
                  </div>
                </dl>
                <Link href="/saju" className="textLink">
                  사주 정보 다시 입력하기 →
                </Link>
              </>
            ) : (
              <>
                <p>
                  먼저 사주 정보를 입력하고 무료 분석을 확인해 주세요.
                </p>
                <Link href="/saju" className="textLink">
                  무료 사주 분석하러 가기 →
                </Link>
              </>
            )}
          </section>

          <section className="benefitSection">
            <h2>상세 사주에 포함된 내용</h2>

            <div className="featureList">
              {features.map((feature) => (
                <div className="feature" key={feature.title}>
                  <span className="check" aria-hidden="true">✓</span>
                  <strong className="featureTitle">
                    {feature.title}
                  </strong>
                  <p className="featureDescription">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="comparison">
            <div className="compareBox">
              <strong>무료 사주</strong>
              <p>기본 성향 및 운세 방향</p>
              <p>AI 상담 3회</p>
              <b>0원</b>
            </div>
            <div className="compareBox premium">
              <strong>상세 사주</strong>
              <p>더 깊은 개인별 사주 분석</p>
              <p>AI 상담 7일간 최대 20회</p>
              <b>9,900원</b>
            </div>
          </div>

          <section className="notice">
            <h2>결제 전 꼭 확인해 주세요</h2>
            <p>
              <strong>① 이용기간과 AI 상담</strong>
              상세 사주 결제 권한 유효기간은 7일이며,
              해당 기간 동안 AI 상담을 최대 20회 이용할 수 있습니다.
            </p>
            <p>
              <strong>② 이용코드 보관</strong>
              결제 후 발급되는 이용코드는 상세 사주 재열람에
              필요합니다. 반드시 별도로 저장하고 보관해 주세요.
            </p>
            <p>
              <strong>③ 이용코드 분실</strong>
              명운에서는 개인정보 보호를 위해 분실한 이용코드를
              확인하거나 재발급해 드리지 못할 수 있습니다.
              이용코드 분실에 따른 이용 제한 및 환불 관련 사항은{" "}
              <Link href="/refund">환불정책</Link>을 확인해 주세요.
            </p>
            <p>
              <strong>④ 분석 안내</strong>
              사주 분석은 전통 명리학을 바탕으로 제공하는
              참고용 콘텐츠이며, 미래의 결과를 보장하지 않습니다.
            </p>
          </section>

          <div className="priceSection">
            <span>명운 상세 사주 분석 · 1회 결제</span>
            <strong>9,900원</strong>
            <small>AI 상담 7일간 최대 20회 포함</small>
          </div>

          <label className="agreement">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={!saju || loading}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              상세 사주 제공 내용, 7일 이용기간, AI 상담 최대 20회,
              이용코드 보관 안내 및 환불정책을 확인했습니다.
            </span>
          </label>

          {errorMessage && (
            <p className="errorMessage" role="alert">{errorMessage}</p>
          )}

          {scriptError && (
            <p className="errorMessage" role="alert">
              결제창을 불러오지 못했습니다.
              페이지를 새로고침한 후 다시 시도해 주세요.
            </p>
          )}

          <button
            type="button"
            onClick={handlePayment}
            disabled={!canPay}
            className="payButton"
          >
            {loading ? "결제창 준비 중..." : "9,900원 결제하기 →"}
          </button>

          <p className="buttonGuide" aria-live="polite">
            {!sessionChecked
              ? "사주 정보를 확인하고 있습니다."
              : !saju
                ? "무료 사주 분석 후 결제할 수 있습니다."
                : scriptError
                  ? "새로고침 후 결제를 다시 시도해 주세요."
                  : !scriptReady
                    ? "결제 서비스를 불러오고 있습니다."
                    : !confirmed
                      ? "위 안내 확인란에 체크하면 결제 버튼이 활성화됩니다."
                      : "토스 결제창에서 결제를 진행합니다."}
          </p>

          <div className="policyLinks">
            <Link href="/refund">환불정책</Link>
          </div>
          <Link href="/saju" className="backLink">
            무료 사주 페이지로 돌아가기
          </Link>
        </section>
      </main>

      <style jsx>{`
        .paymentPage {
          min-height: 100vh;
          padding: 58px 20px 80px;
          background:
            radial-gradient(circle at 50% 0%, rgba(225,185,105,.15), transparent 32%),
            linear-gradient(180deg, #f7f2e8, #fbf8f1 58%, #f5efe4);
          color: #17243a;
        }
        .paymentCard {
          box-sizing: border-box;
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 42px 36px;
          border: 1px solid #dfd4c2;
          border-radius: 24px;
          background: #fffdf8;
          box-shadow: 0 20px 50px rgba(31,39,53,.08);
        }
        .pageHeader { text-align: center; }
        .eyebrow {
          margin-bottom: 14px;
          color: #a17a27;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
        }
        h1 {
          margin: 0 0 14px;
          font-size: 32px;
          line-height: 1.35;
          letter-spacing: -.04em;
        }
        .pageHeader p {
          max-width: 520px;
          margin: 0 auto;
          color: #786f64;
          font-size: 15px;
          line-height: 1.8;
          word-break: keep-all;
        }
        .heroPrice {
          display: flex;
          justify-content: center;
          align-items: baseline;
          gap: 10px;
          margin-top: 23px;
        }
        .heroPrice strong {
          font-size: 40px;
          letter-spacing: -.04em;
        }
        .heroPrice span { color: #786f64; font-size: 13px; }
        .heroBenefit {
          margin-top: 8px;
          color: #8b651f;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.7;
          word-break: keep-all;
        }
        .steps {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 8px;
          margin: 28px 0 24px;
        }
        .steps span {
          padding: 12px 5px;
          border: 1px solid #e5dccd;
          border-radius: 10px;
          background: #f8f5ef;
          color: #81776a;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.5;
          text-align: center;
        }
        .steps .active {
          border-color: #c99535;
          background: #f6ead4;
          color: #805719;
        }
        h2 { margin: 0 0 17px; font-size: 17px; }
        .targetBox {
          margin-bottom: 22px;
          padding: 23px;
          border: 1px solid #e4d9c8;
          border-radius: 14px;
          background: #f8f5ef;
        }
        .targetBox > p {
          margin: 0 0 12px;
          color: #786f64;
          font-size: 13px;
          line-height: 1.7;
        }
        .targetName { font-size: 21px; font-weight: 900; }
        .targetDetails {
          display: grid;
          gap: 9px;
          margin: 14px 0;
          font-size: 13px;
          line-height: 1.6;
        }
        .targetDetails > div {
          display: grid;
          grid-template-columns: 76px minmax(0,1fr);
          gap: 10px;
        }
        .targetDetails dt { color: #786f64; }
        .targetDetails dd { margin: 0; overflow-wrap: anywhere; }
        .targetBox :global(.textLink) {
          color: #805719;
          font-size: 12px;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .benefitSection {
          padding: 26px;
          border: 1px solid #eadfc9;
          border-radius: 14px;
          background: #fffaf0;
          margin-bottom: 20px;
        }
        .benefitSection h2 {
          margin: 0 0 24px;
          line-height: 1.6;
        }
        .featureList {
          display: grid;
          gap: 18px;
        }
        .feature {
          display: grid;
          grid-template-columns: 20px 190px minmax(0,1fr);
          align-items: center;
          column-gap: 18px;
          box-sizing: border-box;
          min-height: 108px;
          padding: 24px;
          border-radius: 12px;
          background: #f3efe7;
        }
        .check {
          color: #a4772c;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.6;
          text-align: center;
        }
        .featureTitle {
          margin: 0;
          color: #17243a;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.7;
          word-break: keep-all;
        }
        .featureDescription {
          margin: 0;
          color: #786f64;
          font-size: 12px;
          line-height: 1.85;
          word-break: keep-all;
          overflow-wrap: anywhere;
        }
        .comparison {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 12px;
          margin-bottom: 22px;
        }
        .compareBox {
          display: flex;
          flex-direction: column;
          padding: 20px 16px;
          border: 1px solid #e7e1d6;
          border-radius: 14px;
          background: #f6f5f1;
        }
        .compareBox.premium {
          border-color: #d3ad6a;
          background: #fff1d6;
        }
        .compareBox strong { margin-bottom: 13px; font-size: 16px; }
        .compareBox p {
          margin: 0 0 9px;
          color: #625d54;
          font-size: 12px;
          line-height: 1.6;
        }
        .compareBox b {
          margin-top: auto;
          padding-top: 10px;
          font-size: 24px;
        }
        .notice {
          padding: 23px;
          border: 1px solid #e8dcc9;
          border-radius: 14px;
          background: #f8f4ec;
        }
        .notice p {
          margin: 0 0 18px;
          color: #605d55;
          font-size: 13px;
          line-height: 1.85;
          word-break: keep-all;
        }
        .notice p:last-child { margin-bottom: 0; }
        .notice strong {
          display: block;
          margin-bottom: 4px;
          color: #17243a;
        }
        .notice :global(a) {
          color: #805719;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .priceSection {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 25px 0 23px;
          padding: 24px 0;
          border-top: 1px solid #e5ddcf;
          border-bottom: 1px solid #e5ddcf;
          text-align: center;
        }
        .priceSection span { color: #786f64; font-size: 13px; }
        .priceSection strong { font-size: 36px; }
        .priceSection small { color: #8b651f; font-size: 12px; }
        .agreement {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-bottom: 20px;
          color: #4c4b43;
          font-size: 13px;
          line-height: 1.7;
          cursor: pointer;
        }
        .agreement input {
          width: 19px;
          height: 19px;
          margin-top: 2px;
          flex-shrink: 0;
          accent-color: #a4772c;
        }
        .errorMessage {
          margin: 0 0 15px;
          padding: 12px;
          border-radius: 10px;
          background: #fff0ed;
          color: #a43d32;
          font-size: 13px;
          line-height: 1.7;
        }
        .payButton {
          width: 100%;
          min-height: 62px;
          padding: 16px;
          border: 1px solid #8f6018;
          border-radius: 14px;
          background: linear-gradient(135deg,#9f6d1e,#c99434 48%,#a36f1e);
          color: #fff;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 26px rgba(133,88,18,.22);
        }
        .payButton:disabled {
          border-color: #d8c7a7;
          background: #e8dcc6;
          color: #746651;
          box-shadow: none;
          cursor: not-allowed;
        }
        .payButton:focus-visible {
          outline: 3px solid #17243a;
          outline-offset: 4px;
        }
        .buttonGuide {
          margin: 12px 0 0;
          color: #786f64;
          font-size: 12px;
          line-height: 1.7;
          text-align: center;
        }
        .policyLinks { margin-top: 20px; text-align: center; }
        .policyLinks :global(a) {
          color: #86642e;
          font-size: 13px;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .paymentCard :global(.backLink) {
          display: block;
          margin-top: 22px;
          color: #786f64;
          font-size: 12px;
          text-align: center;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        @media (max-width: 700px) {
          .feature {
            grid-template-columns: 20px 150px minmax(0,1fr);
            column-gap: 12px;
            padding: 22px 18px;
          }
        }
        @media (max-width: 600px) {
          .paymentPage { padding: 30px 12px 58px; }
          .paymentCard { padding: 30px 18px; border-radius: 20px; }
          h1 { font-size: 27px; }
          .pageHeader p { font-size: 14px; }
          .heroPrice strong { font-size: 35px; }
          .heroBenefit { font-size: 12px; }
          .steps { gap: 5px; }
          .steps span { font-size: 11px; padding: 11px 4px; }
          .targetBox, .notice { padding: 18px; }
          .benefitSection { padding: 22px 16px; }
          .featureList { gap: 14px; }
          .feature {
            grid-template-columns: 20px minmax(0,1fr);
            column-gap: 12px;
            row-gap: 12px;
            min-height: 108px;
            padding: 22px 16px;
          }
          .featureDescription { grid-column: 2; }
          .comparison { gap: 8px; }
          .compareBox { padding: 17px 12px; }
          .compareBox b { font-size: 22px; }
        }
      `}</style>
    </>
  );
}