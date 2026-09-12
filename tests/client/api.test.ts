import { afterEach, describe, expect, it, vi } from "vitest";
import type { SaveState } from "@/types";
import {
  apiFetch,
  fetchLeaderboard,
  fetchMe,
  fetchSave,
  loginUser,
  logoutUser,
  registerUser,
  saveGame,
  submitScore,
} from "@/lib/api";

const originalFetch = globalThis.fetch;

function mockJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("returns parsed JSON on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ user: { id: 1, username: "alice" } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const data = await apiFetch<{ user: { id: number; username: string } }>("/api/auth/me");
    expect(data).toEqual({ user: { id: 1, username: "alice" } });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("throws the server-provided error message on !ok", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(mockJsonResponse({ error: "Tên đã được sử dụng." }, 409));

    await expect(apiFetch("/api/auth/register", { method: "POST" })).rejects.toThrow(
      "Tên đã được sử dụng."
    );
  });

  it("falls back to the status text when the body is not JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("<html>oops</html>", { status: 500 }));

    await expect(apiFetch("/api/leaderboard")).rejects.toThrow("Lỗi 500");
  });

  it("merges custom headers with the default content-type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await apiFetch("/api/auth/logout", { method: "POST", headers: { "X-Custom": "1" } });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json", "X-Custom": "1" }),
      })
    );
  });
});

describe("api wrappers", () => {
  it("registerUser posts credentials and unwraps the user", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(mockJsonResponse({ user: { id: 3, username: "bob" } }));

    const user = await registerUser("bob", "secret123");
    expect(user).toEqual({ id: 3, username: "bob" });
  });

  it("loginUser posts to /api/auth/login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ user: { id: 1, username: "alice" } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await loginUser("alice", "secret123");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "alice", password: "secret123" }),
      })
    );
  });

  it("logoutUser posts to /api/auth/logout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await logoutUser();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("fetchMe returns null when not authenticated", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse({ error: "Chưa đăng nhập." }, 401));

    expect(await fetchMe()).toBeNull();
  });

  it("fetchLeaderboard unwraps entries", async () => {
    const entries = [
      {
        rank: 1,
        username: "alice",
        score: 1500,
        boss_defeated: true,
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse({ entries }));

    expect(await fetchLeaderboard()).toEqual(entries);
  });

  it("submitScore posts the score and boss flag", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ ok: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await submitScore(2500, true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leaderboard",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ score: 2500, boss_defeated: true }),
      })
    );
  });

  it("saveGame PUTs the save state", async () => {
    const save: SaveState = {
      map_id: "village",
      pos_x: 40,
      pos_y: 40,
      hp: 100,
      max_hp: 100,
      coins: 120,
      sword_level: 2,
      items: ["potion"],
      quests: { slime_quest: { accepted: true, kills: 3, complete: false, claimed: false } },
      boss_defeated: false,
      score: 120,
    };
    const fetchMock = vi.fn().mockResolvedValue(mockJsonResponse({ save }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const returned = await saveGame({ ...save });
    expect(returned).toEqual(save);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/save",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(save) })
    );
  });

  it("fetchSave unwraps the save", async () => {
    const save: SaveState = {
      map_id: "forest",
      pos_x: 10,
      pos_y: 12,
      hp: 70,
      max_hp: 100,
      coins: 200,
      sword_level: 1,
      items: [],
      quests: { slime_quest: { accepted: false, kills: 0, complete: false, claimed: false } },
      boss_defeated: false,
      score: 200,
    };
    globalThis.fetch = vi.fn().mockResolvedValue(mockJsonResponse({ save }));

    expect(await fetchSave()).toEqual(save);
  });
});