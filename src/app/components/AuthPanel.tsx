"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useUser } from "@/app/UserProvider";
import { loginUser, logoutUser, registerUser } from "@/lib/api";

type Mode = "login" | "register" | "guest";

export default function AuthPanel() {
  const { user, status, setUser } = useUser();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "loading") return <p>Đang kiểm tra phiên…</p>;

  if (user) {
    return (
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center" }}>
        <span>
          Xin chào, <strong>{user.username}</strong>
        </span>
        <button onClick={() => void handleLogout()}>Đăng xuất</button>
      </div>
    );
  }

  function switchMode(next: Mode) {
    setError(null);
    setMode(next);
  }

  async function handleLogout() {
    setError(null);
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const nextUser =
        mode === "login" ? await loginUser(username, password) : await registerUser(username, password);
      setUser(nextUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: 320, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <button type="button" onClick={() => switchMode("login")} disabled={mode === "login"}>
          Đăng nhập
        </button>
        <button type="button" onClick={() => switchMode("register")} disabled={mode === "register"}>
          Đăng ký
        </button>
        <button type="button" onClick={() => switchMode("guest")} disabled={mode === "guest"}>
          Chơi khách
        </button>
      </div>

      {mode === "guest" ? (
        <p>
          Chơi với tư cách khách — tiến trình không được lưu.{" "}
          <Link href="/game">Bắt đầu chơi ngay →</Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.5rem" }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tên người chơi (3-20, a-z 0-9 _)"
            maxLength={20}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu (≥ 6 ký tự)"
            minLength={6}
          />
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>
      )}
    </div>
  );
}