import type { Player } from "../types/player";
import type { DrawConfig, GameType } from "../types/team";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { sortPlayersByName } from "./drawUtils";

const SESSIONS_KEY = "fenix:sessions";
const GAME_TYPE_KEY = "fenix:gameType";
const LEGACY_PLAYERS_KEY = "fenix:players";
const LEGACY_CONFIG_KEY = "fenix:config";

export type SyncStatus = "offline" | "syncing" | "cloud" | "error";

export interface GameSession {
  players: Player[];
  config: DrawConfig;
}

type StoredSessions = Partial<Record<GameType, GameSession>>;

interface RemoteSessionRow {
  game_type: GameType;
  players: Player[];
  config: DrawConfig;
}

const defaultConfigByType: Record<GameType, DrawConfig> = {
  quadra: { teamCount: 3, playersPerTeam: 6 },
  campo: { teamCount: 3, playersPerTeam: 6 },
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

const normalizeSession = (session: GameSession, gameType: GameType): GameSession => ({
  players: sortPlayersByName(
    (session.players ?? []).map((player) => ({
      ...player,
      position: player.position?.trim() || "",
    })),
  ),
  config: parseConfig(JSON.stringify(session.config ?? null), gameType),
});

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

  return normalizeSession(session, gameType);
};

export const saveSession = (gameType: GameType, session: GameSession): void => {
  const sessions = loadSessions();
  sessions[gameType] = normalizeSession(session, gameType);
  saveSessions(sessions);
};

export const clearSession = (gameType: GameType): void => {
  const sessions = loadSessions();
  delete sessions[gameType];
  saveSessions(sessions);
};

export const pullRemoteSession = async (gameType: GameType): Promise<GameSession | null> => {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("game_sessions")
    .select("game_type, players, config")
    .eq("game_type", gameType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as RemoteSessionRow;
  return normalizeSession({ players: row.players ?? [], config: row.config }, gameType);
};

export const pushRemoteSession = async (gameType: GameType, session: GameSession): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    return false;
  }

  const nextSession = normalizeSession(session, gameType);
  const { error } = await supabase.from("game_sessions").upsert({
    game_type: gameType,
    players: nextSession.players,
    config: nextSession.config,
    updated_at: new Date().toISOString(),
  });

  return !error;
};

export const hydrateSession = async (gameType: GameType): Promise<GameSession> => {
  const local = loadSession(gameType);
  if (!isSupabaseConfigured()) {
    return local;
  }

  const remote = await pullRemoteSession(gameType);
  if (remote) {
    saveSession(gameType, remote);
    return remote;
  }

  await pushRemoteSession(gameType, local);
  return local;
};

export const clearStoredData = async (gameType: GameType): Promise<void> => {
  const reset = emptySession(gameType);
  saveSession(gameType, reset);
  await pushRemoteSession(gameType, reset);
};
