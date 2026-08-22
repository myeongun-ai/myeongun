# 명운 MYEONGUN V1

AI 사주·운세 종합 플랫폼의 V1 UI입니다.

## 포함
- 고급형 명운 홈
- 종합사주 화면
- 재물·사업운
- 궁합
- 2026 운세
- 명운 AI 상담 UI
- 마이페이지
- 모바일 하단 네비게이션
- OpenAI Responses API 서버 연동

## 실행
Node.js 20+

```bash
npm install
npm run dev
```

`.env.local`:

```env
OPENAI_API_KEY=your_key_here
```

## Vercel
GitHub의 `main` 브랜치에 push하면 연결된 Vercel 프로젝트에서 자동 배포할 수 있습니다. Vercel Project Settings > Environment Variables에 `OPENAI_API_KEY`를 Production 환경으로 등록하세요.

주의: API Key를 GitHub에 커밋하지 마세요.
