
import { NextResponse } from "next/server";
import { calculateMyeongunManseryeok } from "../../../../lib/manseryeok";

export const runtime = "nodejs";

type Element = "목" | "화" | "토" | "금" | "수";

type YearGuide = {
  direction: string;
  keywords: [string, string, string];
  money: string;
  relationship: string;
  lifestyle: string;
  action: string;
  summary: string;
};

const GUIDES: Record<Element, YearGuide> = {
  목: {
    direction:
      "성장하고 싶은 분야를 정리하고 새로운 계획을 준비하는 방향이 잘 어울립니다. 여러 가능성을 살펴보는 자세는 장점이지만, 너무 많은 일을 동시에 시작하면 집중력이 떨어질 수 있습니다.",
    keywords: ["성장", "우선순위", "꾸준함"],
    money:
      "새로운 기회에 관심을 가지되 필요한 비용과 준비 기간을 먼저 확인해 보세요. 돈과 관련된 결정은 기대하는 결과뿐 아니라 감당할 수 있는 부담도 함께 살피는 것이 중요합니다.",
    relationship:
      "가족이나 동료와 함께 발전할 방법을 찾아보세요. 자신의 생각을 적극적으로 표현하면서 상대방의 의견도 충분히 듣는 태도가 도움이 됩니다.",
    lifestyle:
      "일정을 지나치게 늘리기보다 충분한 휴식 시간을 확보해 보세요.",
    action:
      "새로운 목표를 세울 때 가장 중요한 한 가지부터 실행해 보세요.",
    summary:
      "성장을 준비하되 우선순위를 정하고 꾸준히 실천하는 태도가 중요합니다.",
  },
  화: {
    direction:
      "자신의 생각을 표현하고 사람들과 소통하는 능력을 돌아보는 방향이 잘 어울립니다. 적극적으로 움직이는 자세가 장점이 될 수 있지만, 중요한 결정에서는 속도를 조절하는 것이 좋습니다.",
    keywords: ["소통", "실행", "신중함"],
    money:
      "활동적인 생활 속에서 지출이 늘어나지 않는지 점검해 보세요. 새로운 제안이나 기회를 접하더라도 실제 조건을 충분히 확인한 뒤 판단하는 것이 중요합니다.",
    relationship:
      "따뜻한 표현은 관계를 원활하게 만드는 데 도움이 됩니다. 다만 감정이 앞서는 순간에는 상대방의 이야기를 먼저 들어보는 것도 좋습니다.",
    lifestyle:
      "바쁜 일정 사이에 규칙적인 수면과 휴식을 챙겨 보세요.",
    action:
      "중요한 결정을 내리기 전에 한 번 더 검토하는 시간을 가져 보세요.",
    summary:
      "적극성과 표현력을 활용하면서 중요한 순간에는 신중함을 유지하는 태도가 중요합니다.",
  },
  토: {
    direction:
      "지금까지 쌓아 온 기반을 점검하고 생활의 균형을 유지하는 방향이 잘 어울립니다. 꾸준함과 책임감은 장점이지만, 변화가 필요한 부분까지 그대로 두지는 않았는지 돌아볼 필요가 있습니다.",
    keywords: ["안정", "점검", "유연함"],
    money:
      "수입과 지출을 꾸준히 확인하고 무리한 계획은 피하는 것이 좋습니다. 익숙한 방식이 편하더라도 달라진 환경과 조건을 함께 살펴보세요.",
    relationship:
      "약속을 지키고 신뢰를 쌓는 태도가 관계에 도움이 됩니다. 다른 사람의 새로운 생각을 받아들이는 유연함도 중요합니다.",
    lifestyle:
      "익숙한 생활 리듬을 유지하면서 가벼운 활동이나 휴식으로 변화를 주어 보세요.",
    action:
      "현재의 계획을 점검하고 개선할 부분 한 가지를 찾아보세요.",
    summary:
      "안정적인 기반을 지키면서 필요한 변화에는 유연하게 대응하는 태도가 중요합니다.",
  },
  금: {
    direction:
      "자신에게 중요한 기준을 정리하고 계획을 체계적으로 관리하는 방향이 잘 어울립니다. 꼼꼼한 판단은 장점이지만, 모든 상황에서 완벽한 답을 찾으려 하면 부담이 커질 수 있습니다.",
    keywords: ["원칙", "정리", "유연함"],
    money:
      "돈과 관련된 판단에서는 명확한 기준을 세우고 조건을 비교해 보세요. 세부 사항을 살피는 것과 함께 전체적인 재정 상황을 확인하는 것도 중요합니다.",
    relationship:
      "약속과 책임을 중요하게 생각하는 태도는 신뢰에 도움이 됩니다. 다만 상대방의 상황에 따라 표현 방식을 부드럽게 조절해 보세요.",
    lifestyle:
      "해야 할 일과 쉬어야 할 시간을 구분해 긴장을 조절해 보세요.",
    action:
      "중요한 일을 정리하되 지나친 완벽주의는 내려놓아 보세요.",
    summary:
      "분명한 기준을 활용하면서 상황에 맞는 유연함을 유지하는 태도가 중요합니다.",
  },
  수: {
    direction:
      "주변 상황을 관찰하고 필요한 정보를 모으는 방향이 잘 어울립니다. 다양한 가능성을 살피는 능력은 장점이지만, 생각이 길어져 실행을 미루지 않도록 주의해 보세요.",
    keywords: ["관찰", "준비", "실행"],
    money:
      "새로운 재정 계획을 검토할 때는 충분한 정보를 확인해 보세요. 다만 모든 조건이 완벽해질 때까지 기다리기보다 현실적으로 가능한 선택을 구분하는 것도 중요합니다.",
    relationship:
      "상대방의 입장을 이해하려는 태도는 관계에 도움이 됩니다. 자신의 생각과 필요도 적절하게 표현해 보세요.",
    lifestyle:
      "생각이 많아질 때는 규칙적인 활동과 휴식으로 생활 리듬을 유지해 보세요.",
    action:
      "충분히 검토한 계획은 작은 단계부터 실행해 보세요.",
    summary:
      "정보를 살피는 신중함과 실제 행동 사이의 균형을 찾는 태도가 중요합니다.",
  },
};

