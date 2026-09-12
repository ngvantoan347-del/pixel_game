import { z } from "zod";
import type { Db } from "./db";
import type { MapId, QuestState, SaveState } from "@/types";

export const MAP_IDS = ["village", "forest", "cave", "arena"] as const;

export const DEFAULT_SAVE: SaveState = {
  map_id: "village",
  pos_x: 40,
  pos_y: 40,
  hp: 100,
  max_hp: 100,
  coins: 0,
  sword_level: 1,
  items: [],
  quests: { slime_quest: { accepted: false, kills: 0, complete: false, claimed: false } },
  boss_defeated: false,
  score: 0,
};

export function computeScore(save: SaveState): number {
  return Math.min(save.coins + (save.boss_defeated ? 1000 : 0), 99999);
}

const questSchema = z.object({
  slime_quest: z.object({
    accepted: z.boolean(),
    kills: z.number().int().min(0).max(1000),
    complete: z.boolean(),
    claimed: z.boolean(),
  }),
});

const saveSchema = z.object({
  map_id: z.enum(MAP_IDS),
  pos_x: z.number().int().min(0).max(4000),
  pos_y: z.number().int().min(0).max(4000),
  hp: z.number().int().min(1).max(100),
  max_hp: z.number().int().min(1).max(100),
  coins: z.number().int().min(0).max(99999),
  sword_level: z.number().int().min(1).max(5),
  items: z.array(z.enum(["potion", "sword_upgrade"])).max(8),
  quests: questSchema,
  boss_defeated: z.boolean(),
  score: z.number().int().min(0).max(999999).optional(),
});

export function clampSave(raw: unknown): { ok: true; save: SaveState } | { ok: false; error: string } {
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Dữ liệu save không hợp lệ." };
  const { score: _ignored, ...rest } = parsed.data;
  const save: SaveState = { ...rest, score: computeScore(rest as SaveState) };
  return { ok: true, save };
}

export async function getSaveRow(db: Db, userId: number): Promise<SaveState | null> {
  const rows = (await db.execute({ sql: "SELECT * FROM saves WHERE user_id = ?", args: [userId] })).rows;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    map_id: String(r.map_id) as MapId,
    pos_x: Number(r.pos_x),
    pos_y: Number(r.pos_y),
    hp: Number(r.hp),
    max_hp: Number(r.max_hp),
    coins: Number(r.coins),
    sword_level: Number(r.sword_level),
    items: JSON.parse(String(r.items)) as SaveState["items"],
    quests: JSON.parse(String(r.quests)) as QuestState,
    boss_defeated: Boolean(r.boss_defeated),
    score: Number(r.score),
  };
}

export async function putSaveRow(db: Db, userId: number, save: SaveState): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO saves (user_id, map_id, pos_x, pos_y, hp, max_hp, coins, sword_level, items, quests, boss_defeated, score, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            map_id=excluded.map_id, pos_x=excluded.pos_x, pos_y=excluded.pos_y,
            hp=excluded.hp, max_hp=excluded.max_hp, coins=excluded.coins,
            sword_level=excluded.sword_level, items=excluded.items,
            quests=excluded.quests, boss_defeated=excluded.boss_defeated,
            score=excluded.score, updated_at=excluded.updated_at`,
    args: [userId, save.map_id, save.pos_x, save.pos_y, save.hp, save.max_hp, save.coins, save.sword_level,
      JSON.stringify(save.items), JSON.stringify(save.quests), save.boss_defeated ? 1 : 0, save.score, now],
  });
}