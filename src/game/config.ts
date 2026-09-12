import * as Phaser from "phaser";

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
export const TILE_SIZE = 16;

export const GAME_STYLE = {
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  physics: { default: "arcade" as const, arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
};