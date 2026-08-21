import "./globals.css";
export const metadata = { title: "명운 | AI 사주", description: "생년월일시로 보는 AI 사주 풀이" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ko"><body>{children}</body></html>;
}