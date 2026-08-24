"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    document.cookie = "myeongun_paid=true; Path=/; Max-Age=86400; SameSite=Lax";
  }, []);

  const orderId = searchParams.get("orderId") || "";
  const paymentKey = searchParams.get("paymentKey") || "";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f1e8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "#fffdf8",
          border: "1px solid #ddd3c2",
          borderRadius: "22px",
          padding: "55px 45px",
          textAlign: "center",
          boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            letterSpacing: "2px",
            color: "#a77a27",
            marginBottom: "15px",
          }}
        >
          MYEONGUN PREMIUM
        </div>

        <div
          style={{
            width: "76px",
            height: "76px",
            margin: "0 auto 25px",
            borderRadius: "50%",
            background: "#e3ead7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "42px",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            margin: "0 0 18px",
            fontSize: "30px",
            color: "#20251f",
          }}
        >
          결제가 완료되었습니다
        </h1>

        <p
          style={{
            margin: 0,
            color: "#777",
            lineHeight: 1.8,
            fontSize: "14px",
          }}
        >
          상세 사주 분석 이용권이 정상적으로 확인되었습니다.
          <br />
          아래 버튼을 눌러 상세 사주 결과를 확인해 주세요.
        </p>

        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            borderRadius: "14px",
            background: "#f7f2e8",
            textAlign: "left",
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <span style={{ color: "#888", fontSize: "12px" }}>
              주문번호
            </span>
            <strong
              style={{
                display: "block",
                marginTop: "5px",
                color: "#20251f",
                fontSize: "14px",
                wordBreak: "break-all",
              }}
            >
              {orderId || "MYEONGUN-PREMIUM"}
            </strong>
          </div>

          {paymentKey && (
            <div>
              <span style={{ color: "#888", fontSize: "12px" }}>
                결제 승인
              </span>
              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                  color: "#20251f",
                  fontSize: "13px",
                  wordBreak: "break-all",
                }}
              >
                정상 승인
              </strong>
            </div>
          )}
        </div>

        <Link
          href="/fortune/detail"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "58px",
            marginTop: "25px",
            borderRadius: "12px",
            background: "#20251f",
            color: "#fff",
            textDecoration: "none",
            fontSize: "15px",
            fontWeight: 700,
          }}
        >
          상세 사주 결과 보기
        </Link>

        <Link
          href="/saju"
          style={{
            display: "inline-block",
            marginTop: "15px",
            color: "#777",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          사주 입력 화면으로 돌아가기
        </Link>

        <div
          style={{
            marginTop: "35px",
            paddingTop: "20px",
            borderTop: "1px solid #e5dfd4",
            color: "#999",
            fontSize: "11px",
          }}
        >
          명운 MYEONGUN · myeongun.kr
        </div>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: "#f5f1e8",
            display: "grid",
            placeItems: "center",
          }}
        >
          결제 확인 중입니다...
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
