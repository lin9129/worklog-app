import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "工数・時間記入表アプリ",
  description: "軽量で入力しやすい工数管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <main className="container animate-fade">
          {children}
        </main>
      </body>
    </html>
  );
}
