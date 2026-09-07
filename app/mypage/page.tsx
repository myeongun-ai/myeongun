"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedSaju = {
  name?: string;
  birth?: string;
  time?: string;
  gender?: string;
  calendar?: string;
};

export default function MyPage() {
  const [ready, setReady] = useState(false);
  const [saju, setSaju] = useState<SavedSaju | null>(null);

    useEffect(() => {
       try {
         const registered =
            localStorage.getItem("myeongun_my_saju_registered") === "1";

         if   (!registered) {
             setSaju(null);
             return;
         }

         const saved =
            localStorage.getItem("myeongun_saju");

         if    (!saved) {
             setSaju(null);
             return;
         }

         const parsed =
            JSON.parse(saved) as SavedSaju;

          if  (parsed?.birth) {
            setSaju(parsed);
          } else {
            setSaju(null);
          }
        } catch {
          setSaju(null);
        } finally {
          setReady(true);
        }
       }, []);

  const displayName =
    saju?.name?.trim() || "명운 이용자";

  const infoItems = [
    {
      label: "생년월일",
      value: saju?.birth || "등록되지 않음",
    },
    {
      label: "출생시간",
      value: saju?.time || "등록되지 않음",
    },
    {
      label: "성별",
      value: saju?.gender || "등록되지 않음",
    },
    {
      label: "달력 기준",
      value: saju?.calendar || "등록되지 않음",
    },
  ];

  const services = [
    {
      href: "/saju",
      icon: "命",
      title: "나의 사주",
      text: "사주 정보를 입력하고 무료 종합 분석을 확인합니다.",
    },
    {
      href: "/fortune/business",
      icon: "財",
      title: "재물 · 사업",
      text: "재물운과 사업운의 흐름을 확인합니다.",
    },
    {
      href: "/compatibility",
      icon: "緣",
      title: "궁합",
      text: "두 사람의 사주를 바탕으로 궁합을 분석합니다.",
    },
    {
      href: "/fortune/2026",
      icon: "運",
      title: "2026 운세",
      text: "2026년의 전체 흐름과 주요 운세를 확인합니다.",
    },
    {
      href: "/ai",
      icon: "AI",
      title: "명운 AI 상담",
      text: "실제 만세력을 바탕으로 궁금한 내용을 상담합니다.",
    },
  ];

  return (
    <main className="myPage">
      <div className="myInner">
        <section className="hero">
          <span className="eyebrow">
            MY MYEONGUN
          </span>

          <h1>나의 명운</h1>

          <p>
            나의 사주 정보와 명운 서비스를
            한곳에서 편리하게 이용하세요.
          </p>
        </section>

        <section className="profileCard">
          <div className="profileTop">
            <div className="avatar">明</div>

            <div className="profileText">
              <span className="profileLabel">
                MY PROFILE
              </span>

              <h2>
                {ready
                  ? `${displayName}님의 명운`
                  : "나의 명운을 불러오는 중입니다"}
              </h2>

              <p>
                {ready && saju
                  ? "현재 브라우저에 저장된 사주 정보입니다."
                  : "사주 정보를 등록하면 맞춤형 명운 서비스를 이용할 수 있습니다."}
              </p>
            </div>
          </div>

          {ready && saju ? (
            <div className="infoGrid">
              {infoItems.map((item) => (
                <div
                  className="infoItem"
                  key={item.label}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="emptyBox">
              <strong>
                아직 등록된 사주 정보가 없습니다.
              </strong>

              <p>
                먼저 나의 사주 정보를 입력하면
                명운 서비스를 더욱 편리하게 이용할
                수 있습니다.
              </p>

              <Link
                href="/saju"
                className="primaryButton"
              >
                나의 사주 등록하기
              </Link>
            </div>
          )}
        </section>

        <section className="sectionBlock">
          <div className="sectionHeading">
            <span>MY SERVICES</span>
            <h2>명운 서비스</h2>
            <p>
              원하는 분석과 상담 서비스를
              바로 이용할 수 있습니다.
            </p>
          </div>

          <div className="serviceGrid">
            {services.map((service) => (
              <Link
                href={service.href}
                className="serviceCard"
                key={service.href}
              >
                <div className="serviceIcon">
                  {service.icon}
                </div>

                <div>
                  <strong>{service.title}</strong>
                  <p>{service.text}</p>
                </div>

                <span className="arrow">›</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="premiumCard">
          <div className="premiumBadge">
            MYEONGUN PREMIUM
          </div>

          <h2>결제한 상세 사주가 있으신가요?</h2>

          <p>
            결제 완료 후 발급받은 8자리
            재열람 코드를 이용하면 결제한
            상세 사주를 다시 확인할 수 있습니다.
          </p>

          <div className="premiumActions">
            <Link
              href="/payment/reopen"
              className="premiumButton"
            >
              결제한 상세 사주 다시 보기
            </Link>

            <Link
              href="/fortune/detail"
              className="secondaryButton"
            >
              상세 사주 페이지
            </Link>
          </div>

          <small>
            재열람은 기존 결제 정보와 일치하는
            경우에만 가능하며, 발급된 재열람
            코드의 유효기간이 적용됩니다.
          </small>
        </section>

        <section className="noticeCard">
          <strong>나의 명운 이용 안내</strong>

          <p>
            현재 나의 명운은 로그인 계정 방식이
            아니며, 개인정보를 자동으로 불러오지 않습니다.
            사주 정보는 각 서비스에서 직접 입력해 이용해주세요.
            다른 기기에서 결제한 상세 사주를 다시 보려면
            재열람 코드를 이용해 주세요.
          </p>
        </section>
      </div>

      <style jsx>{`
        .myPage {
          min-height: 100vh;
          padding: 54px 20px 80px;
          background:
            radial-gradient(
              circle at top,
              rgba(183, 145, 70, 0.08),
              transparent 32%
            ),
            #f7f3eb;
          color: #262820;
        }

        .myInner {
          width: 100%;
          max-width: 1040px;
          margin: 0 auto;
        }

        .hero {
          max-width: 720px;
          margin: 0 auto 34px;
          text-align: center;
        }

        .eyebrow {
          display: inline-block;
          color: #a47b2c;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2.5px;
        }

        .hero h1 {
          margin: 13px 0 10px;
          color: #20251f;
          font-size: clamp(30px, 5vw, 46px);
          line-height: 1.2;
        }

        .hero p {
          margin: 0;
          color: #777166;
          font-size: 14px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .profileCard {
          padding: 28px;
          border: 1px solid #dfd5c5;
          border-radius: 22px;
          background: rgba(255, 253, 248, 0.96);
          box-shadow: 0 14px 36px rgba(55, 45, 30, 0.06);
        }

        .profileTop {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .avatar {
          display: grid;
          width: 68px;
          height: 68px;
          flex: 0 0 68px;
          place-items: center;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #20251f,
              #464c3f
            );
          color: #d9b866;
          font-family: serif;
          font-size: 28px;
          font-weight: 900;
          box-shadow:
            inset 0 0 0 4px rgba(255, 255, 255, 0.08);
        }

        .profileText {
          min-width: 0;
        }

        .profileLabel {
          color: #a47b2c;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .profileText h2 {
          margin: 6px 0 5px;
          color: #292c25;
          font-size: 22px;
        }

        .profileText p {
          margin: 0;
          color: #7d776d;
          font-size: 13px;
          line-height: 1.7;
          word-break: keep-all;
        }

        .infoGrid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 24px;
        }

        .infoItem {
          min-width: 0;
          padding: 14px;
          border: 1px solid #ebe3d7;
          border-radius: 13px;
          background: #faf7f1;
        }

        .infoItem span {
          display: block;
          margin-bottom: 5px;
          color: #9a9286;
          font-size: 10px;
          font-weight: 800;
        }

        .infoItem strong {
          display: block;
          overflow: hidden;
          color: #3d3d36;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .emptyBox {
          margin-top: 24px;
          padding: 22px;
          border: 1px dashed #d7cab7;
          border-radius: 14px;
          background: #faf7f1;
          text-align: center;
        }

        .emptyBox strong {
          display: block;
          color: #4a463e;
          font-size: 14px;
        }

        .emptyBox p {
          max-width: 520px;
          margin: 8px auto 17px;
          color: #827b70;
          font-size: 12px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .primaryButton,
        .premiumButton,
        .secondaryButton {
          display: inline-flex;
          min-height: 46px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 0 18px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
        }

        .primaryButton {
          background: #20251f;
          color: #fff;
        }

        .sectionBlock {
          margin-top: 48px;
        }

        .sectionHeading {
          margin-bottom: 18px;
        }

        .sectionHeading > span {
          color: #a47b2c;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .sectionHeading h2 {
          margin: 7px 0 5px;
          color: #292c25;
          font-size: 25px;
        }

        .sectionHeading p {
          margin: 0;
          color: #827b70;
          font-size: 13px;
          line-height: 1.7;
        }

        .serviceGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .serviceCard {
          display: grid;
          grid-template-columns: 48px 1fr auto;
          gap: 14px;
          align-items: center;
          padding: 18px;
          border: 1px solid #e0d6c7;
          border-radius: 16px;
          background: #fffdf9;
          color: inherit;
          text-decoration: none;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .serviceCard:hover {
          transform: translateY(-2px);
          border-color: #cbb892;
          box-shadow: 0 12px 26px rgba(55, 45, 30, 0.07);
        }

        .serviceIcon {
          display: grid;
          width: 48px;
          height: 48px;
          place-items: center;
          border-radius: 13px;
          background: #f1e8d7;
          color: #8d6925;
          font-family: serif;
          font-size: 17px;
          font-weight: 900;
        }

        .serviceCard strong {
          display: block;
          color: #3b3c35;
          font-size: 14px;
        }

        .serviceCard p {
          margin: 5px 0 0;
          color: #898277;
          font-size: 11px;
          line-height: 1.65;
          word-break: keep-all;
        }

        .arrow {
          color: #ad9e87;
          font-size: 24px;
          line-height: 1;
        }

        .premiumCard {
          margin-top: 48px;
          padding: 32px;
          border: 1px solid #cdb98e;
          border-radius: 22px;
          background:
            linear-gradient(
              135deg,
              #252a23 0%,
              #353b31 100%
            );
          color: #fff;
          box-shadow: 0 16px 38px rgba(32, 37, 31, 0.13);
        }

        .premiumBadge {
          color: #d6b86b;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .premiumCard h2 {
          margin: 10px 0 8px;
          color: #fff;
          font-size: 24px;
        }

        .premiumCard > p {
          max-width: 680px;
          margin: 0;
          color: #d5d8d1;
          font-size: 13px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .premiumActions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }

        .premiumButton {
          background: #d5b568;
          color: #242820;
        }

        .secondaryButton {
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.07);
          color: #fff;
        }

        .premiumCard small {
          display: block;
          margin-top: 16px;
          color: #aeb4aa;
          font-size: 10px;
          line-height: 1.7;
        }

        .noticeCard {
          margin-top: 18px;
          padding: 20px 22px;
          border: 1px solid #e1d8ca;
          border-radius: 15px;
          background: rgba(255, 253, 248, 0.82);
        }

        .noticeCard strong {
          display: block;
          margin-bottom: 6px;
          color: #575248;
          font-size: 12px;
        }

        .noticeCard p {
          margin: 0;
          color: #8a8378;
          font-size: 11px;
          line-height: 1.8;
          word-break: keep-all;
        }

        @media (max-width: 760px) {
          .myPage {
            padding: 38px 14px 60px;
          }

          .profileCard {
            padding: 21px 17px;
            border-radius: 18px;
          }

          .profileTop {
            align-items: flex-start;
          }

          .avatar {
            width: 56px;
            height: 56px;
            flex-basis: 56px;
            font-size: 23px;
          }

          .profileText h2 {
            font-size: 18px;
          }

          .infoGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .serviceGrid {
            grid-template-columns: 1fr;
          }

          .premiumCard {
            padding: 25px 20px;
            border-radius: 18px;
          }

          .premiumCard h2 {
            font-size: 20px;
          }

          .premiumActions {
            display: grid;
          }

          .premiumButton,
          .secondaryButton {
            width: 100%;
            box-sizing: border-box;
          }
        }

        @media (max-width: 420px) {
          .infoGrid {
            grid-template-columns: 1fr;
          }

          .serviceCard {
            grid-template-columns: 44px 1fr auto;
            padding: 15px 13px;
          }

          .serviceIcon {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </main>
  );
}