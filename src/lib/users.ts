import { z } from "zod";
import type { Db } from "./db";
import type { PublicUser } from "@/types";
import { hashPassword, verifyPassword } from "./auth";

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(72),
});

const USERNAME_MESSAGE = "Tên đăng nhập phải 3–20 ký tự (a-z, 0-9, _). Mật khẩu ≥ 6 ký tự.";

export async function registerUser(db: Db, input: unknown): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: USERNAME_MESSAGE };
  const { username, password } = parsed.data;
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] });
  if (existing.rows.length > 0) return { ok: false, error: "Tên đăng nhập đã tồn tại." };
  const passwordHash = await hashPassword(password);
  await db.execute({
    sql: "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
    args: [username, passwordHash, new Date().toISOString()],
  });
  const row = (await db.execute({ sql: "SELECT id FROM users WHERE username = ?", args: [username] })).rows[0];
  return { ok: true, user: { id: Number(row.id), username } };
}

export async function loginUser(db: Db, input: unknown): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Tên đăng nhập hoặc mật khẩu không hợp lệ." };
  const { username, password } = parsed.data;
  const rows = (await db.execute({
    sql: "SELECT id, username, password_hash FROM users WHERE username = ?",
    args: [username],
  })).rows;
  if (rows.length === 0) return { ok: false, error: "Sai tên đăng nhập hoặc mật khẩu." };
  const row = rows[0];
  const valid = await verifyPassword(password, String(row.password_hash));
  if (!valid) return { ok: false, error: "Sai tên đăng nhập hoặc mật khẩu." };
  return { ok: true, user: { id: Number(row.id), username: String(row.username) } };
}