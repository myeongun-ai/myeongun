
import { NextResponse } from "next/server";
import { calculateMyeongunManseryeok } from "../../../../lib/manseryeok";

export const runtime = "nodejs";

type PersonInput = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

type Element = "목" | "화" | "토" | "금" | "수";

const ELEMENTS: Element[] = ["목", "화", "토", "금", "수"];

const GENERATES: Record<Element, Element> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

const CONTROLS: Record<Element, Element> = {
  목: "토",
  화: "금",
  토: "수",
  금: "목",
  수: "화",
};

const TRAITS: Record<
  Element,
  {
    character: string;
    communication: string;
    advice: string;
  }
> = {
  목: {
    character: "성장과 변화를 중요하게 생각하는",
    communication:
      "새로운 생각이나 계획을 함께 이야기할 때 편안함을 느낄 수 있습니다.",
    advice:
      "자신이 원하는 방향을 설명하면서 상대방의 속도도 존중해 보세요.",
  },
  화: {
    character: "표현과 활동을 중요하게 생각하는",
    communication:
      "감정을 적극적으로 표현하고 반응을 나누는 방식을 선호할 수 있습니다.",
    advice:
      "자신의 마음을 표현하되 상대방의 이야기도 끝까지 들어보세요.",
  },
  토: {
    character: "안정과 신뢰를 중요하게 생각하는",
    communication:
      "약속을 지키고 꾸준히 관심을 보여 주는 방식에서 편안함을 느낄 수 있습니다.",
    advice:
      "익숙한 방식만 고집하기보다 상대방의 새로운 제안도 살펴보세요.",
  },
  금: {
    character: "원칙과 책임을 중요하게 생각하는",
    communication:
      "명확하고 솔직한 대화를 통해 신뢰를 쌓는 방식을 선호할 수 있습니다.",
    advice:
      "의견을 전달할 때 옳고 그름뿐 아니라 상대방의 감정도 살펴보세요.",
  },
  수: {
    character: "관찰과 이해를 중요하게 생각하는",
    communication:
      "충분히 생각한 뒤 자신의 마음을 표현하는 방식을 선호할 수 있습니다.",
    advice:
      "상대방의 마음을 살피는 것과 함께 자신의 생각도 분명하게 표현해 보세요.",
  },
};

function isPersonInput(value: unknown): value is PersonInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const person = value as Record<string, unknown>;

  return ["name", "birth", "time", "gender", "calendar"].every(
    (key) =>
      typeof person[key] === "string" &&
      (person[key] as string).trim().length > 0
  );
}

