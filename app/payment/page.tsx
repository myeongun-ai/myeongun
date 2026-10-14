
"use client";

import Script from "next/script";
import { useState } from "react";
import Link from "next/link";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => any;
  }
}

const features = [
  "나의 타고난 성향과 강점 상세 분석",
  "재물운 · 사업운 · 직업운",
  "인연 · 인간관계 · 앞으로의 흐름",
  "상세 사주 결제 후 AI 상담 7일간 최대 20회",
];

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handlePayment = async () => {
    if (!confirmed || loading) return;

    try {
      const savedSaju = sessionStorage.getItem("myeongun_saju");

      if (!savedSaju) {
        alert("먼저 사주 정보를 입력해주세요.");
        window.location.href = "/saju";
        return;
      }

      let parsedSaju: any;

      try {
        parsedSaju = JSON.parse(savedSaju);

        if (
          !parsedSaju?.name ||
          !parsedSaju?.birth ||
          !parsedSaju?.time
        ) {
          alert("먼저 사주 정보를 입력해주세요.");
          window.location.href = "/saju";
          return;
        }
      } catch {
        alert("먼저 사주 정보를 입력해주세요.");
        window.location.href = "/saju";
        return;
      }

      setLoading(true);

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

      if (!clientKey) {
        alert("토스 클라이언트 키가 설정되지 않았습니다.");
        return;
      }

      if (!window.TossPayments) {
        alert(
          "토스 결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요."
        );
        return;
      }

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
    } catch (error: any) {
      console.error(error);

      if (
        error?.code === "USER_CANCEL" ||
        error?.code === "PAY_PROCESS_CANCELED"
      ) {
        return;
      }

      alert("결제를 진행할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v2/standard"
        strategy="afterInteractive"
      />

      <main className="payment-page">
        <section className="payment-card">
          <div className="eyebrow">MYEONGUN PREMIUM</div>

          <h1>명운 상세 사주 분석</h1>

          <p className="intro">
            무료 사주에서 확인한 나의 성향과 운세를
            <br />
            더욱 자세히 살펴보세요.
          </p>

          <div className="benefit-section">
            <h2>상세 사주에서 확인할 수 있는 내용</h2>

            <div className="feature-list">
              {features.map((feature) => (
                <div className="feature" key={feature}>
                  <span className="check">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="comparison">
            <div className="compare-box">
              <strong>무료 사주</strong>
              <p>기본 성향 및 운세 방향</p>
              <p>AI 상담 3회</p>
              <b>0원</b>
            </div>

            <div className="compare-box premium">
              <strong>상세 사주</strong>
              <p>더 깊은 개인별 사주 분석</p>
              <p>AI 상담 7일간 최대 20회</p>
              <b>9,900원</b>
            </div>
          </div>

          <div className="notice">
            <h2>결제 전 꼭 확인해 주세요</h2>

            <p>
              <strong>① AI 상담 이용</strong>
              <br />
              상세 사주 결제 권한 유효기간은 7일이며,
              해당 기간 동안 AI 상담을 최대 20회 이용할 수 있습니다.
            </p>

            <p>
              <strong>② 이용코드 보관</strong>
              <br />
              결제 후 발급되는 이용코드는 상세 사주 재열람에
              필요합니다. 반드시 별도로 저장하고 보관해 주세요.
            </p>

            <p>
              <strong>③ 이용코드 분실</strong>
              <br />
              명운에서는 개인정보 보호를 위해 분실한
              이용코드를 확인하거나 재발급해 드리지 못할 수 있습니다.
              이용코드 분실에 따른 이용 제한 및 환불 관련 사항은
              환불정책을 확인해 주세요.
            </p>

            <p>
              <strong>④ 분석 안내</strong>
              <br />
              사주 분석은 전통 명리학을 바탕으로 제공하는
              참고용 콘텐츠이며, 미래의 결과를 보장하지 않습니다.
            </p>
          </div>

          <div className="price-section">
            <span>명운 프리미엄 상세 사주 분석</span>
            <strong>9,900원</strong>
            <small>1회 결제</small>
          </div>

          <label className="agreement">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) =>
                setConfirmed(event.target.checked)
              }
            />
            <span>
              상세 사주 제공 내용, AI 상담 이용기간,
              이용코드 보관 안내 및 환불정책을 확인했습니다.
            </span>
          </label>

          <button
            type="button"
            onClick={handlePayment}
            disabled={loading || !confirmed}
            className="pay-button"
          >
            {loading
              ? "결제창 준비 중..."
              : "9,900원 결제하기"}
          </button>

          <div className="policy-links">
            <Link href="/refund">환불정책</Link>
            <span>·</span>
            <Link href="/privacy">개인정보처리방침</Link>
          </div>

          <p className="bottom-note">
            결제 전 서비스 내용과 이용 조건을
            충분히 확인해 주세요.
          </p>
        </section>
      </main>

      <style jsx>{`
        .payment-page {
          min-height: 100vh;
          background: #f5f1e8;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 70px 20px;
        }

        .payment-card {
          width: 100%;
          max-width: 650px;
          background: #fffdf8;
          border: 1px solid #e0d4c0;
          border-radius: 22px;
          padding: 42px 36px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
        }

        .eyebrow {
          text-align: center;
          font-size: 12px;
          letter-spacing: 2px;
          color: #a17a27;
          margin-bottom: 14px;
        }

        h1 {
          text-align: center;
          font-size: 30px;
          color: #20251f;
          margin: 0 0 15px;
        }

        .intro {
          text-align: center;
          color: #666;
          font-size: 15px;
          line-height: 1.9;
          margin-bottom: 30px;
        }

        h2 {
          font-size: 16px;
          color: #263029;
          margin: 0 0 18px;
        }

        .benefit-section {
          padding: 24px;
          border: 1px solid #eadfc9;
          border-radius: 14px;
          background: #fffaf0;
          margin-bottom: 20px;
        }

        .feature-list {
          display: grid;
          gap: 13px;
        }

        .feature {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          font-size: 14px;
          color: #4c4b43;
          line-height: 1.6;
        }

        .check {
          color: #a4772c;
          font-weight: 800;
        }

        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 22px;
        }

        .compare-box {
          background: #f6f5f1;
          border: 1px solid #e7e1d6;
          border-radius: 14px;
          padding: 20px 15px;
          display: flex;
          flex-direction: column;
          min-height: 170px;
        }

        .compare-box.premium {
          background: #fff1d6;
          border-color: #e3c18b;
        }

        .compare-box strong {
          font-size: 15px;
          color: #253026;
          margin-bottom: 13px;
        }

        .compare-box p {
          font-size: 12px;
          color: #625d54;
          margin: 0 0 9px;
          line-height: 1.5;
        }

        .compare-box b {
          font-size: 22px;
          margin-top: auto;
          color: #252d26;
        }

        .notice {
          background: #f8f4ec;
          border: 1px solid #e8dcc9;
          border-radius: 14px;
          padding: 23px;
          margin-bottom: 25px;
        }

        .notice p {
          font-size: 13px;
          color: #605d55;
          line-height: 1.85;
          margin: 0 0 17px;
        }

        .notice p:last-child {
          margin-bottom: 0;
        }

        .notice strong {
          color: #3e4138;
        }

        .price-section {
          border-top: 1px solid #e5ddcf;
          border-bottom: 1px solid #e5ddcf;
          padding: 24px 0;
          margin-bottom: 23px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .price-section span {
          font-size: 13px;
          color: #777;
        }

        .price-section strong {
          font-size: 34px;
          color: #20251f;
        }

        .price-section small {
          color: #777;
        }

        .agreement {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: #4c4b43;
          line-height: 1.6;
          margin-bottom: 20px;
          cursor: pointer;
        }

        .agreement input {
          width: 17px;
          height: 17px;
          margin-top: 2px;
          flex-shrink: 0;
          accent-color: #a4772c;
        }

        .pay-button {
          width: 100%;
          border: none;
          border-radius: 10px;
          padding: 18px;
          background: #20251f;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .pay-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .policy-links {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 22px;
          font-size: 13px;
        }

        .policy-links a {
          color: #86642e;
          text-decoration: underline;
        }

        .bottom-note {
          text-align: center;
          font-size: 12px;
          color: #888;
          margin-top: 15px;
        }

        @media (max-width: 600px) {
          .payment-page {
            padding: 30px 12px;
          }

          .payment-card {
            padding: 30px 18px;
            border-radius: 16px;
          }

          h1 {
            font-size: 25px;
          }

          .benefit-section,
          .notice {
            padding: 18px;
          }

          .comparison {
            gap: 8px;
          }

          .compare-box {
            padding: 15px 11px;
          }

          .compare-box b {
            font-size: 19px;
          }
        }
      `}</style>
    </>
  );
}
