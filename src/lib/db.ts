import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";

export type Db = Client;

const DEFAULT_URL = "file:./data/dev.db";

function ensureFileDir(url: string) {
  if (!url.startsWith("file:")) return;
  const p = url.slice(5).replace(/^\.\//, "");
  const dir = p.split(/[/\\]/).slice(0, -1).join("/");
  if (dir) mkdirSync(dir, { recursive: true });
}

let singleton: Db | null = null;
let schemaReady: Promise<void> | null = null;

export function getDb(): Db {
  if (!singleton) {
    const url = process.env.DATABASE_URL ?? DEFAULT_URL;
    ensureFileDir(url);
    singleton = createClient({ url });
  }
  return singleton;
}

export function ensureDb(): Promise<Db> {
  if (!schemaReady) {
    schemaReady = initSchema(getDb()).catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady.then(() => singleton as Db);
}

export function createTestDb(): Db {
  return createClient({ url: ":memory:" });
}

export async function initSchema(db: Db): Promise<void> {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT NOT NULL UNIQUE,
       password_hash TEXT NOT NULL,
       created_at TEXT NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS saves (
       user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
       map_id TEXT NOT NULL DEFAULT 'village',
       pos_x INTEGER NOT NULL DEFAULT 40,
       pos_y INTEGER NOT NULL DEFAULT 40,
       hp INTEGER NOT NULL DEFAULT 100,
       max_hp INTEGER NOT NULL DEFAULT 100,
       coins INTEGER NOT NULL DEFAULT 0,
       sword_level INTEGER NOT NULL DEFAULT 1,
       items TEXT NOT NULL DEFAULT '[]',
       quests TEXT NOT NULL DEFAULT '{"slime_quest":{"accepted":false,"kills":0,"complete":false,"claimed":false}}',
       boss_defeated INTEGER NOT NULL DEFAULT 0,
       score INTEGER NOT NULL DEFAULT 0,
       updated_at TEXT NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS leaderboard (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       username TEXT NOT NULL,
       score INTEGER NOT NULL,
       boss_defeated INTEGER NOT NULL DEFAULT 0,
       created_at TEXT NOT NULL
     )`,
  ]);
}