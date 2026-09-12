import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signToken, verifyToken } from "@/lib/auth";

describe("auth", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("signs and verifies a JWT", async () => {
    process.env.JWT_SECRET = "test-secret";
    const token = await signToken(7, "alice");
    const decoded = await verifyToken(token);
    expect(decoded).toEqual({ userId: 7, username: "alice" });
    expect(await verifyToken("garbage")).toBeNull();
  });
});