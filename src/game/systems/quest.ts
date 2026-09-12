import type { QuestState } from "@/types";

export const QUEST_TARGET_KILLS = 5;
export const QUEST_REWARD_COINS = 40;

export function defaultQuestState(): QuestState {
  return { slime_quest: { accepted: false, kills: 0, complete: false, claimed: false } };
}

export function acceptQuest(quests: QuestState): QuestState {
  if (quests.slime_quest.accepted) return quests;
  return { ...quests, slime_quest: { ...quests.slime_quest, accepted: true } };
}

export function recordSlimeKill(quests: QuestState): QuestState {
  const s = quests.slime_quest;
  if (s.complete) return quests;
  const kills = Math.min(s.kills + 1, QUEST_TARGET_KILLS);
  return { ...quests, slime_quest: { ...s, kills, complete: kills >= QUEST_TARGET_KILLS } };
}

export type QuestStateLabel = "not_accepted" | "in_progress" | "complete" | "claimed";

export function getQuestProgress(quests: QuestState): { kills: number; target: number; state: QuestStateLabel } {
  const s = quests.slime_quest;
  const base = { kills: s.kills, target: QUEST_TARGET_KILLS };
  if (!s.accepted) return { ...base, state: "not_accepted" };
  if (s.claimed) return { ...base, state: "claimed" };
  if (s.complete) return { ...base, state: "complete" };
  return { ...base, state: "in_progress" };
}

export function claimQuestReward(quests: QuestState, coins: number): { quests: QuestState; coins: number } {
  const s = quests.slime_quest;
  if (!s.complete || s.claimed) return { quests, coins };
  return {
    quests: { ...quests, slime_quest: { ...s, claimed: true } },
    coins: coins + QUEST_REWARD_COINS,
  };
}