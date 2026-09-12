import { z } from "zod";
import type { Db } from "./db";
import type { LeaderboardEntry, SaveState } from "@/types";
import { computeScore, getSaveRow } from "./saves";

const submitSchema = z.object({
  score: z.number().int().min(0).max(99999),
  boss_defeated: z.boolean(),
});

export async function getLeaderboardRows(db: Db, limit = 10): Promise<LeaderboardEntry[]> {
  const rows = (await db.execute({
    sql: `SELECT u.username, s.coins, s.boss_defeated, s.updated_at
          FROM saves s JOIN users u ON u.id = s.user_id
          ORDER BY (s.coins + CASE WHEN s.boss_defeated = 1 THEN 1000 ELSE 0 END) DESC, s.updated_at ASC
          LIMIT ?`,
    args: [limit],
  })).rows;
  return rows.map((r, i) => {
    const save = { coins: Number(r.coins), boss_defeated: Boolean(r.boss_defeated) } as SaveState;
    return {
      rank: i + 1,
      username: String(r.username),
      score: computeScore(save),
      boss_defeated: Boolean(r.boss_defeated),
      updated_at: String(r.updated_at),
    };
  });
}

export async function submitScore(db: Db, userId: number, username: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Điểm số không hợp lệ." };
  const saveRow = await getSaveRow(db, userId);
  if (!saveRow) return { ok: false, error: "Chưa có save." };
  const score = computeScore(saveRow);
  await db.execute({
    sql: "INSERT INTO leaderboard (user_id, username, score, boss_defeated, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [userId, username, score, saveRow.boss_defeated ? 1 : 0, new Date().toISOString()],
  });
  return { ok: true };
}