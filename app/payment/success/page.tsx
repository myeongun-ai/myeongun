"use client";

import { isAnalyticsAllowed } from "../../analyticsConsent";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

type ConfirmState = "checking" | "success" | "error";

type ConfirmResult = {
  ok?: boolean;
  message?: string;
  saju?: unknown;
  reopenCode?: string;
  orderId?: string;
  amount?: number;
  status?: string;
  alreadyIssued?: boolean;
};

// 개발 환경의 React Strict Mode에서 같은 결제 승인 요청이
// 중복 전송되지 않도록 동일 페이지의 진행 중인 요청을 공유합니다.
const confirmationRequests = new Map<string, Promise<ConfirmResult>>();

function confirmOnce(paymentKey: string, orderId: string, amount: number) {
  const key = JSON.stringify([paymentKey, orderId, amount]);
  const existing = confirmationRequests.get(key);
  if (existing) return existing;

  const request = (async (): Promise<ConfirmResult> => {
    const response = await fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const result = (await response.json()) as ConfirmResult;
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "결제 승인 상태를 확인하지 못했습니다.");
    }
    return result;
  })();

  confirmationRequests.set(key, request);
  // 실패한 요청은 이후 사용자가 페이지를 다시 열 때 재시도할 수 있습니다.
  void request.catch(() => {
    if (confirmationRequests.get(key) === request) {
      confirmationRequests.delete(key);
    }
  });
  return request;
}

// 구매 이벤트는 서버가 확인한 주문번호와 금액만 사용합니다.
// 기존 이용권 복구는 새 구매로 기록하지 않습니다.
const queuedPurchases = new Set<string>();

