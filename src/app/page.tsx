import Link from "next/link";
import AuthPanel from "@/app/components/AuthPanel";
import LeaderboardList from "@/app/components/LeaderboardList";

export default function Home() {
  return (
    <main style={{ textAlign: "center", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "3rem" }}>Pixel Quest</h1>
      <p style={{ margin: "1rem 0 2rem" }}>
        Cuộc phiêu lưu pixel top-down: diệt slime, nhận quest, vượt mê cung và hạ Boss.
      </p>
      <AuthPanel />
      <p style={{ margin: "2rem 0" }}>
        <Link href="/game">
          <button style={{ fontSize: "1.4rem", padding: "0.8rem 2rem" }}>Bắt đầu chơi</button>
        </Link>
      </p>
      <h2 style={{ margin: "2rem 0 1rem" }}>Bảng xếp hạng</h2>
      <LeaderboardList />
      <p style={{ margin: "1rem 0" }}>
        <Link href="/leaderboard">Xem toàn bộ bảng xếp hạng →</Link>
      </p>
    </main>
  );
}