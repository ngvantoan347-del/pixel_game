import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, initSchema, type Db } from "@/lib/db";
import { getLeaderboardRows, submitScore } from "@/lib/leaderboard";

describe("leaderboard", () => {
  let db: Db;
  beforeEach(async () => {
    db = createTestDb();
    await initSchema(db);
    await db.execute({
      sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [1, "alice", "hash", "2026-01-01T00:00:00Z"],
    });
    await db.execute({
      sql: "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
      args: [2, "bob", "hash", "2026-01-01T00:00:00Z"],
    });
  });

  async function seedSave(userId: number, coins: number) {
    await db.execute({
      sql: "INSERT INTO saves (user_id, coins, updated_at) VALUES (?, ?, ?)",
      args: [userId, coins, `2026-01-01T00:00:${coins}Z`],
    });
  }

  it("returns derived leaderboard sorted by score", async () => {
    await seedSave(1, 100);
    await seedSave(2, 300);
    const rows = await getLeaderboardRows(db);
    expect(rows).toHaveLength(2);
    expect(rows[0].username).toBe("bob");
    expect(rows[1].username).toBe("alice");
    expect(rows[0].rank).toBe(1);
  });

  it("rejects invalid score payload", async () => {
    const res = await submitScore(db, 1, "alice", { score: -5, boss_defeated: false });
    expect(res.ok).toBe(false);
  });

  it("records a run submission", async () => {
    await db.execute({
      sql: "INSERT INTO saves (user_id, coins, boss_defeated, updated_at) VALUES (1, 500, 1, '2026-01-15T00:00:00Z')",
      args: [],
    });
    const res = await submitScore(db, 1, "alice", { score: 99999, boss_defeated: false });
    expect(res.ok).toBe(true);
    const historyRows = (await db.execute("SELECT score, boss_defeated FROM leaderboard WHERE user_id = 1")).rows;
    expect(historyRows).toHaveLength(1);
    expect(Number(historyRows[0].score)).toBe(1500);
    expect(Number(historyRows[0].boss_defeated)).toBe(1);
    const leaderRows = await getLeaderboardRows(db);
    expect(leaderRows[0].score).toBe(1500);
    const saveAfter = (await db.execute("SELECT coins FROM saves WHERE user_id = 1")).rows;
    expect(Number(saveAfter[0].coins)).toBe(500);
  });

  it("rejects submission when no save exists", async () => {
    const res = await submitScore(db, 1, "alice", { score: 100, boss_defeated: false });
    expect(res.ok).toBe(false);
  });
});