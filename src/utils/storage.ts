import type { Player } from "../types/player";
import type { DrawConfig, GameType } from "../types/team";
import { sortPlayersByName } from "./drawUtils";

const SESSIONS_KEY = "fenix:sessions";
const GAME_TYPE_KEY = "fenix:gameType";
const LEGACY_PLAYERS_KEY = "fenix:players";
const LEGACY_CONFIG_KEY = "fenix:config";

export interface GameSession {
  players: Player[];
  config: DrawConfig;
}

type StoredSessions = Partial<Record<GameType, GameSession>>;

const defaultConfigByType: Record<GameType, DrawConfig> = {
  quadra: { teamCount: 2, playersPerTeam: 5 },
  campo: { teamCount: 2, playersPerTeam: 7 },
};

const emptySession = (gameType: GameType): GameSession => ({
  players: [],
  config: defaultConfigByType[gameType],
});

const parsePlayers = (raw: string | null): Player[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Player[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortPlayersByName(
      parsed.map((player) => ({
        ...player,
        position: player.position?.trim() || "",
      })),
    );
  } catch {
    return [];
  }
};

const parseConfig = (raw: string | null, gameType: GameType): DrawConfig => {
  if (!raw) {
    return defaultConfigByType[gameType];
  }

  try {
    const parsed = JSON.parse(raw) as DrawConfig;
    if (!parsed.teamCount || !parsed.playersPerTeam) {
      return defaultConfigByType[gameType];
    }
    return parsed;
  } catch {
    return defaultConfigByType[gameType];
  }
};

const migrateLegacyStorage = (): StoredSessions => {
  const legacyPlayers = localStorage.getItem(LEGACY_PLAYERS_KEY);
  const legacyConfig = localStorage.getItem(LEGACY_CONFIG_KEY);

  if (!legacyPlayers && !legacyConfig) {
    return {};
  }

  const migrated: StoredSessions = {
    quadra: {
      players: parsePlayers(legacyPlayers),
      config: parseConfig(legacyConfig, "quadra"),
    },
  };

  localStorage.removeItem(LEGACY_PLAYERS_KEY);
  localStorage.removeItem(LEGACY_CONFIG_KEY);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(migrated));

  return migrated;
};

const loadSessions = (): StoredSessions => {
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) {
    return migrateLegacyStorage();
  }

  try {
    const parsed = JSON.parse(raw) as StoredSessions;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
};

const saveSessions = (sessions: StoredSessions): void => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const loadGameType = (): GameType => {
  const raw = localStorage.getItem(GAME_TYPE_KEY);
  return raw === "campo" ? "campo" : "quadra";
};

export const saveGameType = (gameType: GameType): void => {
  localStorage.setItem(GAME_TYPE_KEY, gameType);
};

export const loadSession = (gameType: GameType): GameSession => {
  const sessions = loadSessions();
  const session = sessions[gameType];

  if (!session) {
    return emptySession(gameType);
  }

  return {
    players: parsePlayers(JSON.stringify(session.players)),
    config: parseConfig(JSON.stringify(session.config), gameType),
  };
};

export const saveSession = (gameType: GameType, session: GameSession): void => {
  const sessions = loadSessions();
  sessions[gameType] = {
    players: sortPlayersByName(
      session.players.map((player) => ({
        ...player,
        position: player.position?.trim() || "",
      })),
    ),
    config: session.config,
  };
  saveSessions(sessions);
};

export const clearSession = (gameType: GameType): void => {
  const sessions = loadSessions();
  delete sessions[gameType];
  saveSessions(sessions);
};

export const clearStoredData = (gameType: GameType): void => {
  clearSession(gameType);
};
