"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@/app/UserProvider";
import { createGame } from "@/game/main";
import type { Game } from "phaser";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const { status } = useUser();

  useEffect(() => {
    if (status !== "ready" || !containerRef.current) return;
    if (gameRef.current) return;

    const game = createGame(containerRef.current);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [status]);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: 960,
          aspectRatio: "3 / 2",
          imageRendering: "pixelated",
          border: "2px solid #2a2f3a",
          borderRadius: 8,
          overflow: "hidden",
        }}
      />
    </div>
  );
}