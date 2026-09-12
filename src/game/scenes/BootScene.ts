import * as Phaser from "phaser";
import { buildSprites, buildTileAtlas } from "@/game/systems/textures";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    buildSprites(this);
    buildTileAtlas(this);
    this.scene.start("TitleScene");
  }
}