import type { Direction } from "@/types";

export const SWORD_DAMAGE: Record<number, number> = { 1: 10, 2: 18, 3: 30, 4: 45, 5: 65 };

export function getSwordDamage(swordLevel: number): number {
  return SWORD_DAMAGE[swordLevel] ?? SWORD_DAMAGE[1];
}

export function clampSwordLevel(level: number): number {
  return Math.max(1, Math.min(5, level));
}

export function rollCoinDrop(min: number, max: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const KNOCKBACK_OFFSETS: Record<Direction, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export function knockbackPosition(x: number, y: number, dir: Direction, distance: number): { x: number; y: number } {
  const [dx, dy] = KNOCKBACK_OFFSETS[dir];
  return { x: x + dx * distance, y: y + dy * distance };
}

export function positionInRange(ax: number, ay: number, bx: number, by: number, range: number): boolean {
  return Math.hypot(bx - ax, by - ay) <= range;
}