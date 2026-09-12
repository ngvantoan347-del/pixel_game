import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/config";
import { getGameSession } from "@/game/systems/session";
import { getQuestProgress } from "@/game/systems/quest";

export class DialogueScene extends Phaser.Scene {
  private panel!: Phaser.GameObjects.Rectangle;
  private nameText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private lines: string[] = [];
  private index = 0;
  private npcId: string = "quest";

  constructor() {
    super("DialogueScene");
  }

  create(data: { npcId?: string }): void {
    this.npcId = data.npcId ?? "quest";
    this.index = 0;
    this.lines = this.buildLines();

    this.panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 110, GAME_WIDTH - 80, 120, 0x222844, 0.95)
      .setStrokeStyle(2, 0x7dd3fc).setScrollFactor(0).setDepth(300);

    this.nameText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 170, "Bác Trưởng Làng", {
      fontSize: "16px", fontFamily: "monospace", color: "#f2c14e",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    this.bodyText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 105, "", {
      fontSize: "14px", fontFamily: "monospace", color: "#e8e8f0",
      align: "center", wordWrap: { width: GAME_WIDTH - 160 }, lineSpacing: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

    this.input.keyboard!.on("keydown-SPACE", () => this.advance());
    this.input.keyboard!.on("keydown-E", () => this.advance());
    this.panel.setInteractive();
    this.panel.on("pointerdown", () => this.advance());

    this.render();
  }

  private buildLines(): string[] {
    const save = getGameSession()?.get();
    const q = save ? getQuestProgress(save.quests) : { state: "not_accepted" as const, kills: 0, target: 5 };
    if (q.state === "not_accepted") {
      return [
        "Chào nhà thám hiểm! Tên ta là Bác Trưởng Làng.",
        "Khu Rừng Xanh đang bị lũ SLIME hoành hành.",
        "Hãy tiêu diệt 5 con SLIME, ta sẽ thưởng cho ngươi 40 xu!",
        "Chấp nhận nhiệm vụ? (SPACE / E để đồng ý)",
      ];
    }
    if (q.state === "in_progress") {
      return [`Ngươi đã hạ ${q.kills}/${q.target} SLIME. Cố lên!`];
    }
    if (q.state === "complete") {
      return ["Xuất sắc! Ngươi đã diệt hết lũ SLIME.", "Đây là phần thưởng: 40 xu!"];
    }
    return ["Cảm ơn ngươi đã giúp làng! Hãy tiếp tục cuộc phiêu lưu."];
  }

  private advance(): void {
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.complete();
      return;
    }
    this.render();
  }

  private render(): void {
    this.bodyText.setText(this.lines[this.index]);
  }

  private complete(): void {
    const session = getGameSession();
    if (session) {
      const q = getQuestProgress(session.get().quests);
      if (q.state === "not_accepted") {
        session.acceptQuest();
      } else if (q.state === "complete") {
        session.claimQuest();
      }
    }
    this.scene.stop();
  }
}