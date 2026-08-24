"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState("");
  const [paymentKey, setPaymentKey] = useState("");
  const [amount, setAmount] = useState("9,900원");

  useEffect(() => {
    const urlOrderId = searchParams.get("orderId");
    const urlPaymentKey = searchParams.get("paymentKey");
    const urlAmount = searchParams.get("amount");

    if (urlOrderId) {
      setOrderId(urlOrderId);
    }

    if (urlPaymentKey) {
      setPaymentKey(urlPaymentKey);
    }

    if (urlAmount) {
      const numericAmount = Number(urlAmount);

      if (!Number.isNaN(numericAmount)) {
        setAmount(`${numericAmount.toLocaleString("ko-KR")}원`);
      }
    }
  }, [searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f1e8",
        padding: "70px 20px 100px",
        color: "#25231f",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "55px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "#25231f",
            }}
          >
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#222a25",
                color: "#e5c477",
                display: "grid",
                placeItems: "center",
                fontSize: "22px",
                fontFamily: "Georgia, serif",
              }}
            >
              明
            </span>

            <strong
              style={{
                fontSize: "20px",
                letterSpacing: "-1px",
              }}
            >
              명운
            </strong>

            <span
              style={{
                fontSize: "8px",
                letterSpacing: "2px",
                color: "#9b8a67",
              }}
            >
              MYEONGUN
            </span>
          </Link>

          <Link
            href="/saju"
            style={{
              border: "1px solid #ded4c3",
              borderRadius: "999px",
              padding: "9px 16px",
              fontSize: "12px",
              textDecoration: "none",
              color: "#51483b",
              background: "#fffdf8",
            }}
          >
            내 명운
          </Link>
        </header>

        {/* Success Card */}
        <section
          style={{
            background: "#fffdf8",
            border: "1px solid #ddd3c2",
            borderRadius: "22px",
            padding: "55px 45px",
            boxShadow: "0 15px 45px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              color: "#a17a27",
              marginBottom: "22px",
              fontWeight: 700,
            }}
          >
            MYEONGUN PREMIUM
          </div>

          {/* Check */}
          <div
            style={{
              width: "76px",
              height: "76px",
              margin: "0 auto 25px",
              borderRadius: "50%",
              background: "#f3ead7",
              display: "grid",
              placeItems: "center",
              color: "#92712e",
              fontSize: "42px",
              fontFamily: "Georgia, serif",
            }}
          >
            ✓
          </div>

          <h1
            style={{
              margin: "0 0 18px",
              fontSize: "34px",
              lineHeight: 1.35,
              letterSpacing: "-1.5px",
              color: "#20251f",
            }}
          >
            결제가 완료되었습니다
          </h1>

          <p
            style={{
              margin: 0,
              color: "#777",
              lineHeight: 1.9,
              fontSize: "14px",
            }}
          >
            명운 상세 사주 분석 결제가
            <br />
            정상적으로 승인되었습니다.
          </p>

          {/* Payment Information */}
          <div
            style={{
              marginTop: "35px",
              padding: "24px",
              borderRadius: "14px",
              background: "#f7f2e8",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "18px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8b8173",
                    marginBottom: "6px",
                  }}
                >
                  결제금액
                </div>

                <strong
                  style={{
                    fontSize: "18px",
                    color: "#20251f",
                  }}
                >
                  {amount}
                </strong>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8b8173",
                    marginBottom: "6px",
                  }}
                >
                  주문번호
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#51483b",
                    wordBreak: "break-all",
                  }}
                >
                  {orderId || "MYEONGUN-PREMIUM"}
                </div>
              </div>

              {paymentKey && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#8b8173",
                      marginBottom: "6px",
                    }}
                  >
                    결제 승인번호
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#777",
                      wordBreak: "break-all",
                    }}
                  >
                    {paymentKey}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Result Button */}
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
              fontWeight: 800,
            }}
          >
            상세 사주 결과 보기
          </Link>

          <p
            style={{
              marginTop: "15px",
              marginBottom: 0,
              fontSize: "11px",
              color: "#a39a8e",
            }}
          >
            결제 확인이 정상적으로 완료되었습니다.
          </p>
        </section>

        {/* Notice */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px 20px",
            borderRadius: "12px",
            background: "#eee7d9",
            color: "#8a8175",
            fontSize: "11px",
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          결제 완료 후 상세 사주 결과를 확인하실 수 있습니다.
        </div>

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            paddingTop: "70px",
            color: "#9a9286",
            fontSize: "11px",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "20px",
              color: "#766b5c",
              marginBottom: "8px",
            }}
          >
            明 명운
          </div>

          <div>
            전통 명리학을 바탕으로 한 AI 사주 분석 서비스입니다.
          </div>

          <div style={{ marginTop: "8px" }}>
            © 2026 MYEONGUN · myeongun.kr
          </div>
        </footer>
      </div>
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
            color: "#777",
          }}
        >
          결제 결과를 불러오는 중입니다...
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}