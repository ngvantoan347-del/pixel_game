import { describe, it, expect } from "vitest";
import { createTestDb, initSchema } from "@/lib/db";

describe("db", () => {
  it("initializes schema with all three tables", async () => {
    const db = createTestDb();
    await initSchema(db);
    const tables = (await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table'"
    )).rows.map((r) => r.name);
    expect(tables).toEqual(expect.arrayContaining(["users", "saves", "leaderboard"]));
  });

  it("allows inserting a user and matching save row", async () => {
    const db = createTestDb();
    await initSchema(db);
    await db.execute({
      sql: "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
      args: ["alice", "hash", "2026-01-01T00:00:00Z"],
    });
    await db.execute({
      sql: "INSERT INTO saves (user_id, updated_at) VALUES (1, '2026-01-01T00:00:00Z')",
      args: [],
    });
    const rows = (await db.execute("SELECT user_id, map_id, hp FROM saves")).rows;
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].hp)).toBe(100);
  });
});