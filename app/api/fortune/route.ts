
import { NextResponse } from "next/server";
import {
  calculateMyeongunManseryeok,
  type FiveElement,
  type MyeongunManseryeokResult,
} from "../../../lib/manseryeok";

export const runtime = "nodejs";

type ElementDescription = {
  character: string;
  strength: string;
  caution: string;
  money: string;
  work: string;
  relationship: string;
  advice: string;
};

const ELEMENTS: Record<FiveElement, ElementDescription> = {
  목: {
    character: "새로운 가능성을 찾고 성장하려는 성향",
    strength: "배우고 발전하려는 자세",
    caution: "여러 일을 한꺼번에 시작해 집중력이 분산되는 점",
    money: "장기적인 성장과 꾸준한 준비",
    work: "기획하고 새로운 방향을 만들어 가는 활동",
    relationship: "상대방과 함께 발전하는 관계",
    advice: "새로운 일을 시작할 때는 우선순위를 정해 보세요.",
  },
  화: {
    character: "표현과 소통을 통해 활력을 얻는 성향",
    strength: "적극성과 따뜻한 표현력",
    caution: "순간적인 감정이나 성급한 결정",
    money: "적극적인 활동과 지출의 균형",
    work: "사람들과 소통하고 아이디어를 전달하는 활동",
    relationship: "마음을 표현하면서 상대의 이야기도 듣는 관계",
    advice: "중요한 결정은 잠시 시간을 두고 판단해 보세요.",
  },
  토: {
    character: "안정과 신뢰를 중요하게 여기는 성향",
    strength: "책임감과 꾸준함",
    caution: "익숙한 방식만 고집하거나 변화를 미루는 점",
    money: "안정적인 관리와 계획적인 생활",
    work: "체계를 유지하고 맡은 일을 완성하는 활동",
    relationship: "오랜 신뢰를 쌓아 가는 관계",
    advice: "안정적인 기반을 유지하면서 작은 변화도 시도해 보세요.",
  },
  금: {
    character: "원칙과 기준을 세워 판단하려는 성향",
    strength: "분별력과 결단력",
    caution: "자신이나 다른 사람에게 지나치게 엄격해지는 점",
    money: "기준을 세운 관리와 신중한 판단",
    work: "분석하고 문제를 정리하는 활동",
    relationship: "약속과 책임을 중요하게 여기는 관계",
    advice: "원칙을 지키되 상황에 맞는 유연함도 생각해 보세요.",
  },
  수: {
    character: "상황을 살피고 깊이 생각하는 성향",
    strength: "관찰력과 유연한 사고",
    caution: "고민이 길어져 실행이 늦어지는 점",
    money: "정보를 충분히 확인하고 판단하는 습관",
    work: "정보를 모으고 흐름을 파악하는 활동",
    relationship: "상대의 입장을 이해하려는 관계",
    advice: "충분히 생각했다면 작은 행동부터 시작해 보세요.",
  },
};

const ELEMENT_MEANING: Record<FiveElement, string> = {
  목: "성장과 시작",
  화: "표현과 활동",
  토: "안정과 균형",
  금: "원칙과 정리",
  수: "지혜와 유연함",
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

function createFreeResult(
  data: MyeongunManseryeokResult,
  targetYear: number
): string {
  const element = data.dayMaster.element;
  const description = ELEMENTS[element];

  const counts = Object.entries(data.fiveElements) as [
    FiveElement,
    number
  ][];

  const sorted = [...counts].sort(
    (a, b) => b[1] - a[1]
  );

  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const balanceText =
    strongest[1] === weakest[1]
      ? "다섯 기운의 수량이 비교적 고르게 나타납니다."
      : `${ELEMENT_MEANING[strongest[0]]}을 뜻하는 ${strongest[0]}의 기운이 상대적으로 많이 나타납니다.`;

  const strengthText =
    data.strength.level === "신강"
      ? "자기 주관을 활용하되 주변 의견도 살피는 태도가 도움이 될 수 있습니다."
      : data.strength.level === "신약"
      ? "혼자 모든 일을 감당하기보다 주변의 도움과 충분한 준비를 활용하는 태도가 도움이 될 수 있습니다."
      : "자신의 생각과 주변 상황 사이에서 균형을 찾는 태도가 도움이 될 수 있습니다.";

  const timeNotice = data.time.known
    ? ""
    : "출생시간을 알 수 없어 시주를 제외한 참고 분석이며, 세부 해석에는 제한이 있습니다.";

  const yearAdvice =
    data.strength.level === "신강"
      ? "자신이 주도하는 일과 다른 사람과 협력하는 일 사이의 균형을 살펴보세요."
      : data.strength.level === "신약"
      ? "새로운 계획을 무리하게 늘리기보다 준비와 기반을 점검해 보세요."
      : "지금까지 유지해 온 생활의 균형을 점검하고 필요한 변화를 준비해 보세요.";

  return [
    "## 기본 사주 구성",
    `고객님의 일간은 ${data.dayMaster.stem}이며, 전통 명리에서는 ${element}의 성질과 연결하여 해석합니다. ${balanceText}`,
    timeNotice,

    "## 1. 나의 기본 성향",
    `전통 명리의 ${element} 기운을 바탕으로 보면 ${description.character}을 참고할 수 있습니다. ${strengthText}`,
    `- 강점: ${description.strength}`,
    `- 주의할 점: ${description.caution}`,

    "## 2. 재물·사업 방향",
    `재물과 사업에서는 ${description.money}을 중요하게 생각해 볼 수 있습니다. 실제 재정 판단은 소득과 지출, 사업 환경을 함께 검토해야 합니다.`,
    "재물과 사업의 구체적인 흐름은 전체 사주와 시기를 함께 살펴보는 것이 중요합니다.",

    "## 3. 직업·인간관계 방향",
    `직업에서는 ${description.work}과 관련된 자신의 강점을 돌아볼 수 있습니다.`,
    `인간관계에서는 ${description.relationship}를 생각해 보세요. 다만 실제 적성과 관계는 개인의 경험과 환경에 따라 달라집니다.`,

    `## 4. ${targetYear}년 핵심 방향`,
    `${targetYear}년을 준비하면서 ${yearAdvice}`,
    "이는 특정 연도의 운세를 확정적으로 예측한 내용이 아니라, 기본 사주 성향을 바탕으로 제안하는 생활 방향입니다.",

    "## 무료 분석 한눈에 보기",
    `- ${description.advice}`,
    "- 중요한 선택은 사주 해석뿐 아니라 현실적인 조건과 충분한 정보를 함께 고려해 보세요.",

    "무료 분석에서는 사주의 기본 성향과 핵심 방향까지 안내해 드렸습니다. 재물·사업·직업·인간관계와 앞으로의 세부 흐름을 더 깊게 보고 싶다면 상세 사주에서 확인할 수 있습니다.",
    "",
    "※ 이 분석은 전통 명리 해석을 활용한 참고용 콘텐츠이며, 미래의 결과를 보장하지 않습니다.",
  ]
    .filter(Boolean)
    .join("\n\n");
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
      !body.birth ||
      !body.time ||
      !body.gender ||
      !body.calendar
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

    const result = createFreeResult(
      manseryeok,
      getTargetYear()
    );

    return NextResponse.json({
      result,
      yongshin: manseryeok.yongshin ?? null,
    });
  } catch (error) {
    console.error("fortune API error:", error);

    return NextResponse.json(
      {
        error:
          "사주 정보를 분석하지 못했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