function getTargetYear(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  return month >= 9 ? year + 1 : year;
}

function getStrengthAdvice(level: string): string {
  if (level === "신강") {
    return "자신의 판단을 활용하되 다른 사람의 의견도 함께 살피는 것이 좋습니다.";
  }

  if (level === "신약") {
    return "새로운 계획을 무리하게 늘리기보다 준비 상태와 주변의 도움을 점검해 보세요.";
  }

  return "자신의 생각과 주변 환경 사이에서 균형을 찾는 태도가 도움이 됩니다.";
}

export async function POST(req: Request) {
  const targetYear = getTargetYear();

  try {
    const body = await req.json();

    if (
      !body ||
      typeof body.name !== "string" ||
      typeof body.birth !== "string" ||
      typeof body.time !== "string" ||
      typeof body.gender !== "string" ||
      typeof body.calendar !== "string" ||
      !body.name.trim() ||
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
    const guide = GUIDES[element];

    if (!guide) {
      return NextResponse.json(
        { error: "신년 운세 해석 정보를 확인하지 못했습니다." },
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
      `# 명운의 ${targetYear}년 무료 신년 운세`,

      `## 1. ${targetYear}년 전체 방향`,
      `고객님의 일간은 ${manseryeok.dayMaster.stem}이며, 전통 명리에서는 ${element}의 기운과 연결하여 해석합니다. ${guide.direction} ${strengthAdvice}`,
      `- 핵심 1: ${guide.keywords[0]}`,
      `- 핵심 2: ${guide.keywords[1]}`,
      `- 핵심 3: ${guide.keywords[2]}`,

      "## 2. 재물·일의 핵심",
      guide.money,
      "직장이나 사업에서는 현재의 여건과 준비 상태를 함께 확인해 보세요. 실제 재정 판단은 사주 해석보다 소득, 지출, 시장 상황과 위험 요소를 우선하여 검토해야 합니다.",

      "## 3. 관계·생활의 핵심",
      guide.relationship,
      guide.lifestyle,
      "중요한 관계에서는 상대방의 상황과 자신의 마음을 함께 살피는 태도가 도움이 됩니다.",

      `## 4. ${targetYear}년 기억할 두 가지`,
      `1. ${guide.action}`,
      "2. 중요한 선택을 앞두고 현실적인 조건과 필요한 정보를 함께 확인해 보세요.",

      `## 무료 ${targetYear} 신년 운세 한눈에 보기`,
      guide.summary,
      timeNotice,
      `무료 신년 운세에서는 ${targetYear}년을 준비할 기본 방향과 핵심 주의점을 안내해 드렸습니다. 재물·직업·관계와 앞으로의 흐름을 더 깊게 살펴보고 싶다면 상세 사주 분석에서 확인할 수 있습니다.`,
      "",
      "※ 이 결과는 개인 만세력의 기본 성향을 활용한 신년 생활 방향 안내입니다. 해당 연도의 세운을 별도로 계산한 예측은 아니며, 미래의 결과를 보장하지 않습니다.",
    ]
      .filter(Boolean)
      .join("\n\n");

    return NextResponse.json({
      result,
      targetYear,
      profile: {
        name: body.name,
        birth: body.birth,
        time: body.time,
        gender: body.gender,
        calendar: body.calendar,
        dayMaster: manseryeok.dayMaster,
        fiveElements: manseryeok.fiveElements,
        strength: manseryeok.strength,
        yongshin: manseryeok.yongshin,
      },
    });
  } catch (error) {
    console.error(`${targetYear} new year fortune API error:`, error);

    return NextResponse.json(
      {
        error: `${targetYear}년 신년 운세 정보를 분석하지 못했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.`,
      },
      { status: 500 }
    );
  }
}
