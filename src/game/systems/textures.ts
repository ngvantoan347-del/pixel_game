import * as Phaser from "phaser";

export const TILE_W = 16;
export const TILE_H = 16;

export const TILE = {
  grass: 0, dirt: 1, stone: 2, wall: 3, tree: 4, water: 5,
  chest: 6, portal: 7, door: 8, flower: 9, crack: 10, ladder: 11,
} as const;

const WALL_CHARS: Record<number, string> = {
  [TILE.grass]: "+",
  [TILE.dirt]: ".",
  [TILE.stone]: "+",
  [TILE.wall]: "#",
  [TILE.tree]: "T",
  [TILE.chest]: "C",
  [TILE.portal]: "O",
  [TILE.door]: "D",
};

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function spear(ctx: CanvasRenderingContext2D, seed: number): void {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let y = 0; y < TILE_H; y++) {
    for (let x = 0; x < TILE_W; x++) {
      const char = WALL_CHARS[seed % 12] ?? "+";
      const baseByChar: Record<string, string> = {
        "+": "#3a5f2a", ".": "#7a5b36", "#": "#4a4a5a", "T": "#183a24",
        "C": "#6b4423", "O": "#3aa7c9", "D": "#5a3d1f",
      };
      const base = baseByChar[char] ?? "#3a5f2a";
      const jitter = Math.floor(rand() * 22) - 11;
      ctx.fillStyle = shade(base, jitter);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16 & 255) + amt));
  const g = Math.max(0, Math.min(255, (n >> 8 & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function chestTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 2, 5, 12, 9, "#8a5a2b");
  fill(ctx, 4, 3, 8, 3, "#a06a36");
  fill(ctx, 7, 6, 2, 3, "#f2c14e");
}

function portalTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 1, 1, 14, 14, "#123");
  for (let i = 0; i < 24; i++) ctx.fillStyle = i % 2 ? "#3aa7c9" : "#7de3ff";
  for (let y = 2; y < 14; y += 3) {
    ctx.fillStyle = "#7de3ff";
    ctx.fillRect(2 + ((y * 3) % 12), y, 2, 1);
  }
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(1, 1, 14, 1);
}

function treeTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 6, 9, 4, 5, "#5a3d1f");
  fill(ctx, 2, 2, 12, 10, "#1e5a30");
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(4, 3, 3, 3);
}

function waterTile(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < 8; i++) ctx.fillStyle = i % 2 ? "#1d5fa3" : "#2a7fc7";
  for (let y = 2; y < TILE_H; y += 4) {
    ctx.fillStyle = "#9fe8ff";
    ctx.fillRect(Math.floor(y / 2) % 6, y, 3, 1);
  }
}

function wallTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 0, 0, TILE_W, TILE_H, "#565665");
  ctx.fillStyle = "#6f6f80";
  ctx.fillRect(0, 0, TILE_W, 2);
  ctx.fillRect(0, 0, 2, TILE_H);
}

function doorTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 0, 0, TILE_W, TILE_H, "#5a3d1f");
  ctx.fillStyle = "#3c2713";
  ctx.fillRect(2, 2, 12, 12);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(12, 7, 2, 2);
}

function crackTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 0, 0, TILE_W, TILE_H, "#8b8b99");
  ctx.fillStyle = "#565665";
  ctx.fillRect(7, 0, 1, 4);
  ctx.fillRect(4, 4, 1, 3);
  ctx.fillRect(10, 5, 1, 5);
  ctx.fillRect(6, 9, 3, 1);
  ctx.fillRect(11, 10, 1, 3);
}

function flowerTile(ctx: CanvasRenderingContext2D): void {
  fill(ctx, 0, 0, TILE_W, TILE_H, "#3a5f2a");
  ctx.fillStyle = "#2e4f22";
  ctx.fillRect(0, 10, TILE_W, 1);
  ctx.fillStyle = "#e06c9f";
  ctx.fillRect(6, 5, 2, 2);
  ctx.fillRect(11, 9, 2, 2);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(3, 11, 2, 2);
}

function drawTile(ctx: CanvasRenderingContext2D, idx: number): void {
  switch (idx) {
    case TILE.grass:
    case TILE.dirt:
    case TILE.stone:
      spear(ctx, idx + 1);
      break;
    case TILE.wall: return wallTile(ctx);
    case TILE.tree: return treeTile(ctx);
    case TILE.water: return waterTile(ctx);
    case TILE.chest: return chestTile(ctx);
    case TILE.portal: return portalTile(ctx);
    case TILE.door: return doorTile(ctx);
    case TILE.crack: return crackTile(ctx);
    case TILE.flower: return flowerTile(ctx);
    default: spear(ctx, idx + 1);
  }
}

