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

  async function seedSave(userId: number, score: number) {
    await db.execute({
      sql: "INSERT INTO saves (user_id, score, updated_at) VALUES (?, ?, ?)",
      args: [userId, score, `2026-01-01T00:00:${score}Z`],
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
    const res = await submitScore(db, 1, "alice", { score: 1500, boss_defeated: true });
    expect(res.ok).toBe(true);
    const rows = await getLeaderboardRows(db);
    expect(rows[0].score).toBe(1500);
    expect(rows[0].boss_defeated).toBe(true);
  });
});