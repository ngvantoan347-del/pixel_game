"use client";

import type { LeaderboardEntry, PublicUser, SaveState } from "@/types";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Lỗi ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function registerUser(username: string, password: string): Promise<PublicUser> {
  const data = await apiFetch<{ user: PublicUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return data.user;
}

export async function loginUser(username: string, password: string): Promise<PublicUser> {
  const data = await apiFetch<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return data.user;
}

export async function logoutUser(): Promise<void> {
  await apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export async function fetchMe(): Promise<PublicUser | null> {
  const data = await apiFetch<{ user: PublicUser }>("/api/auth/me").catch(() => null);
  return data?.user ?? null;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const data = await apiFetch<{ entries: LeaderboardEntry[] }>("/api/leaderboard");
  return data.entries;
}

export async function submitScore(score: number, bossDefeated: boolean): Promise<void> {
  await apiFetch<{ ok: boolean }>("/api/leaderboard", {
    method: "POST",
    body: JSON.stringify({ score, boss_defeated: bossDefeated }),
  });
}

export async function fetchSave(): Promise<SaveState> {
  const data = await apiFetch<{ save: SaveState }>("/api/save");
  return data.save;
}

export async function saveGame(save: SaveState): Promise<SaveState> {
  const data = await apiFetch<{ save: SaveState }>("/api/save", {
    method: "PUT",
    body: JSON.stringify(save),
  });
  return data.save;
}