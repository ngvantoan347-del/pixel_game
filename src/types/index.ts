export type MapId = "village" | "forest" | "cave" | "arena";
export type Direction = "up" | "down" | "left" | "right";
export type ItemType = "potion" | "sword_upgrade";

export interface QuestState {
  slime_quest: {
    accepted: boolean;
    kills: number;
    complete: boolean;
    claimed: boolean;
  };
}

export interface SaveState {
  map_id: MapId;
  pos_x: number;
  pos_y: number;
  hp: number;
  max_hp: number;
  coins: number;
  sword_level: number;
  items: ItemType[];
  quests: QuestState;
  boss_defeated: boolean;
  score: number;
}

export interface PublicUser {
  id: number;
  username: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  boss_defeated: boolean;
  updated_at: string;
}