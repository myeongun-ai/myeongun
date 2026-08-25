"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function PaymentFailContent() {
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const errorCode = searchParams.get("code") || "";
    const errorMessage = searchParams.get("message") || "";

    setCode(errorCode.slice(0, 100));
    setMessage(errorMessage.slice(0, 300));

    fetch("/api/payment/reset", {
      method: "POST",
      cache: "no-store",
    }).catch((error) => {
      console.error("결제 실패 후 이용권 초기화 오류:", error);
    });
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
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
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

            <strong style={{ fontSize: "20px", letterSpacing: "-1px" }}>
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
            MYEONGUN PAYMENT
          </div>

          <div
            style={{
              width: "76px",
              height: "76px",
              margin: "0 auto 25px",
              borderRadius: "50%",
              background: "#f3e4df",
              display: "grid",
              placeItems: "center",
              color: "#b24b3c",
              fontSize: "38px",
              fontWeight: 700,
            }}
          >
            !
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
            결제가 완료되지 않았습니다
          </h1>

          <p
            style={{
              margin: 0,
              color: "#777",
              lineHeight: 1.9,
              fontSize: "14px",
            }}
          >
            결제가 취소되었거나 처리 중 문제가 발생했습니다.
            <br />
            다시 결제를 진행하거나 사주 입력 화면으로 돌아가 주세요.
          </p>

          {(code || message) && (
            <div
              style={{
                marginTop: "35px",
                padding: "22px",
                borderRadius: "14px",
                background: "#f7f2e8",
                textAlign: "left",
              }}
            >
              {code && (
                <div style={{ marginBottom: message ? "16px" : 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#8b8173",
                      marginBottom: "6px",
                    }}
                  >
                    오류 코드
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#51483b",
                      fontWeight: 700,
                      wordBreak: "break-word",
                    }}
                  >
                    {code}
                  </div>
                </div>
              )}

              {message && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#8b8173",
                      marginBottom: "6px",
                    }}
                  >
                    오류 내용
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      lineHeight: 1.7,
                      wordBreak: "break-word",
                    }}
                  >
                    {message}
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "30px",
            }}
          >
            <Link
              href="/payment"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "58px",
                borderRadius: "12px",
                background: "#20251f",
                color: "#fff",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 800,
              }}
            >
              다시 결제하기
            </Link>

            <Link
              href="/saju"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "54px",
                borderRadius: "12px",
                border: "1px solid #d8cfbf",
                background: "#fffdf8",
                color: "#51483b",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              사주 입력으로 돌아가기
            </Link>
          </div>

          <p
            style={{
              marginTop: "18px",
              marginBottom: 0,
              fontSize: "11px",
              color: "#a39a8e",
            }}
          >
            결제가 완료되지 않은 경우 상세 사주 이용권은 발급되지 않습니다.
          </p>
        </section>

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
          결제 성공 여부는 토스 결제 승인 결과를 기준으로 최종 확인합니다.
        </div>

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
            전통 명리학의 관점을 참고한 AI 사주 분석 서비스입니다.
          </div>

          <div style={{ marginTop: "8px" }}>
            © 2026 MYEONGUN · myeongun.kr
          </div>
        </footer>
      </div>
    </main>
  );
}

export default function PaymentFailPage() {
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
          결제 정보를 불러오는 중입니다...
        </main>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
