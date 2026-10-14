
import { NextResponse } from "next/server";
import { calculateMyeongunManseryeok } from "../../../../lib/manseryeok";

export const runtime = "nodejs";

type Element = "목" | "화" | "토" | "금" | "수";

const ELEMENTS: Record<
  Element,
  {
    money: string;
    moneyStrength: string;
    moneyCaution: string;
    business: string;
    businessStrength: string;
    advice: string;
    summary: string;
  }
> = {
  목: {
    money:
      "성장과 새로운 기회를 중요하게 여기는 재물 성향으로 해석할 수 있습니다. 눈앞의 결과보다 앞으로 발전할 가능성에 관심을 두는 편입니다.",
    moneyStrength: "꾸준히 배우고 새로운 기회를 탐색하는 자세",
    moneyCaution: "여러 계획을 동시에 추진하면서 지출이 늘어나는 점",
    business:
      "새로운 아이디어를 구상하고 일을 발전시키는 과정에서 강점을 찾을 수 있습니다. 다만 시작한 일을 끝까지 관리하는 습관도 중요합니다.",
    businessStrength: "기획과 성장 가능성 탐색",
    advice: "새로운 계획을 세울 때는 필요한 비용과 준비 기간을 먼저 확인해 보세요.",
    summary: "성장 가능성을 살피되 꾸준한 관리가 중요한 성향입니다.",
  },
  화: {
    money:
      "활동과 사람들과의 교류를 통해 기회를 찾으려는 재물 성향으로 해석할 수 있습니다. 적극성이 장점이지만 순간적인 판단에는 주의가 필요합니다.",
    moneyStrength: "적극적으로 기회를 찾고 행동하는 자세",
    moneyCaution: "기분이나 분위기에 따라 지출을 결정하는 점",
    business:
      "사람들과 소통하고 자신의 생각을 전달하는 활동에서 강점을 찾을 수 있습니다. 중요한 계약이나 결정에서는 충분한 검토가 도움이 됩니다.",
    businessStrength: "소통과 적극적인 실행",
    advice: "큰 지출이나 중요한 결정은 하루 정도 시간을 두고 다시 검토해 보세요.",
    summary: "적극적인 실행력이 장점이며 신중한 판단이 필요한 성향입니다.",
  },
  토: {
    money:
      "안정과 꾸준한 관리를 중요하게 여기는 재물 성향으로 해석할 수 있습니다. 큰 변화보다 계획을 세우고 유지하는 방식에 편안함을 느낄 수 있습니다.",
    moneyStrength: "책임감과 지속적인 관리",
    moneyCaution: "변화가 필요한 상황에서도 익숙한 방식만 유지하는 점",
    business:
      "맡은 일을 안정적으로 운영하고 신뢰를 쌓는 과정에서 강점을 찾을 수 있습니다. 새로운 기회를 검토할 때는 안정성과 가능성을 함께 살펴보세요.",
    businessStrength: "안정적인 운영과 책임감",
    advice: "기존 계획을 유지하더라도 정기적으로 지출과 운영 상황을 점검해 보세요.",
    summary: "안정적인 관리가 장점이며 변화에 대한 유연함도 필요한 성향입니다.",
  },
  금: {
    money:
      "기준과 원칙을 세워 돈을 관리하려는 재물 성향으로 해석할 수 있습니다. 판단 기준이 분명한 편이지만 지나친 완벽주의는 부담이 될 수 있습니다.",
    moneyStrength: "분명한 기준과 꼼꼼한 검토",
    moneyCaution: "세부적인 문제에 집중해 전체 흐름을 놓치는 점",
    business:
      "문제를 분석하고 업무의 기준을 정하는 활동에서 강점을 찾을 수 있습니다. 사업이나 조직 운영에서는 원칙과 함께 유연한 소통도 중요합니다.",
    businessStrength: "분석과 체계적인 의사결정",
    advice: "돈과 관련된 결정을 할 때는 세부 조건뿐 아니라 전체 상황도 함께 살펴보세요.",
    summary: "체계적인 판단이 장점이며 상황에 맞는 유연함이 필요한 성향입니다.",
  },
  수: {
    money:
      "정보를 모으고 여러 가능성을 비교하려는 재물 성향으로 해석할 수 있습니다. 신중한 검토가 장점이지만 고민이 길어질 수 있습니다.",
    moneyStrength: "정보 수집과 상황에 맞는 판단",
    moneyCaution: "결정을 지나치게 미루거나 생각만 반복하는 점",
    business:
      "시장과 주변 상황을 관찰하고 변화에 대응하는 활동에서 강점을 찾을 수 있습니다. 충분히 검토했다면 작은 실행으로 경험을 쌓는 것도 도움이 됩니다.",
    businessStrength: "정보 분석과 변화에 대한 적응",
    advice: "정보를 충분히 확인했다면 실행 가능한 작은 목표부터 정해 보세요.",
    summary: "정보를 살피는 능력이 장점이며 적절한 실행력이 필요한 성향입니다.",
  },
};

