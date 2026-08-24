"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SajuForm = {
  name: string;
  birth: string;
  time: string;
  gender: string;
  calendar: string;
};

type Section = {
  icon: string;
  title: string;
  intro: string;
  points: string[];
  advice: string;
};

export default function FortuneDetailPage() {
  const [saju, setSaju] = useState<SajuForm | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myeongun_saju");

      if (saved) {
        setSaju(JSON.parse(saved));
      }
    } catch (error) {
      console.error("사주 정보 불러오기 실패:", error);
    }
  }, []);

  const name = saju?.name || "고객";

  const sections: Section[] = [
    {
      icon: "🔮",
      title: "종합 사주",
      intro:
        "타고난 기질과 성향을 바탕으로 인생 전반의 흐름을 살펴봅니다. 자신의 강점을 살리고 약점을 보완하는 방향을 중심으로 해석합니다.",
      points: [
        "책임감과 현실적인 판단을 중요하게 생각하는 성향이 나타납니다.",
        "한 번 결정한 일은 쉽게 포기하기보다 끝까지 결과를 만들어가려는 힘이 있습니다.",
        "경험이 쌓일수록 판단력과 주변의 신뢰가 함께 커지는 흐름입니다.",
        "혼자 모든 것을 해결하려 하기보다 역할을 나누는 것이 장기적으로 유리합니다.",
      ],
      advice:
        "지금까지 쌓아온 경험을 하나의 자산으로 정리하고, 앞으로는 선택과 집중을 통해 힘을 분산시키지 않는 것이 중요합니다.",
    },
    {
      icon: "💰",
      title: "재물운",
      intro:
        "재물운은 한 번의 큰 기회보다 안정적인 수입 구조와 반복 가능한 흐름을 만드는 방향이 중요합니다.",
      points: [
        "경험과 신뢰를 활용한 수입 구조를 만드는 것이 유리합니다.",
        "단기적인 수익보다 장기적으로 남는 거래처와 고객을 확보하는 것이 중요합니다.",
        "사업이나 투자에서는 수익률만큼 현금흐름과 고정비 관리가 중요합니다.",
        "가까운 사람의 부탁이나 감정적인 판단으로 금전 결정을 하는 것은 신중해야 합니다.",
      ],
      advice:
        "돈을 버는 능력뿐 아니라 지키고 관리하는 시스템을 함께 만들어야 재물운이 안정적으로 이어질 수 있습니다.",
    },
    {
      icon: "💼",
      title: "사업운",
      intro:
        "사업에서는 경험과 신뢰를 기반으로 고객이 반복해서 찾을 수 있는 구조를 만드는 것이 중요합니다.",
      points: [
        "전문성과 경험을 활용하는 사업에서 강점을 발휘하기 좋습니다.",
        "처음부터 규모를 크게 키우기보다 작은 성공을 반복하는 방식이 유리합니다.",
        "기존 고객 관리와 재구매 구조를 만드는 것이 신규 고객 확보만큼 중요합니다.",
        "상품이나 서비스의 품질과 신뢰도를 꾸준히 관리하는 것이 장기적인 경쟁력이 됩니다.",
      ],
      advice:
        "사업을 빠르게 확장하기보다 먼저 매출 구조와 고정비를 점검하고, 반복 가능한 시스템을 만든 뒤 규모를 키우는 방향이 좋습니다.",
    },
    {
      icon: "💼",
      title: "직업운",
      intro:
        "직업에서는 경험과 책임감을 활용할 수 있는 분야에서 강점을 발휘하기 좋습니다.",
      points: [
        "조직 운영, 관리, 기획과 같이 책임과 판단이 필요한 업무에 강점이 있습니다.",
        "재무·품질·감사·법무 보조와 같이 꼼꼼함이 필요한 업무도 잘 맞을 수 있습니다.",
        "건설·부동산·제조·기술·교육·컨설팅처럼 경험이 누적되는 분야가 유리합니다.",
        "단순히 편한 일을 선택하기보다 시간이 지날수록 전문성이 남는 일을 선택하는 것이 좋습니다.",
      ],
      advice:
        "직업 선택에서는 단기적인 조건보다 3~5년 뒤 자신의 경험과 전문성이 얼마나 커져 있을지를 기준으로 판단하는 것이 좋습니다.",
    },
    {
      icon: "❤️",
      title: "인연운",
      intro:
        "인간관계에서는 말보다 행동으로 신뢰를 보여주는 편이며, 가까운 사람에게 책임감이 강하게 나타날 수 있습니다.",
      points: [
        "한 번 신뢰한 사람에게 오래 책임을 다하려는 성향이 있습니다.",
        "처음에는 자신의 속마음을 쉽게 드러내지 않을 수 있습니다.",
        "가까운 관계일수록 상대에게 원하는 기준을 명확하게 전달하는 것이 좋습니다.",
        "문제가 생겼을 때 혼자 판단하기보다 먼저 상대의 이야기를 듣는 것이 관계 유지에 도움이 됩니다.",
      ],
      advice:
        "책임감과 배려가 장점이지만 모든 부담을 혼자 떠안지 않는 것이 중요합니다. 관계에서도 적절한 선과 역할을 정하는 것이 필요합니다.",
    },
    {
      icon: "📅",
      title: "2026년 운세",
      intro:
        "2026년은 지금까지의 경험을 정리하고 앞으로의 방향을 구체화하는 해로 활용하는 것이 좋습니다.",
      points: [
        "경험과 전문성을 인정받을 가능성이 커지는 흐름입니다.",
        "새로운 일을 시작한다면 충분한 검토와 준비를 거친 뒤 움직이는 것이 좋습니다.",
        "사업에서는 기존 고객과 거래처를 안정적으로 관리하는 것이 중요합니다.",
        "재물에서는 무리한 확장보다 현금흐름과 지출 구조를 점검하는 것이 유리합니다.",
        "자격·교육·전문성 강화와 같은 자기계발은 이후의 기회를 준비하는 데 도움이 됩니다.",
      ],
      advice:
        "2026년에는 무조건 빠르게 움직이기보다 자신에게 맞는 기회를 선별하고, 이미 가진 경험을 새로운 수입과 성장으로 연결하는 전략이 중요합니다.",
    },
    {
      icon: "🧭",
      title: "앞으로의 10년 흐름",
      intro:
        "장기적으로는 경험이 자산으로 전환되고, 한 분야에서 쌓아온 신뢰가 새로운 기회를 만들어가는 방향을 중요하게 볼 수 있습니다.",
      points: [
        "초기에는 기존 경험과 기술을 정리하는 과정이 중요합니다.",
        "중기에는 전문성과 신뢰를 활용해 새로운 수입원을 만드는 흐름이 유리합니다.",
        "장기적으로는 직접 모든 일을 하는 방식보다 시스템과 사람을 활용하는 방식이 중요해집니다.",
        "경험을 기록하고 체계화하면 이후 사업이나 교육·컨설팅 형태로 확장할 가능성이 있습니다.",
      ],
      advice:
        "앞으로는 '내가 직접 하는 것'에서 '내 경험이 계속 수익을 만들어내는 구조'로 전환하는 것이 장기적인 핵심 과제가 될 수 있습니다.",
    },
  ];

  return (
    <main className="detailPage">
      <div className="detailWrap">
        <header className="pageHeader">
          <div className="eyebrow">MYEONGUN PREMIUM</div>

          <h1>{name}님의 상세 사주 분석</h1>

          <p>
            입력하신 사주 정보를 바탕으로
            <br />
            재물 · 사업 · 직업 · 인연 · 앞으로의 흐름을 자세히 살펴봅니다.
          </p>
        </header>

        {saju && (
          <section className="sajuInfo">
            <div className="infoEyebrow">YOUR SAJU</div>

            <h2>{saju.name}님의 사주 정보</h2>

            <div className="infoGrid">
              <div>
                <span>생년월일</span>
                <strong>{saju.birth}</strong>
              </div>

              <div>
                <span>출생시간</span>
                <strong>{saju.time}</strong>
              </div>

              <div>
                <span>성별</span>
                <strong>{saju.gender}</strong>
              </div>

              <div>
                <span>달력</span>
                <strong>{saju.calendar}</strong>
              </div>
            </div>
          </section>
        )}

        <section className="summaryCard">
          <div className="sectionEyebrow">MYEONGUN SUMMARY</div>

          <h2>{name}님의 종합 사주 흐름</h2>

          <p>
            지금까지 쌓아온 경험과 책임감이 앞으로의 중요한 자산이 되는
            흐름입니다. 단기적인 결과에만 집중하기보다 자신의 경험을
            정리하고 반복 가능한 구조로 만드는 것이 중요합니다.
          </p>

          <div className="summaryGrid">
            <div>
              <strong>강점</strong>
              <span>책임감 · 경험 · 실행력</span>
            </div>

            <div>
              <strong>주의할 점</strong>
              <span>과도한 부담 · 성급한 결정</span>
            </div>

            <div>
              <strong>기회</strong>
              <span>전문성 · 신뢰 · 사업 확장</span>
            </div>

            <div>
              <strong>핵심 방향</strong>
              <span>경험을 자산으로 전환</span>
            </div>
          </div>
        </section>

        <div className="sectionList">
          {sections.map((section) => (
            <article className="contentCard" key={section.title}>
              <div className="cardTitle">
                <span className="cardIcon">{section.icon}</span>
                <h2>{section.title}</h2>
              </div>

              <p className="intro">{section.intro}</p>

              <div className="divider" />

              <ul>
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              <div className="adviceBox">
                <strong>명운의 조언</strong>
                <p>{section.advice}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="finalAdvice">
          <div className="finalEyebrow">MYEONGUN ADVICE</div>

          <h2>{name}님께 드리는 핵심 조언</h2>

          <p>
            기회를 기다리기보다 준비된 사람이 기회를 잡습니다.
            <br />
            지금까지 쌓아온 경험을 정리하고,
            <br />
            잘할 수 있는 분야에 집중하는 것이 앞으로의 중요한 방향입니다.
          </p>

          <div className="adviceSteps">
            <div>
              <span>01</span>
              <strong>경험 정리</strong>
              <small>지금까지 쌓아온 경험과 능력을 자산으로 정리합니다.</small>
            </div>

            <div>
              <span>02</span>
              <strong>선택과 집중</strong>
              <small>잘할 수 있는 분야를 좁히고 불필요한 일을 줄입니다.</small>
            </div>

            <div>
              <span>03</span>
              <strong>구조 만들기</strong>
              <small>반복 가능한 수입과 사업 구조를 만들어갑니다.</small>
            </div>

            <div>
              <span>04</span>
              <strong>자산으로 전환</strong>
              <small>경험과 신뢰가 지속적인 기회로 연결되도록 합니다.</small>
            </div>
          </div>
        </section>

        <div className="notice">
          ※ 본 결과는 전통 사주 명리의 관점을 참고한 AI 분석이며,
          미래를 확정적으로 예측하거나 투자·사업·재정 등의 결과를
          보장하는 내용은 아닙니다.
        </div>

        <div className="backButton">
          <Link href="/saju">나의 사주 다시 보기</Link>
        </div>
      </div>

      <style jsx>{`
        .detailPage {
          min-height: 100vh;
          background: #f5f1e8;
          padding: 70px 20px 100px;
          color: #3e403b;
        }

        .detailWrap {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .pageHeader {
          text-align: center;
          margin-bottom: 45px;
        }

        .eyebrow,
        .infoEyebrow,
        .sectionEyebrow,
        .finalEyebrow {
          color: #b08a3e;
          font-size: 11px;
          letter-spacing: 3px;
          font-weight: 600;
        }

        .eyebrow {
          margin-bottom: 15px;
        }

        .pageHeader h1 {
          margin: 0;
          color: #20251f;
          font-size: 38px;
          line-height: 1.35;
          font-weight: 600;
        }

        .pageHeader p {
          margin: 18px 0 0;
          color: #77746d;
          font-size: 14px;
          line-height: 1.9;
        }

        .sajuInfo {
          background: #20251f;
          color: #fff;
          border-radius: 20px;
          padding: 30px 34px;
          margin-bottom: 25px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
        }

        .sajuInfo h2 {
          margin: 12px 0 22px;
          font-size: 24px;
          font-weight: 600;
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .infoGrid div {
          padding: 14px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }

        .infoGrid span {
          display: block;
          color: #c9c9c5;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .infoGrid strong {
          display: block;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
        }

        .summaryCard,
        .contentCard {
          background: #fffdf8;
          border: 1px solid #ddd3c2;
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.035);
        }

        .summaryCard {
          padding: 35px;
          margin-bottom: 20px;
        }

        .summaryCard h2 {
          color: #20251f;
          font-size: 25px;
          margin: 10px 0 15px;
        }

        .summaryCard > p {
          color: #666;
          line-height: 1.9;
          margin: 0;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 25px;
        }

        .summaryGrid div {
          background: #f7f2e8;
          border-radius: 12px;
          padding: 16px;
        }

        .summaryGrid strong {
          display: block;
          color: #806126;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .summaryGrid span {
          display: block;
          color: #555;
          font-size: 13px;
          line-height: 1.5;
        }

        .sectionList {
          display: grid;
          gap: 20px;
        }

        .contentCard {
          padding: 32px 35px;
        }

        .cardTitle {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cardIcon {
          font-size: 22px;
        }

        .cardTitle h2 {
          margin: 0;
          color: #20251f;
          font-size: 23px;
          font-weight: 600;
        }

        .intro {
          margin: 17px 0 0;
          color: #666;
          font-size: 14px;
          line-height: 1.9;
        }

        .divider {
          height: 1px;
          background: #e5ddcf;
          margin: 22px 0;
        }

        .contentCard ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .contentCard li {
          position: relative;
          padding-left: 19px;
          margin-bottom: 12px;
          color: #555;
          font-size: 14px;
          line-height: 1.8;
        }

        .contentCard li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #b08a3e;
          font-weight: 700;
        }

        .adviceBox {
          margin-top: 24px;
          padding: 18px 20px;
          background: #f7f2e8;
          border-radius: 12px;
        }

        .adviceBox strong {
          color: #806126;
          font-size: 12px;
        }

        .adviceBox p {
          margin: 8px 0 0;
          color: #5f5d58;
          font-size: 13px;
          line-height: 1.8;
        }

        .finalAdvice {
          margin-top: 30px;
          padding: 42px 35px;
          background: #20251f;
          color: #fff;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
        }

        .finalAdvice h2 {
          margin: 12px 0 15px;
          font-size: 27px;
          font-weight: 600;
        }

        .finalAdvice > p {
          margin: 0;
          color: #e7e7e3;
          font-size: 14px;
          line-height: 2;
        }

        .adviceSteps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 30px;
          text-align: left;
        }

        .adviceSteps div {
          padding: 18px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }

        .adviceSteps span {
          display: block;
          color: #d0aa58;
          font-size: 11px;
          letter-spacing: 1px;
          margin-bottom: 9px;
        }

        .adviceSteps strong {
          display: block;
          color: #fff;
          font-size: 14px;
          margin-bottom: 7px;
        }

        .adviceSteps small {
          display: block;
          color: #c7c7c2;
          font-size: 11px;
          line-height: 1.6;
        }

        .notice {
          margin-top: 18px;
          padding: 15px 18px;
          border-radius: 10px;
          background: #eee8dc;
          color: #89847a;
          font-size: 11px;
          line-height: 1.7;
        }

        .backButton {
          text-align: center;
          margin-top: 30px;
        }

        .backButton a {
          display: inline-block;
          padding: 15px 42px;
          border-radius: 10px;
          background: #20251f;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        @media (max-width: 700px) {
          .detailPage {
            padding: 45px 14px 70px;
          }

          .pageHeader h1 {
            font-size: 29px;
          }

          .sajuInfo,
          .summaryCard,
          .contentCard,
          .finalAdvice {
            padding: 25px 20px;
            border-radius: 16px;
          }

          .infoGrid,
          .summaryGrid,
          .adviceSteps {
            grid-template-columns: repeat(2, 1fr);
          }

          .contentCard li {
            font-size: 13px;
          }
        }

        @media (max-width: 450px) {
          .infoGrid,
          .summaryGrid,
          .adviceSteps {
            grid-template-columns: 1fr;
          }

          .pageHeader h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </main>
  );
}