import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "명운 | AI 사주·운세 종합 플랫폼",
  description: "생년월일시를 바탕으로 보는 명운의 사주·운세·궁합·AI 상담",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>
    <header className="siteHeader">
      <Link className="brand" href="/"><span>明</span><strong>명운</strong><small>MYEONGUN</small></Link>
      <nav className="desktopNav">
        <Link href="/saju">종합사주</Link><Link href="/fortune/business">재물·사업</Link><Link href="/compatibility">궁합</Link><Link href="/fortune/2026">2026 운세</Link><Link className="aiNav" href="/ai">AI 상담</Link>
      </nav>
      <Link className="profileBtn" href="/mypage">내 명운</Link>
    </header>
    {children}
    <nav className="mobileNav"><Link href="/">⌂<span>홈</span></Link><Link href="/saju">✦<span>사주</span></Link><Link href="/ai">◈<span>AI</span></Link><Link href="/mypage">○<span>나</span></Link></nav>
    <footer><div className="footerBrand">明 명운</div><p>전통 명리학을 바탕으로 한 참고용 운세 콘텐츠입니다.</p><p>© 2026 MYEONGUN · myeongun.kr</p></footer>
  </body></html>;
}
