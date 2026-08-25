import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const detail = path.join(root, "app", "fortune", "detail", "page.tsx");
const saju = path.join(root, "app", "saju", "page.tsx");

function read(file) {
  if (!fs.existsSync(file)) {
    console.error("파일을 찾을 수 없습니다:", file);
    process.exit(1);
  }
  return fs.readFileSync(file, "utf8");
}

function write(file, src) {
  fs.writeFileSync(file, src, "utf8");
}

function backup(file, suffix) {
  const bak = `${file}.${suffix}.bak`;
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
    console.log("백업 생성:", bak);
  }
}

function ensureReplace(src, regex, replacement, label) {
  if (!regex.test(src)) {
    console.error("수정 실패:", label);
    process.exit(1);
  }
  const out = src.replace(regex, replacement);
  console.log("수정 완료:", label);
  return out;
}

// 상세 페이지
{
  backup(detail, "before-access-hardening-v2");
  let src = read(detail);

  // import: 중복 import가 있으면 정리
  src = src.replace(
    /import \{ useEffect, useState \} from "react";\s*import \{ useRouter \} from "next\/navigation";/m,
    'import { useEffect, useState } from "react";\nimport { useRouter } from "next/navigation";'
  );

  if (!src.includes('import { useRouter } from "next/navigation";')) {
    src = ensureReplace(
      src,
      /import \{ useEffect, useState \} from "react";/,
      'import { useEffect, useState } from "react";\nimport { useRouter } from "next/navigation";',
      "상세 페이지 router import"
    );
  } else {
    console.log("확인 완료: 상세 페이지 router import");
  }

  // 함수 시작부
  src = ensureReplace(
    src,
    /export default function FortuneDetailPage\(\) \{\s*const \[saju, setSaju\] = useState<SajuForm \| null>\(null\);/m,
    `export default function FortuneDetailPage() {
  const router = useRouter();
  const [saju, setSaju] = useState<SajuForm | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);`,
    "상세 페이지 접근 상태 추가"
  );

  // 기존 localStorage useEffect 전체 교체
  src = ensureReplace(
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

  // const name 앞에 로딩 차단 삽입
  src = ensureReplace(
    src,
    /  const name = saju\?\.name \|\| "[^"]*";/,
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
    "상세 페이지 확인 전 개인정보 렌더링 차단"
  );

  write(detail, src);
}

// 사주 입력 페이지
{
  backup(saju, "before-access-hardening-v2");
  let src = read(saju);

  if (!src.includes('fetch("/api/payment/reset"')) {
    src = ensureReplace(
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
  } else {
    console.log("확인 완료: 이전 결제 이용권 초기화");
  }

  write(saju, src);
}

console.log("");
console.log("접근 보안 강화 V2 적용 완료");
console.log("다음 명령: npm.cmd run build");
