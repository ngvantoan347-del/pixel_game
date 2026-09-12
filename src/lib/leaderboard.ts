import { z } from "zod";
import type { Db } from "./db";
import type { LeaderboardEntry } from "@/types";

const submitSchema = z.object({
  score: z.number().int().min(0).max(99999),
  boss_defeated: z.boolean(),
});

export async function getLeaderboardRows(db: Db, limit = 10): Promise<LeaderboardEntry[]> {
  const rows = (await db.execute({
    sql: `SELECT u.username, s.score, s.boss_defeated, s.updated_at
          FROM saves s JOIN users u ON u.id = s.user_id
          ORDER BY s.score DESC, s.updated_at ASC
          LIMIT ?`,
    args: [limit],
  })).rows;
  return rows.map((r, i) => ({
    rank: i + 1,
    username: String(r.username),
    score: Number(r.score),
    boss_defeated: Boolean(r.boss_defeated),
    updated_at: String(r.updated_at),
  }));
}

export async function submitScore(db: Db, userId: number, username: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Điểm số không hợp lệ." };
  const now = new Date().toISOString();
  await db.execute({
    sql: "INSERT INTO leaderboard (user_id, username, score, boss_defeated, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [userId, username, parsed.data.score, parsed.data.boss_defeated ? 1 : 0, now],
  });
  await db.execute({
    sql: `INSERT INTO saves (user_id, score, boss_defeated, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            score=excluded.score, boss_defeated=excluded.boss_defeated, updated_at=excluded.updated_at`,
    args: [userId, parsed.data.score, parsed.data.boss_defeated ? 1 : 0, now],
  });
  return { ok: true };
}