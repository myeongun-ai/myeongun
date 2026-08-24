"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessContent() {`r`n  useEffect(() => {`r`n    document.cookie = "myeongun_paid=1; Path=/; Max-Age=86400; SameSite=Lax";`r`n  }, []);
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState("");
  const [paymentKey, setPaymentKey] = useState("");
  const [amount, setAmount] = useState("9,900??);

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
        setAmount(`${numericAmount.toLocaleString("ko-KR")}??);
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
              ??
            </span>

            <strong
              style={{
                fontSize: "20px",
                letterSpacing: "-1px",
              }}
            >
              紐낆슫
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
            ??紐낆슫
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
            ??
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
            寃곗젣媛 ?꾨즺?섏뿀?듬땲??
          </h1>

          <p
            style={{
              margin: 0,
              color: "#777",
              lineHeight: 1.9,
              fontSize: "14px",
            }}
          >
            紐낆슫 ?곸꽭 ?ъ＜ 遺꾩꽍 寃곗젣媛
            <br />
            ?뺤긽?곸쑝濡??뱀씤?섏뿀?듬땲??
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
                  寃곗젣湲덉븸
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
                  二쇰Ц踰덊샇
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
                    寃곗젣 ?뱀씤踰덊샇
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
            ?곸꽭 ?ъ＜ 寃곌낵 蹂닿린
          </Link>

          <p
            style={{
              marginTop: "15px",
              marginBottom: 0,
              fontSize: "11px",
              color: "#a39a8e",
            }}
          >
            寃곗젣 ?뺤씤???뺤긽?곸쑝濡??꾨즺?섏뿀?듬땲??
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
          寃곗젣 ?꾨즺 ???곸꽭 ?ъ＜ 寃곌낵瑜??뺤씤?섏떎 ???덉뒿?덈떎.
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
            ??紐낆슫
          </div>

          <div>
            ?꾪넻 紐낅━?숈쓣 諛뷀깢?쇰줈 ??AI ?ъ＜ 遺꾩꽍 ?쒕퉬?ㅼ엯?덈떎.
          </div>

          <div style={{ marginTop: "8px" }}>
            짤 2026 MYEONGUN 쨌 myeongun.kr
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
          寃곗젣 寃곌낵瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎...
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