export function buildTileAtlas(scene: Phaser.Scene): Phaser.Textures.CanvasTexture {
  const cols = 4;
  const rows = 3;
  const canvas = scene.textures.createCanvas("landscape", cols * TILE_W, rows * TILE_H);
  const ctx = canvas!.getContext();
  for (let i = 0; i < cols * rows; i++) {
    const tx = (i % cols) * TILE_W;
    const ty = Math.floor(i / cols) * TILE_H;
    drawTile(ctx, i);
    if (i === TILE.grass) sprout(ctx, tx, ty);
    ctx.drawImage(ctx.canvas, tx, ty, TILE_W, TILE_H, tx, ty, TILE_W, TILE_H);
    void tx; void ty;
  }
  void ctx;
  canvas!.refresh();
  return canvas!;
}

function sprout(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  ctx.fillStyle = "#2e4f22";
  ctx.fillRect(ox + 3, oy + 9, 2, 3);
  ctx.fillRect(ox + 11, oy + 12, 2, 2);
  ctx.fillStyle = "#4a7a34";
  ctx.fillRect(ox + 8, oy + 10, 2, 2);
}

interface SpriteSpec {
  key: string;
  w: number;
  h: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export function buildSprites(scene: Phaser.Scene): void {
  const sprites: SpriteSpec[] = [
    {
      key: "player",
      w: 12, h: 16,
      draw: (ctx) => {
        fill(ctx, 4, 0, 4, 4, "#f0c8a0");
        fill(ctx, 3, 4, 6, 3, "#d84b4b");
        fill(ctx, 2, 7, 8, 5, "#2f56c9");
        fill(ctx, 4, 12, 3, 3, "#2f56c9");
        fill(ctx, 8, 12, 3, 3, "#3b3b3b");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(5, 2, 2, 1);
      },
    },
    {
      key: "npc",
      w: 12, h: 16,
      draw: (ctx) => {
        fill(ctx, 4, 0, 4, 4, "#c78a4b");
        fill(ctx, 3, 4, 6, 3, "#7ad84b");
        fill(ctx, 2, 7, 8, 5, "#6b9d3a");
        fill(ctx, 4, 12, 3, 3, "#6b9d3a");
        fill(ctx, 8, 12, 3, 3, "#3b3b3b");
      },
    },
    {
      key: "slime",
      w: 14, h: 12,
      draw: (ctx) => {
        fill(ctx, 2, 5, 10, 6, "#4a8fe0");
        fill(ctx, 3, 4, 8, 2, "#5ba0f0");
        ctx.fillStyle = "#10131a";
        ctx.fillRect(4, 8, 2, 2);
        ctx.fillRect(8, 8, 2, 2);
      },
    },
    {
      key: "boss",
      w: 26, h: 24,
      draw: (ctx) => {
        fill(ctx, 3, 6, 20, 14, "#7a2b8f");
        fill(ctx, 5, 4, 16, 4, "#9440a8");
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(6, 10, 2, 2);
        ctx.fillRect(18, 10, 2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(4, 2, 4, 1);
        ctx.fillRect(18, 2, 4, 1);
      },
    },
    {
      key: "potion",
      w: 8, h: 10,
      draw: (ctx) => {
        ctx.fillStyle = "#c83b3b";
        ctx.fillRect(2, 2, 4, 6);
        ctx.fillRect(3, 0, 2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(3, 3, 2, 2);
      },
    },
    {
      key: "upgrade",
      w: 10, h: 10,
      draw: (ctx) => {
        ctx.fillStyle = "#d8b45a";
        ctx.fillRect(4, 0, 2, 10);
        ctx.fillRect(0, 4, 10, 2);
      },
    },
    {
      key: "coin",
      w: 8, h: 8,
      draw: (ctx) => {
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(1, 1, 6, 6);
        ctx.fillStyle = "#8a6a1f";
        ctx.fillRect(2, 2, 4, 4);
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(3, 3, 2, 2);
      },
    },
    {
      key: "heart",
      w: 8, h: 8,
      draw: (ctx) => {
        ctx.fillStyle = "#e04040";
        ctx.fillRect(1, 3, 6, 3);
        ctx.fillRect(2, 2, 4, 1);
        ctx.fillRect(1, 1, 1, 2);
        ctx.fillRect(6, 1, 1, 2);
      },
    },
    {
      key: "sword",
      w: 16, h: 16,
      draw: (ctx) => {
        ctx.fillStyle = "#c9c9d8";
        ctx.fillRect(8, 2, 2, 8);
        ctx.fillRect(7, 2, 4, 2);
        ctx.fillStyle = "#8a5a2b";
        ctx.fillRect(7, 12, 4, 3);
      },
    },
  ];

  for (const spec of sprites) {
    const tex = scene.textures.createCanvas(spec.key, spec.w, spec.h);
    spec.draw(tex!.getContext());
    tex!.refresh();
  }
}