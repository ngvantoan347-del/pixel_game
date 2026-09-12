import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { UserProvider } from "@/app/UserProvider";

export const metadata: Metadata = {
  title: "Pixel Quest",
  description: "Top-down pixel action RPG",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <UserProvider>
          <nav style={{ display: "flex", gap: "1rem", padding: "1rem", justifyContent: "center" }}>
            <Link href="/">Trang chủ</Link>
            <Link href="/game">Chơi</Link>
            <Link href="/leaderboard">Bảng xếp hạng</Link>
          </nav>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}