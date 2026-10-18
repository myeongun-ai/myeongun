import { NextResponse } from "next/server";
import type { SajuAccessInput } from "../../../../lib/paymentAccess";
import { savePendingPayment } from "../../../../lib/paymentPending";

export const runtime = "nodejs";

function json(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

const AI_UNAVAILABLE_MESSAGE =
  "현재 AI 상세 사주 서비스를 일시적으로 이용할 수 없습니다. " +
  "결제는 진행되지 않았으니 잠시 후 다시 이용해 주세요.";

async function checkAiService(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("결제 보호: OPENAI_API_KEY가 없습니다.");
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      10000
    );

    try {
      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            store: false,
            input: "정상",
            max_output_tokens: 16,
          }),
          signal: controller.signal,
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();

        console.error(
          "결제 보호: AI 상태 확인 실패",
          response.status,
          errorBody.slice(0, 500)
        );

        return false;
      }

      return true;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("결제 보호: AI 연결 오류", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = String(body?.orderId || "").trim();

    if (
      !orderId ||
      !/^MYEONGUN-[A-Za-z0-9_-]+$/.test(orderId) ||
      orderId.length > 100
    ) {
      return json(
        { message: "유효하지 않은 주문번호입니다." },
        400
      );
    }

    const input = body?.saju;

    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return json(
        {
          message: "결제에 연결할 사주 정보가 없습니다.",
        },
        400
      );
    }

    const saju: SajuAccessInput = {
      name: String(input.name || "").trim(),
      birth: String(input.birth || "").trim(),
      time: String(input.time || "").trim(),
      gender: String(input.gender || "").trim(),
      calendar: String(input.calendar || "").trim(),
    };

    if (
      !saju.name ||
      !saju.birth ||
      !saju.time ||
      !saju.gender ||
      !saju.calendar
    ) {
      return json(
        {
          message:
            "이름, 생년월일, 출생시간, 성별, 양력/음력 정보를 모두 입력해주세요.",
        },
        400
      );
    }

    // 결제 준비 정보를 저장하기 전에 AI 서비스 상태 확인
    const aiAvailable = await checkAiService();

    if (!aiAvailable) {
      return json(
        { message: AI_UNAVAILABLE_MESSAGE },
        503
      );
    }

    const pending = await savePendingPayment(
      orderId,
      saju
    );

    return json({
      ok: true,
      orderId,
      expiresAt: pending.expiresAt,
    });
  } catch (error) {
    console.error("결제 준비 오류:", error);

    if (
      error instanceof Error &&
      (
        error.message.includes("이미 다른 사주 정보") ||
        error.message.includes("결제 준비 시간이 만료") ||
        error.message.includes("새 주문번호로 다시 시도")
      )
    ) {
      return json(
        { message: error.message },
        409
      );
    }

    return json(
      {
        message:
          "결제 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      500
    );
  }
}
