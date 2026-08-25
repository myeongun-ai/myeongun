import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function backup(file) {
  const bak = `${file}.before-access-hardening.bak`;
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
    console.log("백업 생성:", bak);
  }
}

function mustReplace(src, searchValue, replacement, label) {
  const next = src.replace(searchValue, replacement);
  if (next === src) {
    console.error("수정 실패:", label);
    process.exit(1);
  }
  console.log("수정 완료:", label);
  return next;
}

// 1) 상세 페이지: 현재 탭의 사주 세션 + 서버 결제쿠키 둘 다 확인 후에만 개인정보 로드
{
  const file = path.join(root, "app", "fortune", "detail", "page.tsx");
  backup(file);
  let src = fs.readFileSync(file, "utf8");

  src = mustReplace(
    src,
    'import { useEffect, useState } from "react";',
    'import { useEffect, useState } from "react";\nimport { useRouter } from "next/navigation";',
    "상세 페이지 router import"
  );

  src = mustReplace(
    src,
    'export default function FortuneDetailPage() {\n  const [saju, setSaju] = useState<SajuForm | null>(null);',
    'export default function FortuneDetailPage() {\n  const router = useRouter();\n  const [saju, setSaju] = useState<SajuForm | null>(null);\n  const [accessChecked, setAccessChecked] = useState(false);',
    "상세 페이지 접근 상태 추가"
  );

  src = mustReplace(
    src,
    /  useEffect\(\(\) => \{\s*try \{\s*const saved = localStorage\.getItem\("myeongun_saju"\);\s*if \(saved\) \{\s*setSaju\(JSON\.parse\(saved\)\);\s*\}\s*\} catch \(error\) \{\s*console\.error\([\s\S]*?\);\s*\}\s*\}, \[\]\);/m,
`  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const active =
          sessionStorage.getItem("myeongun_session_active") === "1";

        if (!active) {
          router.replace("/saju");
          return;
        }

        const response = await fetch("/api/payment/access", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/payment");
          return;
        }

        const data = await response.json();

        if (!data?.paid) {
          router.replace("/payment");
          return;
        }

        const saved = localStorage.getItem("myeongun_saju");

        if (!saved) {
          router.replace("/saju");
          return;
        }

        if (!cancelled) {
          setSaju(JSON.parse(saved));
          setAccessChecked(true);
        }
      } catch (error) {
        console.error("상세 사주 접근 확인 오류:", error);
        router.replace("/payment");
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);`,
    "상세 페이지 결제/세션 이중 확인"
  );

  src = mustReplace(
    src,
    '  const name = saju?.name || "怨좉컼";',
    `  if (!accessChecked || !saju) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f5f1e8",
          color: "#77746d",
        }}
      >
        결제 및 사주 정보를 확인하고 있습니다...
      </main>
    );
  }

  const name = saju?.name || "고객";`,
    "상세 페이지 확인 전 렌더링 차단"
  );

  fs.writeFileSync(file, src, "utf8");
}

// 2) 사주 입력 페이지에 들어오면 예전 결제 이용권 서버 쿠키도 제거
{
  const file = path.join(root, "app", "saju", "page.tsx");
  backup(file);
  let src = fs.readFileSync(file, "utf8");

  src = mustReplace(
    src,
    /  useEffect\(\(\) => \{\s*sessionStorage\.removeItem\("myeongun_session_active"\);\s*\}, \[\]\);/m,
`  useEffect(() => {
    sessionStorage.removeItem("myeongun_session_active");

    fetch("/api/payment/reset", {
      method: "POST",
      cache: "no-store",
    }).catch((error) => {
      console.error("이전 결제 이용권 초기화 오류:", error);
    });
  }, []);`,
    "새 사주 입력 시 이전 결제 이용권 초기화"
  );

  fs.writeFileSync(file, src, "utf8");
}

console.log("");
console.log("접근 보안 강화 패치 적용 완료");
console.log("다음 명령: npm.cmd run build");
