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

type RecentAI = {
  usedAt: string;
  question: string;
};

type RecentBusiness = {
  usedAt: string;
  name: string;
};

type RecentCompatibility = {
  date: string;
  meName: string;
  partnerName: string;
};

type Recent2026 = {
  usedAt: string;
  name: string;
};

type RecentSaju = {
  usedAt: string;
  name: string;
};

export default function MyPage() {
  const [ready, setReady] = useState(false);
  const [saju, setSaju] = useState<SavedSaju | null>(null);
  const [recentSaju, setRecentSaju] =
     useState<RecentSaju | null>(null);
  const [recentAI, setRecentAI] = useState<RecentAI | null>(null);
  const [recentBusiness, setRecentBusiness] =
     useState<RecentBusiness | null>(null);
  const [recentCompatibility, setRecentCompatibility] =
     useState<RecentCompatibility | null>(null);
  const [recent2026, setRecent2026] =
     useState<Recent2026 | null>(null);
  const [hasPaidSaju, setHasPaidSaju] = useState(false);
  const [hasPaidSession, setHasPaidSession] = useState(false);

    useEffect(() => {
       try {         
         const savedRecentSaju =
            localStorage.getItem("myeongun_recent_saju");

         if (savedRecentSaju) {
           try {
             const parsedRecentSaju =
                JSON.parse(savedRecentSaju) as RecentSaju;

             if (parsedRecentSaju?.usedAt) {
               setRecentSaju(parsedRecentSaju);
             }
           } catch {
             setRecentSaju(null);
           }
         }

         const savedRecentAI =
            localStorage.getItem("myeongun_recent_ai");

         if (savedRecentAI) {
           try {
             const parsedRecentAI =
                JSON.parse(savedRecentAI) as RecentAI;

             if (parsedRecentAI?.usedAt) {
               setRecentAI(parsedRecentAI);
             }
           } catch {
             setRecentAI(null);
           }
         }

         const savedRecentBusiness =
            localStorage.getItem("myeongun_recent_business");

         if (savedRecentBusiness) {
           try {
             const parsedRecentBusiness =
                JSON.parse(savedRecentBusiness) as RecentBusiness;

             if (parsedRecentBusiness?.usedAt) {
               setRecentBusiness(parsedRecentBusiness);
             }
           } catch {
             setRecentBusiness(null);
           }
         }

         const savedRecentCompatibility =
            localStorage.getItem("myeongun_recent_compatibility");

         if (savedRecentCompatibility) {
           try {
             const parsedRecentCompatibility =
                JSON.parse(savedRecentCompatibility) as RecentCompatibility;

             if (parsedRecentCompatibility?.date) {
               setRecentCompatibility(parsedRecentCompatibility);
             }
           } catch {
             setRecentCompatibility(null);
           }
         }

         const savedRecent2026 =
            localStorage.getItem("myeongun_recent_2026");

         if (savedRecent2026) {
           try {
             const parsedRecent2026 =
                JSON.parse(savedRecent2026) as Recent2026;

             if (parsedRecent2026?.usedAt) {
               setRecent2026(parsedRecent2026);
             }
           } catch {
             setRecent2026(null);
           }
         }

         const paidSaju =
            localStorage.getItem("myeongun_paid_saju");

         const paidSession =
            sessionStorage.getItem("myeongun_session_active") === "1";

         setHasPaidSaju(Boolean(paidSaju));
         setHasPaidSession(paidSession);

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

  useEffect(() => {
    const paidSaju =
      localStorage.getItem("myeongun_paid_saju");

    if (!paidSaju) {
      setHasPaidSession(false);
      sessionStorage.removeItem("myeongun_session_active");
      return;
    }

    try {
      const parsedPaidSaju =
        JSON.parse(paidSaju) as SavedSaju;

      fetch("/api/payment/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          saju: parsedPaidSaju,
        }),
      })
        .then(async (response) => {
          const result = await response.json();

          if (response.ok && result?.paid) {
            setHasPaidSession(true);
            sessionStorage.setItem(
              "myeongun_session_active",
              "1"
            );
          } else {
            setHasPaidSession(false);
            sessionStorage.removeItem(
              "myeongun_session_active"
            );
          }
        })
        .catch(() => {
          setHasPaidSession(false);
          sessionStorage.removeItem(
            "myeongun_session_active"
          );
        });
    } catch {
      setHasPaidSession(false);
      sessionStorage.removeItem("myeongun_session_active");
    }
  }, []);

  const displayName =
    saju?.name?.trim() || "명운 이용자";

function removeMySaju() {
  localStorage.removeItem("myeongun_my_saju_registered");
  localStorage.removeItem("myeongun_saju");
  localStorage.removeItem("myeongun_saju_result");

  setSaju(null);
}

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
      text: saju && recentSaju
        ? `최근 분석 · ${new Date(recentSaju.usedAt).toLocaleDateString("ko-KR")} · ${recentSaju.name}`
        : "사주 정보를 입력하고 무료 종합 분석을 확인합니다.",
    },
    {
      href: "/fortune/business",
      icon: "財",
      title: "재물 · 사업",
      text: saju && recentBusiness
        ? `최근 분석 · ${new Date(recentBusiness.usedAt).toLocaleDateString("ko-KR")} · ${recentBusiness.name}`
        : "재물운과 사업운의 흐름을 확인합니다.",
    },
    {
      href: "/compatibility",
      icon: "緣",
      title: "궁합",
      text: saju && recentCompatibility
        ? `최근 분석 · ${new Date(recentCompatibility.date).toLocaleDateString("ko-KR")} · ${recentCompatibility.meName} ↔ ${recentCompatibility.partnerName}`
        : "두 사람의 사주를 바탕으로 궁합을 분석합니다.",
    },
    {
      href: "/fortune/2026",
      icon: "運",
      title: "2026 운세",
      text: saju && recent2026
        ? `최근 분석 · ${new Date(recent2026.usedAt).toLocaleDateString("ko-KR")} · ${recent2026.name}`
        : "2026년의 전체 흐름과 주요 운세를 확인합니다.",
    },
    {
      href: "/ai",
      icon: "AI",
      title: "명운 AI 상담",
      text: saju && recentAI
         ? `최근 상담 · ${new Date(recentAI.usedAt).toLocaleDateString("ko-KR")} · ${recentAI.question}`
         : "실제 만세력을 바탕으로 궁금한 내용을 상담합니다.",
    },
    {
      href:
        !saju
          ? "/saju"
          : hasPaidSaju && hasPaidSession
            ? "/fortune/detail"
            : hasPaidSaju
              ? "/payment/reopen"
              : "/payment",
      icon: "貴",
      title: saju && hasPaidSaju
  ? "결제한 상세 사주"
  : "상세 사주 분석",
text:
  saju && hasPaidSaju && hasPaidSession
    ? "결제한 상세 사주를 바로 확인할 수 있습니다."
    : saju && hasPaidSaju
      ? "재열람 코드를 입력해 결제한 상세 사주를 다시 확인합니다."
      : "더 깊고 자세한 프리미엄 사주 분석을 이용할 수 있습니다.",
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
              <button
                type="button"
                className="removeSajuButton"
                onClick={removeMySaju}
              >
                나의 사주 정보 삭제
              </button>
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

        {ready && saju && <section className="premiumCard">
          <div className="premiumBadge">
            MYEONGUN PREMIUM
          </div>

          <h2>
            {hasPaidSaju
              ? hasPaidSession
                ? "결제한 상세 사주가 있습니다."
                : "결제한 상세 사주를 다시 보시겠어요?"
              : "상세 사주 분석이 필요하신가요?"}
          </h2>

          <p>
            {hasPaidSaju
              ? hasPaidSession
                ? "현재 7일 이용권이 유효합니다. 결제한 상세 사주를 바로 확인할 수 있습니다."
                : "결제 기록이 있습니다. 유효한 재열람 코드를 입력하면 상세 사주를 다시 확인할 수 있습니다."
              : "무료 분석보다 더 깊고 자세한 프리미엄 상세 사주 분석을 이용할 수 있습니다."}
          </p>

          <div className="premiumActions">
            <Link
              href={
                hasPaidSaju
                  ? hasPaidSession
                    ? "/fortune/detail"
                    : "/payment/reopen"
                  : saju?.birth ? "/payment" : "/saju"
              }
              className="premiumButton"
              style={{
                display: "inline-flex",
                minHeight: "46px",
                padding: "0 20px",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                border: "1px solid #d5b568",
                borderRadius: "11px",
                background: "#d5b568",
                color: "#242820",
                fontSize: "12px",
                fontWeight: 800,
                lineHeight: 1.4,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              {hasPaidSaju
                ? hasPaidSession
                  ? "결제한 상세 사주 바로 보기"
                  : "재열람 코드로 다시 보기"
                : "상세 사주 결제하기"}
            </Link>

            {hasPaidSaju && hasPaidSession && (
              <Link
                href="/payment/reopen"
                className="secondaryButton"
                style={{
                  display: "inline-flex",
                  minHeight: "46px",
                  padding: "0 20px",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  border: "1px solid rgba(255, 255, 255, 0.32)",
                  borderRadius: "11px",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  lineHeight: 1.4,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                재열람 코드로 다시 보기
              </Link>
            )}
          </div>

          <small>
            {hasPaidSaju
              ? hasPaidSession
                ? "상세 사주 이용권은 결제일로부터 7일 동안 유효합니다."
                : "재열람은 결제 정보와 일치하고 재열람 코드가 유효한 경우에만 가능합니다."
              : "상세 사주 결제 금액은 9,900원이며, 결제 후 7일 동안 이용할 수 있습니다."}
          </small>
        </section>}

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
            1fr 1.35fr 0.9fr 0.9fr;
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
          color: #3d3d36;
          font-size: 13px;
          line-height: 1.5;
          white-space: normal;
          word-break: keep-all;
          overflow-wrap: anywhere;
        }

        .removeSajuButton {
          grid-column: 1 / -1;
          justify-self: end;
          margin-top: 4px;
          padding: 9px 14px;
          border: 1px solid #d9cdbc;
          border-radius: 9px;
          background: transparent;
          color: #8a7560;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
         }

         .removeSajuButton:hover {
           border-color: #b99a69;
           background: #faf5eb;
           color: #6f552d;
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
          grid-template-columns: 44px 1fr auto;
          gap: 13px;
          align-items: center;
          min-height: 82px;
          box-sizing: border-box;
          padding: 14px 16px;
          border: 1px solid #e0d6c7;
          border-radius: 15px;
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
          width: 44px;
          height: 44px;
          place-items: center;
          border-radius: 12px;
          background: #f1e8d7;
          color: #8d6925;
          font-family: serif;
          font-size: 16px;
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

        .premiumButton,
        .secondaryButton {
          display: inline-flex;
          min-height: 46px;
          padding: 0 20px;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.4;
          text-align: center;
          text-decoration: none;
          transition:
            transform 0.18s ease,
            opacity 0.18s ease;
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

          .serviceCard {
            min-height: 0;
            padding: 16px;
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