import { headers } from "next/headers";
import type { LeaderboardEntry } from "@/types";
import LeaderboardList from "@/app/components/LeaderboardList";

export const dynamic = "force-dynamic";

async function loadEntries(): Promise<LeaderboardEntry[]> {
  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    const res = await fetch(`${proto}://${host}/api/leaderboard`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { entries?: unknown } | null;
    if (!data || !Array.isArray(data.entries)) return [];
    return data.entries as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await loadEntries();
  return (
    <main style={{ textAlign: "center", padding: "2rem 1rem" }}>
      <h1>Bảng xếp hạng</h1>
      <p style={{ margin: "0.5rem 0 1.5rem" }}>
        Top 10 người chơi — xếp theo điểm (vàng + 1000 nếu đã hạ Boss).
      </p>
      <LeaderboardList entries={entries} />
    </main>
  );
}