function getElementRelationship(
  first: Element,
  second: Element
): {
  title: string;
  strength: string;
  caution: string;
} {
  if (first === second) {
    return {
      title: "비슷한 성향을 이해하기 쉬운 관계",
      strength:
        "두 사람은 전통 오행 관점에서 비슷한 기질을 공유하는 것으로 해석할 수 있습니다. 생각이나 행동 방식에서 공감대를 찾기 쉬울 수 있습니다.",
      caution:
        "반대로 비슷한 고집이나 습관이 겹치면 서로 양보하기 어려운 순간도 생길 수 있습니다.",
    };
  }

  if (GENERATES[first] === second) {
    return {
      title: "서로의 성장을 도울 수 있는 관계",
      strength:
        "전통 오행의 상생 관계에서는 한쪽의 성향이 다른 쪽의 활동을 뒷받침하는 모습으로 해석합니다. 서로의 장점을 살리는 방향을 찾아볼 수 있습니다.",
      caution:
        "한 사람이 계속 맞춰 주는 관계가 되지 않도록 서로의 필요를 균형 있게 살펴보는 것이 좋습니다.",
    };
  }

  if (GENERATES[second] === first) {
    return {
      title: "서로에게 힘이 되어 줄 수 있는 관계",
      strength:
        "전통 오행의 상생 관계에 해당하여 서로의 장점을 북돋는 방향으로 해석할 수 있습니다. 역할과 표현 방식이 달라도 협력할 여지가 있습니다.",
      caution:
        "도움을 주고받는 방식이 한쪽으로 치우치지 않도록 서로의 마음을 확인하는 것이 좋습니다.",
    };
  }

  if (CONTROLS[first] === second) {
    return {
      title: "차이를 조율하며 균형을 찾는 관계",
      strength:
        "전통 오행에서는 서로 다른 기준과 방식이 부딪칠 수 있는 관계로 해석합니다. 그러나 실제 생활에서는 차이를 이해하면 서로 부족한 부분을 돌아보는 계기가 될 수 있습니다.",
      caution:
        "자신의 방식으로 상대방을 바꾸려 하기보다 서로의 판단 기준을 존중하는 것이 중요합니다.",
    };
  }

  if (CONTROLS[second] === first) {
    return {
      title: "서로 다른 관점을 이해하는 관계",
      strength:
        "전통 오행에서는 서로의 기질이 긴장을 만들 수 있는 관계로 해석합니다. 다만 성향이 다르다는 사실이 실제 관계의 좋고 나쁨을 결정하지는 않습니다.",
      caution:
        "의견이 다를 때 어느 한쪽의 기준만 따르기보다 함께 받아들일 수 있는 방법을 찾아보세요.",
    };
  }

  return {
    title: "서로의 차이를 살펴보는 관계",
    strength:
      "두 사람의 성향을 비교하면서 공통점과 차이점을 이해하는 것이 중요합니다.",
    caution:
      "실제 관계에서는 대화와 신뢰, 생활환경을 함께 살펴보세요.",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const me: unknown = body?.me;
    const partner: unknown = body?.partner;

    if (!isPersonInput(me) || !isPersonInput(partner)) {
      return NextResponse.json(
        {
          error:
            "두 사람의 이름, 생년월일, 출생시간, 성별, 달력 기준을 모두 입력해 주세요.",
        },
        { status: 400 }
      );
    }

    const meManseryeok = calculateMyeongunManseryeok({
      birth: me.birth,
      time: me.time,
      calendar: me.calendar,
    });

    const partnerManseryeok = calculateMyeongunManseryeok({
      birth: partner.birth,
      time: partner.time,
      calendar: partner.calendar,
    });

    const meElement =
      meManseryeok.dayMaster.element as Element;

    const partnerElement =
      partnerManseryeok.dayMaster.element as Element;

    if (
      !ELEMENTS.includes(meElement) ||
      !ELEMENTS.includes(partnerElement)
    ) {
      return NextResponse.json(
        { error: "궁합 해석에 필요한 오행 정보를 확인하지 못했습니다." },
        { status: 500 }
      );
    }

    const meTrait = TRAITS[meElement];
    const partnerTrait = TRAITS[partnerElement];

    const relationship = getElementRelationship(
      meElement,
      partnerElement
    );

    const sameElement = meElement === partnerElement;

    const strengthNotice =
      meManseryeok.strength.level ===
      partnerManseryeok.strength.level
        ? "두 사람은 신강·신약 참고 분류가 같습니다. 다만 이 분류만으로 실제 성격이나 관계의 결과를 판단할 수는 없습니다."
        : "두 사람은 신강·신약 참고 분류에 차이가 있습니다. 이를 우열로 해석하기보다 서로의 생활 방식과 의사결정 차이를 살펴보는 계기로 활용해 보세요.";

    const timeNotice =
      !meManseryeok.pillars.hour ||
      !partnerManseryeok.pillars.hour
        ? "두 사람 중 출생시간을 모르는 경우가 있어 시주를 제외한 참고 분석이며, 세부 해석에는 제한이 있습니다."
        : "";

    const result = [
      "# 명운 무료 궁합 분석",

      "## 1. 두 사람의 기본 궁합",
      `${me.name}님은 전통 명리에서 ${meElement}의 기운과 연결되는 ${meTrait.character} 성향으로 참고할 수 있습니다.`,
      `${partner.name}님은 ${partnerElement}의 기운과 연결되는 ${partnerTrait.character} 성향으로 참고할 수 있습니다.`,
      `두 사람의 오행 관계는 **${relationship.title}**로 설명할 수 있습니다.`,
      relationship.strength,
      relationship.caution,

      "## 2. 감정과 대화 궁합",
      `${me.name}님은 ${meTrait.communication}`,
      `${partner.name}님은 ${partnerTrait.communication}`,
      sameElement
        ? "비슷한 표현 방식이 서로를 이해하는 데 도움이 될 수 있지만, 상대방도 항상 같은 마음이라고 단정하지 않는 것이 좋습니다."
        : "표현 방식이 다를 때는 상대방의 반응을 자신의 기준으로만 판단하지 않는 것이 좋습니다.",
      strengthNotice,

      "## 3. 서로에게 필요한 한 가지",
      `- **${me.name}님:** ${meTrait.advice}`,
      `- **${partner.name}님:** ${partnerTrait.advice}`,

      "## 무료 궁합 한눈에 보기",
      `두 사람은 ${relationship.title}라는 관점에서 서로의 특징을 돌아볼 수 있습니다.`,
      "관계에서 중요한 것은 궁합의 좋고 나쁨을 단정하는 것보다 서로의 차이를 이해하고 신뢰를 쌓는 일입니다.",
      timeNotice,
      "무료 궁합에서는 두 사람의 기본 성향과 관계의 핵심 방향을 안내해 드렸습니다. 결혼·장기 관계, 재물·생활 궁합과 더 깊은 개인별 해석은 상세 사주 분석에서 확인해 보세요.",
      "",
      "※ 이 분석은 전통 명리의 일간과 오행 관계를 활용한 참고용 콘텐츠입니다. 실제 관계의 결과를 예측하거나 보장하지 않습니다.",
    ]
      .filter(Boolean)
      .join("\n\n");

    return NextResponse.json({
      ok: true,
      result,
      people: {
        me: {
          name: me.name,
          dayMaster: meManseryeok.dayMaster,
          fiveElements: meManseryeok.fiveElements,
          strength: meManseryeok.strength,
          yongshin: meManseryeok.yongshin,
        },
        partner: {
          name: partner.name,
          dayMaster: partnerManseryeok.dayMaster,
          fiveElements: partnerManseryeok.fiveElements,
          strength: partnerManseryeok.strength,
          yongshin: partnerManseryeok.yongshin,
        },
      },
    });
  } catch (error) {
    console.error("compatibility fortune API error:", error);

    return NextResponse.json(
      {
        error:
          "궁합 분석 중 오류가 발생했습니다. 입력 정보를 확인한 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}
