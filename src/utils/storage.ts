import type { Player } from "../types/player";
import type { DrawConfig } from "../types/team";

const PLAYERS_KEY = "fenix:players";
const CONFIG_KEY = "fenix:config";

const defaultConfig: DrawConfig = {
  teamCount: 2,
  playersPerTeam: 5,
};

export const loadPlayers = (): Player[] => {
  const raw = localStorage.getItem(PLAYERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Player[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((player) => ({
      ...player,
      position: player.position?.trim() || "",
    }));
  } catch {
    return [];
  }
};

export const savePlayers = (players: Player[]): void => {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
};

export const loadConfig = (): DrawConfig => {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) {
    return defaultConfig;
  }

  try {
    const parsed = JSON.parse(raw) as DrawConfig;
    if (!parsed.teamCount || !parsed.playersPerTeam) {
      return defaultConfig;
    }
    return parsed;
  } catch {
    return defaultConfig;
  }
};

export const saveConfig = (config: DrawConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const clearStoredData = (): void => {
  localStorage.removeItem(PLAYERS_KEY);
  localStorage.removeItem(CONFIG_KEY);
};