function trackVerifiedPurchase(result: ConfirmResult, expectedOrderId: string) {
  if (!isAnalyticsAllowed()) return;
  if (
    result.ok !== true || result.status !== "DONE" ||
    result.orderId !== expectedOrderId || result.amount !== 9900 ||
    result.alreadyIssued === true || queuedPurchases.has(expectedOrderId)
  ) return;

  const storageKey = `myeongun_ga_purchase:${expectedOrderId}`;
  try {
    if (sessionStorage.getItem(storageKey) === "queued") return;
  } catch {
    // 저장소를 사용할 수 없어도 결제 완료 화면에는 영향을 주지 않습니다.
  }

  try {
    const analyticsWindow = window as Window & { dataLayer?: unknown[] };
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
    // 태그 로딩 전에도 이벤트를 대기열에 넣어둘 수 있습니다.
    function queueEvent(..._args: unknown[]) {
      analyticsWindow.dataLayer!.push(arguments);
    }
    queueEvent("event", "purchase", {
      send_to: "G-E5JM4F9VDF",
      transaction_id: result.orderId,
      value: result.amount,
      currency: "KRW",
      page_location: window.location.origin + window.location.pathname,
      items: [{
        item_id: "myeongun_premium_saju",
        item_name: "명운 상세 사주",
        price: result.amount,
        quantity: 1,
      }],
    });
    queuedPurchases.add(expectedOrderId);
    try {
      sessionStorage.setItem(storageKey, "queued");
    } catch {
      // 메모리 내 중복 방지는 계속 적용됩니다.
    }
  } catch {
    // 분석 이벤트 전송 실패가 결제 결과를 바꾸지 않도록 합니다.
  }
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  const paymentKey = searchParams.get("paymentKey") || "";
  const orderId = searchParams.get("orderId") || "";
  const amount = Number(searchParams.get("amount") || "0");

  const [state, setState] = useState<ConfirmState>("checking");
  const [message, setMessage] = useState(
    "토스 결제 승인 정보를 확인하고 있습니다."
  );
  const [reopenCode, setReopenCode] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function confirmPayment() {
      if (!paymentKey || !orderId || amount !== 9900) {
        if (!cancelled) {
          setState("error");
          setMessage(
            "결제 승인 정보를 확인할 수 없습니다. 실제 결제가 완료되었을 수 있으므로 다시 결제하지 마시고 결제 내역을 확인해 주세요."
          );
        }
        return;
      }

      try {
        // 기존 브라우저 저장값만으로 이용코드를 표시하지 않습니다.
        // 서버의 결제 확인이 성공해야만 코드를 보여줍니다.
        const result = await confirmOnce(paymentKey, orderId, amount);

        if (cancelled) return;

        trackVerifiedPurchase(result, orderId);

        if (!result.saju || typeof result.saju !== "object") {
          throw new Error(
            "결제는 확인되었지만 사주정보를 확인하지 못했습니다. 다시 결제하지 마시고 고객센터로 문의해 주세요."
          );
        }

        {
          const sajuText = JSON.stringify(result.saju);

          sessionStorage.setItem(
            "myeongun_saju",
            sajuText
          );
          sessionStorage.setItem(
            "myeongun_paid_saju",
            sajuText
          );
          sessionStorage.setItem(
            "myeongun_active_saju",
            sajuText
          );
        }

        if (typeof result.reopenCode !== "string" || !result.reopenCode) {
          throw new Error(
            "결제는 확인되었지만 이용코드를 확인하지 못했습니다. 다시 결제하지 마시고 주문번호와 함께 고객센터로 문의해 주세요."
          );
        }

        {
          const code = result.reopenCode;

          sessionStorage.setItem(
            "myeongun_reopen_order_id",
            orderId
          );
          sessionStorage.setItem(
            "myeongun_reopen_code",
            code
          );

          setReopenCode(code);
        }

        sessionStorage.setItem(
          "myeongun_session_active",
          "1"
        );

        setState("success");
        setMessage(
          "결제 승인이 정상적으로 확인되었습니다."
        );
      } catch (error) {
        console.error("결제 승인 확인 오류:", error);

        if (!cancelled) {
          setReopenCode("");
          setState("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "결제 승인 상태를 확인하지 못했습니다."
          );
        }
      }
    }

    confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [paymentKey, orderId, amount]);

  async function copyReopenCode() {
    if (!reopenCode) return;

    try {
      await navigator.clipboard.writeText(reopenCode);
      setCopyMessage("이용코드를 복사했습니다.");
    } catch {
      setCopyMessage(
        "복사할 수 없습니다. 이용코드를 직접 메모해 주세요."
      );
    }
  }

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
          {state === "success"
            ? "✓"
            : state === "error"
              ? "!"
              : "…"}
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
              : "결제 상태를 확인해 주세요"}
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
                <span
                  style={{
                    color: "#888",
                    fontSize: "12px",
                  }}
                >
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
                <span
                  style={{
                    color: "#888",
                    fontSize: "12px",
                  }}
                >
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

        {state === "success" && reopenCode && (
          <div
            style={{
              marginTop: "20px",
              padding: "22px 20px",
              border: "1px solid #d7c9aa",
              borderRadius: "14px",
              background: "#fffaf0",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#8a6a2c",
                fontWeight: 800,
              }}
            >
              발급된 7일 재열람 코드
            </div>

            <div
              style={{
                marginTop: "9px",
                fontSize: "28px",
                letterSpacing: "4px",
                fontWeight: 900,
                color: "#20251f",
                wordBreak: "break-all",
              }}
            >
              {reopenCode}
            </div>

            <button
              type="button"
              onClick={copyReopenCode}
              style={{
                marginTop: "14px",
                padding: "10px 22px",
                border: "1px solid #b9a57c",
                borderRadius: "9px",
                background: "#ffffff",
                color: "#4c3d22",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              이용코드 복사하기
            </button>

            {copyMessage && (
              <p
                role="status"
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#666",
                }}
              >
                {copyMessage}
              </p>
            )}

            <p
              style={{
                margin: "14px 0 0",
                fontSize: "12px",
                lineHeight: 1.8,
                color: "#777",
              }}
            >
              재열람 코드를 반드시 별도로 저장해 주세요.
              <br />
              결제일로부터 7일 동안 다른 기기에서도
              상세 사주를 재열람할 수 있습니다.
              <br />
              코드를 분실하면 다시 확인하기 어려울 수
              있으므로 안전하게 보관해 주세요.
            </p>
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
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              borderRadius: "12px",
              background: "#fff1ed",
              color: "#8b3528",
              fontSize: "13px",
              lineHeight: 1.9,
              textAlign: "left",
            }}
          >
            <strong>중복 결제 주의</strong>
            <p style={{ margin: "8px 0 0" }}>
              결제가 이미 완료되었을 수 있습니다.
              다시 결제하지 마시고 카드사 또는
              토스페이먼츠 결제 내역을 확인해 주세요.
              <br />
              결제 내역이 있는데 이용코드를 받지
              못하셨다면 주문번호와 함께 명운
              고객센터로 문의해 주세요.
            </p>
          </div>
        )}

        <Link
          href="/saju"
          style={{
            display: "inline-block",
            marginTop: "20px",
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
            color: "#777",
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
