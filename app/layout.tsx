import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "명운 | 사주 · 재물사업 · 궁합 · 2026 운세 · AI 상담",
  description:
    "전통 명리학을 바탕으로 사주, 재물·사업운, 궁합, 2026 운세와 AI 상담을 제공하는 명운입니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="mgSiteHeader">
          <div className="mgHeaderInner">
            <Link className="mgBrand" href="/" aria-label="명운 홈">
              <span className="mgBrandMark">明</span>
              <span className="mgBrandText">
                <strong>명운</strong>
                <small>MYEONGUN</small>
              </span>
            </Link>

            <nav className="mgDesktopNav" aria-label="주요 메뉴">
              <Link href="/">홈</Link>
              <Link href="/saju">종합 사주</Link>
              <Link href="/fortune/business">재물·사업운</Link>
              <Link href="/compatibility">궁합</Link>
              <Link href="/fortune/2026">2026 운세</Link>
              <Link className="mgAiNav" href="/ai">
                AI 상담
              </Link>
            </nav>

            <div className="mgHeaderActions">
              <Link className="mgGuideLink" href="/payment/reopen">
                결제 사주 재열람
              </Link>
              <Link className="mgMyButton" href="/mypage">
                나의 명운
              </Link>
            </div>
          </div>
        </header>

        {children}

        <nav className="mgMobileNav" aria-label="모바일 빠른 메뉴">
          <Link href="/">
            <span className="mgMobileIcon">⌂</span>
            <span>홈</span>
          </Link>
          <Link href="/saju">
            <span className="mgMobileIcon">✦</span>
            <span>사주</span>
          </Link>
          <Link href="/ai">
            <span className="mgMobileIcon">◇</span>
            <span>AI</span>
          </Link>
          <Link href="/mypage">
            <span className="mgMobileIcon">○</span>
            <span>나</span>
          </Link>
        </nav>

        <footer className="mgSiteFooter">
          <div className="mgFooterInner">
            <section className="mgFooterBrand">
              <div className="mgFooterLogo">
                <span>明</span>
                <div>
                  <strong>명운</strong>
                  <small>MYEONGUN</small>
                </div>
              </div>

              <p>
                사람의 운명에는 언제나 좋은 흐름이 있습니다.
                <br />
                명운은 당신의 오늘과 내일을 함께합니다.
              </p>

              <small className="mgFooterDisclaimer">
                전통 명리학을 바탕으로 한 참고용 운세 콘텐츠입니다.
              </small>
            </section>

            <section className="mgFooterColumn">
              <h3>서비스</h3>
              <Link href="/saju">종합 사주</Link>
              <Link href="/fortune/business">재물·사업운</Link>
              <Link href="/compatibility">궁합</Link>
              <Link href="/fortune/2026">2026 운세</Link>
              <Link href="/ai">AI 상담</Link>
            </section>

            <section className="mgFooterColumn">
              <h3>고객지원</h3>
              <Link href="/mypage">나의 명운</Link>
              <Link href="/payment/reopen">결제 사주 재열람</Link>
              <span>고객센터 평일 09:00 - 18:00</span>
              <span>대표전화 02-6085-5868</span>
              <span>이메일 eunseok4948@naver.com</span>
            </section>

            <section className="mgFooterCompany">
              <h3>사업자 정보</h3>
              <p>(주)오르디 · 대표 이은석</p>
              <p>사업자등록번호 106-86-79134</p>
              <p>통신판매업 신고번호 제2024-고양덕양구-0888호</p>
              <p>
                경기도 고양시 덕양구 향동로 217,
                <br />
                DMC플렉스데시앙 3층 F306호
              </p>
              <p>대표전화 02-6085-5868 · 팩스 02-3272-4948</p>
              <p>개인정보보호책임자 이은석</p>
            </section>
          </div>

          <div className="mgFooterBottom">
            <span>© 2026 MYEONGUN · myeongun.kr</span>
            <span>좋은 날은 언제나 옵니다.</span>
          </div>
        </footer>

        <style>{`
          .mgSiteHeader {
            position: relative;
            z-index: 60;
            width: 100%;
            background:
              linear-gradient(90deg, rgba(7, 18, 39, 0.98), rgba(19, 34, 61, 0.96));
            border-bottom: 1px solid rgba(219, 170, 88, 0.22);
            box-shadow: 0 12px 34px rgba(3, 10, 24, 0.18);
          }

          .mgHeaderInner {
            width: min(1440px, calc(100% - 48px));
            min-height: 86px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 28px;
          }

          .mgBrand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            color: #fff;
            text-decoration: none;
            white-space: nowrap;
          }

          .mgBrandMark {
            width: 52px;
            height: 52px;
            border: 1.5px solid #dbaa58;
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #efc875;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 25px;
            font-weight: 700;
            box-shadow: inset 0 0 0 3px rgba(219, 170, 88, 0.06);
          }

          .mgBrandText {
            display: grid;
            line-height: 1;
          }

          .mgBrandText strong {
            color: #f8f4ea;
            font-size: 24px;
            letter-spacing: 0.08em;
          }

          .mgBrandText small {
            margin-top: 7px;
            color: #b6bdcb;
            font-size: 8px;
            letter-spacing: 0.32em;
          }

          .mgDesktopNav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: clamp(20px, 2.2vw, 36px);
          }

          .mgDesktopNav a,
          .mgGuideLink {
            position: relative;
            color: #e3e7ee;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            white-space: nowrap;
            transition: color 0.2s ease;
          }

          .mgDesktopNav a:hover,
          .mgGuideLink:hover {
            color: #efc875;
          }

          .mgDesktopNav a::after {
            content: "";
            position: absolute;
            left: 50%;
            bottom: -10px;
            width: 0;
            height: 2px;
            background: #dbaa58;
            transform: translateX(-50%);
            transition: width 0.2s ease;
          }

          .mgDesktopNav a:hover::after {
            width: 100%;
          }

          .mgAiNav {
            color: #efc875 !important;
          }

          .mgHeaderActions {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .mgGuideLink {
            color: #c8cfda;
            font-size: 12px;
          }

          .mgMyButton {
            min-width: 98px;
            min-height: 40px;
            padding: 0 18px;
            border: 1px solid rgba(239, 200, 117, 0.7);
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #e9b956, #f3d38b);
            color: #17223a;
            text-decoration: none;
            font-size: 13px;
            font-weight: 900;
            box-shadow: 0 7px 20px rgba(219, 170, 88, 0.16);
          }

          .mgMobileNav {
            display: none;
          }

          .mgSiteFooter {
            position: relative;
            z-index: 2;
            margin: 0;
            padding: 0;
            background:
              radial-gradient(circle at 18% 20%, rgba(69, 88, 121, 0.22), transparent 33%),
              linear-gradient(135deg, #111c31 0%, #0a1426 55%, #111b2e 100%);
            border-top: 1px solid rgba(219, 170, 88, 0.2);
            color: #c0c7d2;
            text-align: left;
          }

          .mgFooterInner {
            width: min(1380px, calc(100% - 56px));
            margin: 0 auto;
            padding: 52px 0 38px;
            display: grid;
            grid-template-columns: 1.35fr 0.7fr 1fr 1.35fr;
            gap: 44px;
          }

          .mgFooterLogo {
            display: flex;
            align-items: center;
            gap: 13px;
            margin-bottom: 18px;
          }

          .mgFooterLogo > span {
            width: 50px;
            height: 50px;
            border: 1.5px solid #dbaa58;
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #efc875;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 26px;
            font-weight: 700;
          }

          .mgFooterLogo div {
            display: grid;
          }

          .mgFooterLogo strong {
            color: #f6f0e4;
            font-size: 21px;
            letter-spacing: 0.08em;
          }

          .mgFooterLogo small {
            margin-top: 6px;
            color: #8793a8;
            font-size: 8px;
            letter-spacing: 0.28em;
          }

          .mgFooterBrand p {
            margin: 0 0 15px;
            color: #a7b0c0;
            font-size: 13px;
            line-height: 1.8;
          }

          .mgFooterDisclaimer {
            color: #717f95;
            font-size: 11px;
            line-height: 1.7;
          }

          .mgFooterColumn,
          .mgFooterCompany {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .mgFooterColumn h3,
          .mgFooterCompany h3 {
            margin: 2px 0 11px;
            color: #f2e4c4;
            font-size: 13px;
          }

          .mgFooterColumn a,
          .mgFooterColumn span,
          .mgFooterCompany p {
            margin: 0;
            color: #9ca7b8;
            text-decoration: none;
            font-size: 12px;
            line-height: 1.7;
          }

          .mgFooterColumn a:hover {
            color: #efc875;
          }

          .mgFooterBottom {
            width: min(1380px, calc(100% - 56px));
            margin: 0 auto;
            padding: 18px 0 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            justify-content: space-between;
            gap: 20px;
            color: #6f7b8f;
            font-size: 11px;
          }

          @media (max-width: 1180px) {
            .mgHeaderInner {
              width: min(100% - 32px, 1180px);
              gap: 18px;
            }

            .mgDesktopNav {
              gap: 18px;
            }

            .mgDesktopNav a {
              font-size: 13px;
            }

            .mgGuideLink {
              display: none;
            }

            .mgFooterInner {
              grid-template-columns: 1.2fr 0.8fr 1fr;
            }

            .mgFooterCompany {
              grid-column: 1 / -1;
              padding-top: 8px;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              column-gap: 22px;
            }

            .mgFooterCompany h3 {
              grid-column: 1 / -1;
            }
          }

          @media (max-width: 820px) {
            .mgSiteHeader {
              position: relative;
            }

            .mgHeaderInner {
              width: calc(100% - 28px);
              min-height: 66px;
              grid-template-columns: 1fr auto;
            }

            .mgBrandMark {
              width: 42px;
              height: 42px;
              font-size: 22px;
            }

            .mgBrandText strong {
              font-size: 19px;
            }

            .mgDesktopNav {
              display: none;
            }

            .mgHeaderActions {
              justify-self: end;
            }

            .mgMyButton {
              min-width: 82px;
              min-height: 36px;
              padding: 0 14px;
              font-size: 12px;
            }

            .mgMobileNav {
              position: fixed;
              z-index: 100;
              left: 0;
              right: 0;
              bottom: 0;
              min-height: 66px;
              padding: 7px 16px max(7px, env(safe-area-inset-bottom));
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              background: rgba(255, 253, 248, 0.97);
              border-top: 1px solid #e7e1d8;
              box-shadow: 0 -8px 28px rgba(23, 29, 40, 0.08);
              backdrop-filter: blur(14px);
            }

            .mgMobileNav a {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 3px;
              color: #67655f;
              text-decoration: none;
              font-size: 10px;
              font-weight: 700;
            }

            .mgMobileIcon {
              color: #1b263b;
              font-size: 21px;
              line-height: 1;
            }

            .mgSiteFooter {
              padding-bottom: 74px;
            }

            .mgFooterInner {
              width: calc(100% - 34px);
              padding: 38px 0 26px;
              grid-template-columns: 1fr 1fr;
              gap: 30px 18px;
            }

            .mgFooterBrand,
            .mgFooterCompany {
              grid-column: 1 / -1;
            }

            .mgFooterCompany {
              display: flex;
              padding-top: 0;
            }

            .mgFooterBottom {
              width: calc(100% - 34px);
              padding: 16px 0 20px;
              flex-direction: column;
              gap: 7px;
            }
          }

          @media (max-width: 480px) {
            .mgHeaderInner {
              width: calc(100% - 24px);
              min-height: 62px;
            }

            .mgBrand {
              gap: 9px;
            }

            .mgBrandMark {
              width: 38px;
              height: 38px;
              font-size: 20px;
            }

            .mgBrandText strong {
              font-size: 18px;
            }

            .mgBrandText small {
              font-size: 7px;
            }

            .mgMyButton {
              min-width: 76px;
              min-height: 34px;
              padding: 0 12px;
            }

            .mgFooterInner {
              grid-template-columns: 1fr;
            }

            .mgFooterBrand,
            .mgFooterCompany {
              grid-column: auto;
            }

            .mgFooterColumn:nth-of-type(2),
            .mgFooterColumn:nth-of-type(3) {
              padding-top: 0;
            }
          }

          @media (max-width: 820px) {
            .mgFooterInner {
              padding-top: 30px !important;
              padding-bottom: 20px !important;
              gap: 20px 16px !important;
            }

            .mgFooterLogo {
              margin-bottom: 10px !important;
            }

            .mgFooterBrand p {
              margin-bottom: 9px !important;
              line-height: 1.65 !important;
            }

            .mgFooterColumn,
            .mgFooterCompany {
              gap: 4px !important;
            }

            .mgFooterColumn h3,
            .mgFooterCompany h3 {
              margin-bottom: 6px !important;
            }

            .mgFooterColumn a,
            .mgFooterColumn span,
            .mgFooterCompany p {
              line-height: 1.5 !important;
            }

            .mgFooterBottom {
              padding-top: 12px !important;
              padding-bottom: 14px !important;
            }
          }

          @media (max-width: 480px) {
            .mgFooterInner {
              gap: 16px !important;
            }

            .mgFooterLogo > span {
              width: 42px !important;
              height: 42px !important;
              font-size: 22px !important;
            }

            .mgFooterLogo strong {
              font-size: 18px !important;
            }
          }

        `}</style>
      </body>
    </html>
  );
}
