import { describe, it, expect } from "vitest";
import {
  QUEST_TARGET_KILLS, QUEST_REWARD_COINS,
  defaultQuestState, acceptQuest, recordSlimeKill,
  getQuestProgress, claimQuestReward,
} from "@/game/systems/quest";

describe("quest", () => {
  it("defaults to not accepted", () => {
    const q = defaultQuestState();
    expect(q.slime_quest.accepted).toBe(false);
    expect(getQuestProgress(q).state).toBe("not_accepted");
  });

  it("accepts the quest once", () => {
    const q = acceptQuest(defaultQuestState());
    const again = acceptQuest(q);
    expect(q.slime_quest.accepted).toBe(true);
    expect(again.slime_quest.accepted).toBe(true);
    expect(getQuestProgress(q).state).toBe("in_progress");
  });

  it("records kills until complete", () => {
    let q = acceptQuest(defaultQuestState());
    for (let i = 0; i < QUEST_TARGET_KILLS; i++) q = recordSlimeKill(q);
    expect(q.slime_quest.complete).toBe(true);
    expect(getQuestProgress(q).state).toBe("complete");
    const after = recordSlimeKill(q);
    expect(after.slime_quest.kills).toBe(QUEST_TARGET_KILLS);
  });

  it("claims reward once", () => {
    let q = acceptQuest(defaultQuestState());
    for (let i = 0; i < QUEST_TARGET_KILLS; i++) q = recordSlimeKill(q);
    const res = claimQuestReward(q, 10);
    expect(res.coins).toBe(10 + QUEST_REWARD_COINS);
    const again = claimQuestReward(res.quests, res.coins);
    expect(again.coins).toBe(10 + QUEST_REWARD_COINS);
  });
});