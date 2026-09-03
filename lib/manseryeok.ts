import {
  calculateSaju,
  lunarToSolar,
  solarToLunar,
} from "@fullstackfamily/manseryeok";

export type CalendarType =
  | "양력"
  | "음력"
  | "음력(평달)"
  | "음력(윤달)";

export type FiveElement = "목" | "화" | "토" | "금" | "수";
export type YinYang = "양" | "음";

export type MyeongunSajuInput = {
  birth: string;
  time?: string;
  calendar?: string;
};

export type PillarDetail = {
  pillar: string;
  stem: string;
  branch: string;
  stemElement: FiveElement;
  branchElement: FiveElement;
  stemYinYang: YinYang;
  branchYinYang: YinYang;
  tenGodStem: string;
};

export type MyeongunManseryeokResult = {
  input: {
    birth: string;
    time: string | null;
    calendar: CalendarType;
  };

  solar: {
    year: number;
    month: number;
    day: number;
  };

  lunar: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };

  pillars: {
    year: PillarDetail;
    month: PillarDetail;
    day: PillarDetail;
    hour: PillarDetail | null;
  };

  dayMaster: {
    stem: string;
    element: FiveElement;
    yinYang: YinYang;
  };

  fiveElements: {
    목: number;
    화: number;
    토: number;
    금: number;
    수: number;
  };

  time: {
    known: boolean;
    calculatedHour: number | null;
    calculatedMinute: number | null;
    source: "exact" | "range-midpoint" | "unknown";
    corrected: boolean;
    correctedHour: number | null;
    correctedMinute: number | null;
  };
};

const STEM_INFO: Record<
  string,
  { element: FiveElement; yinYang: YinYang }
> = {
  갑: { element: "목", yinYang: "양" },
  을: { element: "목", yinYang: "음" },
  병: { element: "화", yinYang: "양" },
  정: { element: "화", yinYang: "음" },
  무: { element: "토", yinYang: "양" },
  기: { element: "토", yinYang: "음" },
  경: { element: "금", yinYang: "양" },
  신: { element: "금", yinYang: "음" },
  임: { element: "수", yinYang: "양" },
  계: { element: "수", yinYang: "음" },
};

const BRANCH_INFO: Record<
  string,
  { element: FiveElement; yinYang: YinYang }
> = {
  자: { element: "수", yinYang: "양" },
  축: { element: "토", yinYang: "음" },
  인: { element: "목", yinYang: "양" },
  묘: { element: "목", yinYang: "음" },
  진: { element: "토", yinYang: "양" },
  사: { element: "화", yinYang: "음" },
  오: { element: "화", yinYang: "양" },
  미: { element: "토", yinYang: "음" },
  신: { element: "금", yinYang: "양" },
  유: { element: "금", yinYang: "음" },
  술: { element: "토", yinYang: "양" },
  해: { element: "수", yinYang: "음" },
};

function normalizeCalendar(value?: string): CalendarType {
  const calendar = String(value || "양력").trim();

  if (calendar === "음력(윤달)") {
    return "음력(윤달)";
  }

  if (calendar === "음력(평달)") {
    return "음력(평달)";
  }

  if (calendar === "음력") {
    // 기존 명운 사용자 데이터와의 호환을 위해
    // 예전 "음력" 값은 평달로 처리합니다.
    return "음력";
  }

  return "양력";
}

function parseBirth(value: string) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (!match) {
    throw new Error("생년월일 형식이 올바르지 않습니다.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error("생년월일을 다시 확인해 주세요.");
  }

  return { year, month, day };
}

function minutesToClock(totalMinutes: number) {
  const normalized =
    ((Math.round(totalMinutes) % 1440) + 1440) % 1440;

  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}

function parseBirthTime(value?: string): {
  known: boolean;
  hour: number | null;
  minute: number | null;
  source: "exact" | "range-midpoint" | "unknown";
} {
  const text = String(value || "").trim();

  if (!text || text === "모름") {
    return {
      known: false,
      hour: null,
      minute: null,
      source: "unknown",
    };
  }

  const exact = text.match(/^(\d{1,2}):(\d{2})$/);

  if (exact) {
    const hour = Number(exact[1]);
    const minute = Number(exact[2]);

    if (
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      return {
        known: true,
        hour,
        minute,
        source: "exact",
      };
    }
  }

  const range = text.match(
    /(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})/
  );

  if (range) {
    const startHour = Number(range[1]);
    const startMinute = Number(range[2]);
    const endHour = Number(range[3]);
    const endMinute = Number(range[4]);

    let start = startHour * 60 + startMinute;
    let end = endHour * 60 + endMinute;

    if (end < start) {
      end += 1440;
    }

    const midpoint = start + (end - start) / 2;
    const clock = minutesToClock(midpoint);

    return {
      known: true,
      hour: clock.hour,
      minute: clock.minute,
      source: "range-midpoint",
    };
  }

  return {
    known: false,
    hour: null,
    minute: null,
    source: "unknown",
  };
}

