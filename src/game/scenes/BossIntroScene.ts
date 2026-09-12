import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";

export class BossIntroScene extends Phaser.Scene {
  constructor() {
    super("BossIntroScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#20061f");
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, "CẢNH BÁO", {
      fontSize: "40px", fontFamily: "monospace", color: "#ff5a5a",
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, "BOSS MỞ-TOÀN-KHỈ-LỤC  —  SẮP GIÁNG TRẦN", {
      fontSize: "16px", fontFamily: "monospace", color: "#ffd27f",
    }).setOrigin(0.5);

    this.time.delayedCall(1800, () => {
      this.scene.start("GameScene");
    });
  }
}