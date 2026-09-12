import { fetchSave, saveGame, submitScore } from "@/lib/api";

export const loadSave: typeof fetchSave = fetchSave;

export const pushSave: typeof saveGame = saveGame;

export const submitRun: typeof submitScore = submitScore;