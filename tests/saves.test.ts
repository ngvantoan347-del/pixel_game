import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, initSchema, type Db } from "@/lib/db";
import { clampSave, computeScore, DEFAULT_SAVE, getSaveRow, putSaveRow } from "@/lib/saves";

function validSave() {
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

describe("saves", () => {
  let db: Db;
  beforeEach(async () => {
    db = createTestDb();
    await initSchema(db);
  });

  it("accepts the default save", () => {
    const res = clampSave(validSave());
    expect(res.ok).toBe(true);
  });

  it("rejects invalid map_id", () => {
    const res = clampSave({ ...validSave(), map_id: "moon" });
    expect(res.ok).toBe(false);
  });

  it("rejects too many items", () => {
    const res = clampSave({ ...validSave(), items: Array(9).fill("potion") });
    expect(res.ok).toBe(false);
  });

  it("rejects unknown item type", () => {
    const res = clampSave({ ...validSave(), items: ["cheese"] });
    expect(res.ok).toBe(false);
  });

  it("rejects hp larger than max_hp cap", () => {
    const res = clampSave({ ...validSave(), max_hp: 200 });
    expect(res.ok).toBe(false);
  });

  it("computes score with boss bonus", () => {
    expect(computeScore({ ...validSave(), coins: 500, boss_defeated: false })).toBe(500);
    expect(computeScore({ ...validSave(), coins: 500, boss_defeated: true })).toBe(1500);
    expect(computeScore({ ...validSave(), coins: 99999, boss_defeated: true })).toBe(99999);
  });

  it("persists and reads a save row", async () => {
    await db.execute({
      sql: "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
      args: ["alice", "hash", "2026-01-01T00:00:00Z"],
    });
    const save = { ...validSave(), coffins: 0 } as Record<string, unknown>;
    for (const k of ["coffins"]) delete save[k];
    const patch = { ...(save as object), coins: 42, sword_level: 3, map_id: "cave" } as typeof DEFAULT_SAVE;
    await putSaveRow(db, 1, patch);
    const read = await getSaveRow(db, 1);
    expect(read?.coins).toBe(42);
    expect(read?.sword_level).toBe(3);
    expect(read?.map_id).toBe("cave");
  });
});