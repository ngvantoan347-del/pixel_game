import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, initSchema, type Db } from "@/lib/db";
import { registerUser, loginUser } from "@/lib/users";

describe("users", () => {
  let db: Db;
  beforeEach(async () => {
    db = createTestDb();
    await initSchema(db);
  });

  it("registers a new user", async () => {
    const res = await registerUser(db, { username: "alice", password: "secret123" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.user.username).toBe("alice");
  });

  it("rejects duplicate usernames", async () => {
    await registerUser(db, { username: "alice", password: "secret123" });
    const res = await registerUser(db, { username: "alice", password: "other123" });
    expect(res.ok).toBe(false);
  });

  it("rejects invalid input", async () => {
    const res = await registerUser(db, { username: "a", password: "x" });
    expect(res.ok).toBe(false);
  });

  it("logs in an existing user with correct password", async () => {
    await registerUser(db, { username: "bob", password: "secret123" });
    const res = await loginUser(db, { username: "bob", password: "secret123" });
    expect(res.ok).toBe(true);
  });

  it("rejects wrong password", async () => {
    await registerUser(db, { username: "bob", password: "secret123" });
    const res = await loginUser(db, { username: "bob", password: "nope" });
    expect(res.ok).toBe(false);
  });
});