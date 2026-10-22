"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { ANALYTICS_CONSENT_KEY, isAnalyticsAllowed } from "./analyticsConsent";

type Choice = "accepted" | "rejected" | null;

export default function ConsentAnalytics() {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ANALYTICS_CONSENT_KEY);
      setChoice(stored === "accepted" ? "accepted" : stored === "rejected" ? "rejected" : null);
    } catch {
      setChoice(null);
    }
    setReady(true);
  }, []);

  function choose(value: "accepted" | "rejected") {
    try {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
    } catch {
      // Without persistent consent, optional analytics must remain disabled.
      if (value === "accepted") return;
    }
    // Reload to unload already-mounted analytics scripts on withdrawal.
    window.location.reload();
  }

  const showPrompt = ready && (choice === null || editing);
  const enabled = ready && choice === "accepted" && isAnalyticsAllowed();

  return (
    <>
      {enabled && (
        <>
          <Script id="myeongun-google-analytics-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-E5JM4F9VDF');`}
          </Script>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-E5JM4F9VDF" strategy="afterInteractive" />
          <Analytics />
        </>
      )}
      {ready && !showPrompt && (
        <button type="button" onClick={() => setEditing(true)}
          style={{position:"fixed",bottom:12,left:12,zIndex:10000,padding:"8px 12px",borderRadius:10,border:"1px solid #b8aa93",background:"#fffdf8",color:"#13233d",fontSize:12,cursor:"pointer",boxShadow:"0 2px 10px #0002"}}>
          방문 분석 설정
        </button>
      )}
      {showPrompt && (
        <div role="dialog" aria-label="방문 분석 선택" aria-modal="false"
          style={{position:"fixed",bottom:12,left:12,right:12,zIndex:10001,maxWidth:540,margin:"0 auto",padding:18,background:"#fffdf8",color:"#13233d",border:"1px solid #d9c7a9",borderRadius:16,boxShadow:"0 8px 28px #0003",fontSize:14,lineHeight:1.7}}>
          <strong style={{fontSize:17}}>쿠키 및 방문 분석 안내</strong>
          <p style={{margin:"8px 0 14px"}}>명운은 결제·이용권 등 필수 기능을 사용합니다. 선택적인 Google Analytics 및 Vercel Analytics 방문 분석은 동의한 경우에만 실행됩니다. 동의하지 않아도 사주 분석과 결제 기능을 이용할 수 있습니다. 선택은 언제든 변경할 수 있습니다.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            <button type="button" onClick={() => choose("rejected")}
              style={{flex:"1 1 150px",padding:"10px 12px",borderRadius:10,border:"1px solid #b8aa93",background:"#fff",color:"#13233d",cursor:"pointer"}}>필수 기능만 사용</button>
            <button type="button" onClick={() => choose("accepted")}
              style={{flex:"1 1 150px",padding:"10px 12px",borderRadius:10,border:"1px solid #13233d",background:"#13233d",color:"white",cursor:"pointer"}}>방문 분석 동의</button>
          </div>
          <p style={{margin:"8px 0 0",fontSize:12}}>자세한 내용은 <a href="/privacy" style={{textDecoration:"underline"}}>개인정보처리방침</a>에서 확인할 수 있습니다.</p>
        </div>
      )}
    </>
  );
}
