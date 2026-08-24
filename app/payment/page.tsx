"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => any;
  }
}

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

      if (!clientKey) {
        alert("토스 클라이언트 키가 설정되지 않았습니다.");
        return;
      }

      if (!window.TossPayments) {
        alert("토스 결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 토스페이먼츠 V2 SDK 초기화
      const tossPayments = window.TossPayments(clientKey);

      // 비회원 결제
      const payment = tossPayments.payment({
        customerKey: "ANONYMOUS",
      });

      const orderId =
        "MYEONGUN-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 8);

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

      <main
        style={{
          minHeight: "100vh",
          background: "#f5f1e8",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
            padding: "45px 35px",
            textAlign: "center",
            boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "2px",
              color: "#a17a27",
              marginBottom: "15px",
            }}
          >
            MYEONGUN PREMIUM
          </div>

          <h1
            style={{
              fontSize: "30px",
              color: "#20251f",
              marginBottom: "18px",
            }}
          >
            명운 상세 사주 분석
          </h1>

          <p
            style={{
              color: "#666",
              lineHeight: 1.8,
              marginBottom: "25px",
            }}
          >
            나의 사주를 바탕으로
            <br />
            재물 · 사업 · 직업 · 인연 · 앞으로의 흐름을
            <br />
            더욱 자세하게 확인합니다.
          </p>

          <div
            style={{
              borderTop: "1px solid #e5ddcf",
              borderBottom: "1px solid #e5ddcf",
              padding: "22px 0",
              marginBottom: "25px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#777",
                marginBottom: "8px",
              }}
            >
              상세 사주 분석
            </div>

            <strong
              style={{
                fontSize: "30px",
                color: "#20251f",
              }}
            >
              9,900원
            </strong>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "10px",
              padding: "17px",
              background: "#20251f",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "결제창 준비 중..." : "9,900원 결제하기"}
          </button>

          <p
            style={{
              marginTop: "18px",
              fontSize: "12px",
              color: "#999",
            }}
          >
            현재 테스트 결제입니다.
          </p>
        </section>
      </main>
    </>
  );
}