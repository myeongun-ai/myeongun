# 명운 MYEONGUN

myeongun.kr용 AI 사주 사이트 기본형입니다.

## 실행
1. Node.js 20 이상 설치
2. `npm install`
3. `.env.local` 파일 생성 후 `OPENAI_API_KEY=...` 입력
4. `npm run dev`
5. `http://localhost:3000` 접속

## 배포
Vercel 등 Next.js 호스팅에 프로젝트를 연결하고 `OPENAI_API_KEY`를 서버 환경변수로 등록합니다.
도메인 `myeongun.kr`은 호스팅의 Custom Domain에 연결합니다.

주의: OpenAI API 키는 브라우저 코드에 넣지 말고 반드시 서버 환경변수로 관리하세요.
