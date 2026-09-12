import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { loadGameSession, setGameSession } from "@/game/systems/session";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#10131a");

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, "PIXEL QUEST", {
      fontSize: "48px",
      fontFamily: "monospace",
      color: "#7dd3fc",
    }).setOrigin(0.5);
    title.setShadow(0, 3, "#000000", 6, true, true);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60,
      "WASD / Mũi tên: di chuyển   •   Space: chém   •   E: tương tác   •   1: uống thuốc   •   S: lưu",
      { fontSize: "14px", fontFamily: "monospace", color: "#a8a8b8", align: "center" },
    ).setOrigin(0.5);

    const start = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "[ BẮT ĐẦU ]", {
      fontSize: "24px",
      fontFamily: "monospace",
      color: "#f2c14e",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    start.on("pointerdown", () => {
      start.disableInteractive().setColor("#7c7c8c");
      void (async () => {
        const session = await loadGameSession();
        setGameSession(session);
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start("GameScene");
        });
      })();
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120,
      "Tiêu diệt SLIME, nhận quest từ NPC, vượt RỪNG và HANG, hạ BOSS để giành chiến thắng!",
      { fontSize: "12px", fontFamily: "monospace", color: "#7c7c8c", align: "center", wordWrap: { width: 620 } },
    ).setOrigin(0.5);
  }
}