function getTenGod(
  dayStem: string,
  targetStem: string
): string {
  const day = STEM_INFO[dayStem];
  const target = STEM_INFO[targetStem];

  if (!day || !target) {
    return "-";
  }

  const samePolarity = day.yinYang === target.yinYang;

  if (day.element === target.element) {
    return samePolarity ? "비견" : "겁재";
  }

  const generates: Record<FiveElement, FiveElement> = {
    목: "화",
    화: "토",
    토: "금",
    금: "수",
    수: "목",
  };

  const controls: Record<FiveElement, FiveElement> = {
    목: "토",
    화: "금",
    토: "수",
    금: "목",
    수: "화",
  };

  if (generates[day.element] === target.element) {
    return samePolarity ? "식신" : "상관";
  }

  if (generates[target.element] === day.element) {
    return samePolarity ? "편인" : "정인";
  }

  if (controls[day.element] === target.element) {
    return samePolarity ? "편재" : "정재";
  }

  if (controls[target.element] === day.element) {
    return samePolarity ? "편관" : "정관";
  }

  return "-";
}

function makePillar(
  pillar: string,
  dayStem: string
): PillarDetail {
  if (!pillar || pillar.length < 2) {
    throw new Error("사주 기둥 계산 결과가 올바르지 않습니다.");
  }

  const stem = pillar.charAt(0);
  const branch = pillar.charAt(1);

  const stemInfo = STEM_INFO[stem];
  const branchInfo = BRANCH_INFO[branch];

  if (!stemInfo || !branchInfo) {
    throw new Error(
      `지원하지 않는 간지 값입니다: ${pillar}`
    );
  }

  return {
    pillar,
    stem,
    branch,
    stemElement: stemInfo.element,
    branchElement: branchInfo.element,
    stemYinYang: stemInfo.yinYang,
    branchYinYang: branchInfo.yinYang,
    tenGodStem: getTenGod(dayStem, stem),
  };
}

function countFiveElements(
  pillars: Array<PillarDetail | null>
) {
  const result = {
    목: 0,
    화: 0,
    토: 0,
    금: 0,
    수: 0,
  };

  for (const pillar of pillars) {
    if (!pillar) continue;

    result[pillar.stemElement] += 1;
    result[pillar.branchElement] += 1;
  }

  return result;
}

export function calculateMyeongunManseryeok(
  input: MyeongunSajuInput
): MyeongunManseryeokResult {
  const birth = parseBirth(input.birth);
  const calendar = normalizeCalendar(input.calendar);
  const birthTime = parseBirthTime(input.time);

  let solar = {
    year: birth.year,
    month: birth.month,
    day: birth.day,
  };

  if (
    calendar === "음력" ||
    calendar === "음력(평달)" ||
    calendar === "음력(윤달)"
  ) {
    const converted = lunarToSolar(
      birth.year,
      birth.month,
      birth.day,
      calendar === "음력(윤달)"
    );

    solar = {
      year: converted.solar.year,
      month: converted.solar.month,
      day: converted.solar.day,
    };
  }

  const lunarResult = solarToLunar(
    solar.year,
    solar.month,
    solar.day
  );

  const saju = calculateSaju(
    solar.year,
    solar.month,
    solar.day,
    birthTime.known && birthTime.hour !== null
      ? birthTime.hour
      : undefined,
    birthTime.known && birthTime.minute !== null
      ? birthTime.minute
      : undefined,
    {
      longitude: 127,
      applyTimeCorrection: true,
    }
  );

  const dayStem = saju.dayPillar.charAt(0);

  if (!STEM_INFO[dayStem]) {
    throw new Error("일간을 계산하지 못했습니다.");
  }

  const yearPillar = makePillar(
    saju.yearPillar,
    dayStem
  );

  const monthPillar = makePillar(
    saju.monthPillar,
    dayStem
  );

  const dayPillar = makePillar(
    saju.dayPillar,
    dayStem
  );

  const hourPillar = saju.hourPillar
    ? makePillar(saju.hourPillar, dayStem)
    : null;

  const fiveElements = countFiveElements([
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
  ]);

  return {
    input: {
      birth: input.birth,
      time: input.time ? String(input.time) : null,
      calendar,
    },

    solar,

    lunar: {
      year: lunarResult.lunar.year,
      month: lunarResult.lunar.month,
      day: lunarResult.lunar.day,
      isLeapMonth: lunarResult.lunar.isLeapMonth,
    },

    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },

    dayMaster: {
      stem: dayStem,
      element: STEM_INFO[dayStem].element,
      yinYang: STEM_INFO[dayStem].yinYang,
    },

    fiveElements,

    time: {
      known: birthTime.known,
      calculatedHour: birthTime.hour,
      calculatedMinute: birthTime.minute,
      source: birthTime.source,
      corrected: saju.isTimeCorrected,
      correctedHour:
        saju.correctedTime?.hour ?? null,
      correctedMinute:
        saju.correctedTime?.minute ?? null,
    },
  };
}