"use client";

type UsageBenefitsProps = {
  compact?: boolean;
};

export default function UsageBenefits({
  compact = false,
}: UsageBenefitsProps) {
  return (
    <section
      className={`usageBenefits ${compact ? "compact" : ""}`}
      aria-label="결제 및 AI 상담 이용 혜택"
    >
      <div className="usageBenefitsHead">
        <h2>
          <span aria-hidden="true">📣</span>
          결제 및 AI 상담 이용 혜택
        </h2>
        <p>
          무료 AI 상담 3회, 상세 사주 결제 후 7일간 AI 상담 최대
          20회를 이용할 수 있습니다.
        </p>
      </div>

      <div className="usageBenefitsGrid">
        <article className="usageBenefitCard free">
          <span className="usageBenefitLabel">
            <span aria-hidden="true">✨</span>
            무료 AI 상담
          </span>
          <strong>3회 무료 이용</strong>
          <p>
            사주 정보를 입력하면 AI 상담을 무료로 3회 이용할 수
            있습니다.
          </p>
        </article>

        <article className="usageBenefitCard paid">
          <span className="usageBenefitLabel">
            <span aria-hidden="true">👑</span>
            상세 사주 결제 혜택
          </span>
          <strong>7일간 · 최대 20회</strong>
          <p>
            상세 사주 결제 후 7일간 이용권이 유지되며 AI 상담은
            최대 20회 이용할 수 있습니다.
          </p>
        </article>
      </div>

      <style jsx>{`
        .usageBenefits {
          width: min(920px, calc(100% - 32px));
          margin: 34px auto;
          padding: 28px;
          border: 1px solid rgba(231, 167, 183, 0.52);
          border-radius: 22px;
          background:
            linear-gradient(135deg, rgba(255, 244, 247, 0.98), rgba(247, 249, 255, 0.98));
          box-shadow: 0 18px 42px rgba(66, 52, 30, 0.07);
          color: #17243a;
          box-sizing: border-box;
        }

        .usageBenefits.compact {
          width: 100%;
          margin: 28px auto 24px;
        }

        .usageBenefitsHead {
          text-align: center;
        }

        .usageBenefitsHead h2 {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin: 0;
          color: #17243a;
          font-size: 24px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -0.035em;
        }

        .usageBenefitsHead p {
          margin: 9px auto 0;
          color: #697286;
          font-size: 13px;
          line-height: 1.7;
          word-break: keep-all;
        }

        .usageBenefitsGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .usageBenefitCard {
          padding: 22px 18px;
          border-radius: 14px;
          text-align: center;
        }

        .usageBenefitCard.free {
          border: 1px solid #ddd8ff;
          background: linear-gradient(135deg, #f4f0ff 0%, #f0efff 100%);
        }

        .usageBenefitCard.paid {
          border: 1px solid #cfe2ff;
          background: linear-gradient(135deg, #eef7ff 0%, #e9f2ff 100%);
        }

        .usageBenefitLabel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #4f4ab6;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 850;
        }

        .paid .usageBenefitLabel {
          color: #1d61b5;
        }

        .usageBenefitCard strong {
          display: block;
          margin-top: 10px;
          color: #3d35b0;
          font-size: 25px;
          line-height: 1.25;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .paid strong {
          color: #1459ad;
        }

        .usageBenefitCard p {
          margin: 10px auto 0;
          max-width: 320px;
          color: #596273;
          font-size: 12px;
          line-height: 1.65;
          word-break: keep-all;
        }

        @media (max-width: 640px) {
          .usageBenefits {
            width: min(100% - 24px, 920px);
            margin: 24px auto;
            padding: 21px 14px;
            border-radius: 18px;
          }

          .usageBenefits.compact {
            width: 100%;
          }

          .usageBenefitsHead h2 {
            font-size: 20px;
          }

          .usageBenefitsHead p {
            font-size: 12px;
          }

          .usageBenefitsGrid {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 16px;
          }

          .usageBenefitCard {
            padding: 19px 14px;
          }

          .usageBenefitCard strong {
            font-size: 23px;
          }
        }
      `}</style>
    </section>
  );
}