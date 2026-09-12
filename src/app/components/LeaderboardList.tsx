"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { LeaderboardEntry } from "@/types";
import { apiFetch } from "@/lib/api";

const thStyle: CSSProperties = { border: "1px solid #333", padding: "0.5rem 1rem" };
const tdStyle: CSSProperties = { border: "1px solid #333", padding: "0.4rem 1rem" };

export default function LeaderboardList({ entries }: { entries?: LeaderboardEntry[] }) {
  const [fetched, setFetched] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entries) return;
    let cancelled = false;
    apiFetch<{ entries: LeaderboardEntry[] }>("/api/leaderboard")
      .then((r) => {
        if (!cancelled) setFetched(r.entries);
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được bảng xếp hạng.");
      });
    return () => {
      cancelled = true;
    };
  }, [entries]);

  if (error) return <p style={{ color: "#f87171" }}>{error}</p>;

  const rows = entries ?? fetched ?? [];

  return (
    <table style={{ margin: "0 auto", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thStyle}>#</th>
          <th style={thStyle}>Người chơi</th>
          <th style={thStyle}>Điểm</th>
          <th style={thStyle}>Boss</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr key={`${e.rank}-${e.username}`}>
            <td style={tdStyle}>{e.rank}</td>
            <td style={tdStyle}>{e.username}</td>
            <td style={tdStyle}>{e.score}</td>
            <td style={tdStyle}>{e.boss_defeated ? "✔" : "–"}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td style={tdStyle} colSpan={4}>
              Chưa có người chơi nào.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}