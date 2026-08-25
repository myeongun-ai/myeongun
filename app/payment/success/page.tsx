"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ConfirmState = "checking" | "success" | "error";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const paymentKey = searchParams.get("paymentKey") || "";
  const orderId = searchParams.get("orderId") || "";
  const amount = Number(searchParams.get("amount") || "0");

  const [state, setState] = useState<ConfirmState>("checking");
  const [message, setMessage] = useState("토스 결제 승인 정보를 확인하고 있습니다.");

  useEffect(() => {
    let cancelled = false;

    async function confirmPayment() {
      document.cookie = "myeongun_paid=; Path=/; Max-Age=0; SameSite=Lax";

      if (!paymentKey || !orderId || !amount) {
        if (!cancelled) {
          setState("error");
          setMessage("결제 승인 정보가 올바르지 않습니다. 다시 결제를 진행해주세요.");
        }
        return;
      }

      try {
        const response = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount,
            saju: (() => {
              try {
                const saved = localStorage.getItem("myeongun_saju");
                return saved ? JSON.parse(saved) : null;
              } catch {
                return null;
              }
            })(),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || result?.code || "결제 승인 확인에 실패했습니다."
          );
        }

        if (!cancelled) {
          setState("success");
          setMessage("실제 결제 승인이 정상적으로 확인되었습니다.");
        }
      } catch (error) {
        console.error("결제 승인 확인 오류:", error);

        if (!cancelled) {
          setState("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "결제 승인 확인 중 오류가 발생했습니다."
          );
        }
      }
    }

    confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [paymentKey, orderId, amount]);

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
            background:
              state === "success"
                ? "#e3ead7"
                : state === "error"
                  ? "#f6dfdc"
                  : "#efe8da",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "38px",
          }}
        >
          {state === "success" ? "✓" : state === "error" ? "!" : "…"}
        </div>

        <h1
          style={{
            margin: "0 0 18px",
            fontSize: "30px",
            color: "#20251f",
          }}
        >
          {state === "checking"
            ? "결제를 확인하고 있습니다"
            : state === "success"
              ? "결제가 완료되었습니다"
              : "결제 확인에 실패했습니다"}
        </h1>

        <p
          style={{
            margin: 0,
            color: "#777",
            lineHeight: 1.8,
            fontSize: "14px",
          }}
        >
          {message}
        </p>

        {(orderId || amount > 0) && (
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              borderRadius: "14px",
              background: "#f7f2e8",
              textAlign: "left",
            }}
          >
            {orderId && (
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
                  {orderId}
                </strong>
              </div>
            )}

            {amount > 0 && (
              <div>
                <span style={{ color: "#888", fontSize: "12px" }}>
                  결제금액
                </span>
                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#20251f",
                    fontSize: "14px",
                  }}
                >
                  {amount.toLocaleString("ko-KR")}원
                </strong>
              </div>
            )}
          </div>
        )}

        {state === "success" && (
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
        )}

        {state === "error" && (
          <Link
            href="/payment"
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
            결제 다시 진행하기
          </Link>
        )}

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