function getStrengthAdvice(level: string): string {
  if (level === "신강") {
    return "자신의 판단을 적극적으로 활용할 수 있지만, 중요한 재무·사업 결정에서는 다른 사람의 의견과 객관적인 자료도 함께 확인하는 것이 좋습니다.";
  }

  if (level === "신약") {
    return "새로운 일을 무리하게 확대하기보다 현재의 자원과 준비 상태를 점검하고, 필요할 때 주변의 도움을 활용하는 것이 좋습니다.";
  }

  return "자신의 판단과 외부 환경 사이에서 균형을 찾으며, 중요한 일은 계획과 실행 가능성을 함께 검토하는 것이 좋습니다.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (
      !body ||
      typeof body.birth !== "string" ||
      typeof body.time !== "string" ||
      typeof body.gender !== "string" ||
      typeof body.calendar !== "string" ||
      !body.birth.trim() ||
      !body.time.trim() ||
      !body.gender.trim() ||
      !body.calendar.trim()
    ) {
      return NextResponse.json(
        { error: "필수 정보를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    const manseryeok = calculateMyeongunManseryeok({
      birth: body.birth,
      time: body.time,
      calendar: body.calendar,
    });

    const element = manseryeok.dayMaster.element as Element;
    const info = ELEMENTS[element];

    if (!info) {
      return NextResponse.json(
        { error: "재물·사업운 해석 정보를 확인하지 못했습니다." },
        { status: 500 }
      );
    }

    const strengthAdvice = getStrengthAdvice(
      manseryeok.strength.level
    );

    const timeNotice = manseryeok.pillars.hour
      ? ""
      : "출생시간을 알 수 없어 시주를 제외한 참고 분석이며, 세부 해석에는 제한이 있습니다.";

    const result = [
      "## 1. 나의 재물 성향",
      info.money,
      `전통 명리에서는 고객님의 일간인 ${manseryeok.dayMaster.stem}을 ${element}의 기운과 연결하여 해석합니다. 이는 실제 재산이나 수입을 판단하는 기준이 아니라 기본적인 성향을 살펴보는 참고 자료입니다.`,
      `- 강점: ${info.moneyStrength}`,
      `- 주의할 점: ${info.moneyCaution}`,

      "## 2. 나의 사업 성향",
      info.business,
      `특히 ${info.businessStrength}과 관련된 자신의 특징을 돌아볼 수 있습니다.`,
      strengthAdvice,

      "## 3. 지금 기억할 핵심 포인트",
      `- ${info.advice}`,
      "- 투자나 창업 등 중요한 결정은 실제 소득, 지출, 시장 상황과 위험 요소를 함께 확인해 보세요.",

      "## 무료 재물·사업운 한눈에 보기",
      info.summary,
      timeNotice,
      "무료 분석에서는 재물과 사업의 기본 성향까지 안내해 드렸습니다. 돈의 세부 흐름, 사업·직업 방향, 앞으로의 변화와 구체적인 대응 방법은 상세 사주에서 더 깊게 확인할 수 있습니다.",
      "",
      "※ 본 분석은 전통 명리를 활용한 참고용 콘텐츠이며, 투자 수익이나 사업 성공을 보장하지 않습니다.",
    ]
      .filter(Boolean)
      .join("\n\n");

    return NextResponse.json({
      result,
      yongshin: manseryeok.yongshin ?? null,
    });
  } catch (error) {
    console.error("business fortune API error:", error);

    return NextResponse.json(
      {
        error:
          "재물·사업운 정보를 분석하지 못했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
