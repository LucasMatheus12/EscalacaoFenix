import type { Player } from "../types/player";
import type { DrawConfig, GameType } from "../types/team";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { sortPlayersByName } from "./drawUtils";

const SESSIONS_KEY = "fenix:sessions";
const GAME_TYPE_KEY = "fenix:gameType";
const LEGACY_PLAYERS_KEY = "fenix:players";
const LEGACY_CONFIG_KEY = "fenix:config";
const LEGACY_SEEDED_KEY = "fenix:legacySeeded";

const sessionsKeyFor = (userId?: string): string =>
  userId ? `fenix:sessions:${userId}` : SESSIONS_KEY;

export type SyncStatus = "offline" | "syncing" | "cloud" | "error";

export interface GameSession {
  players: Player[];
  config: DrawConfig;
}

type StoredSessions = Partial<Record<GameType, GameSession>>;

interface RemoteSessionRow {
  user_id?: string;
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

const loadSessions = (userId?: string): StoredSessions => {
  const raw = localStorage.getItem(sessionsKeyFor(userId));
  if (!raw) {
    return userId ? {} : migrateLegacyStorage();
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

const saveSessions = (sessions: StoredSessions, userId?: string): void => {
  localStorage.setItem(sessionsKeyFor(userId), JSON.stringify(sessions));
};

export const loadGameType = (): GameType => {
  const raw = localStorage.getItem(GAME_TYPE_KEY);
  return raw === "campo" ? "campo" : "quadra";
};

export const saveGameType = (gameType: GameType): void => {
  localStorage.setItem(GAME_TYPE_KEY, gameType);
};

export const loadSession = (gameType: GameType, userId?: string): GameSession => {
  const sessions = loadSessions(userId);
  const session = sessions[gameType];

  if (!session) {
    return emptySession(gameType);
  }

  return normalizeSession(session, gameType);
};

export const saveSession = (gameType: GameType, session: GameSession, userId?: string): void => {
  const sessions = loadSessions(userId);
  sessions[gameType] = normalizeSession(session, gameType);
  saveSessions(sessions, userId);
};

export const clearSession = (gameType: GameType, userId?: string): void => {
  const sessions = loadSessions(userId);
  delete sessions[gameType];
  saveSessions(sessions, userId);
};

const seedFromLegacyIfNeeded = (userId: string, gameType: GameType): GameSession => {
  const owned = loadSession(gameType, userId);
  if (owned.players.length || localStorage.getItem(LEGACY_SEEDED_KEY)) {
    return owned;
  }

  const legacy = loadSession(gameType);
  if (!legacy.players.length) {
    return owned;
  }

  saveSession(gameType, legacy, userId);
  localStorage.setItem(LEGACY_SEEDED_KEY, userId);
  return legacy;
};

export const pullRemoteSession = async (
  gameType: GameType,
  userId: string,
): Promise<GameSession | null> => {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("game_sessions")
    .select("game_type, players, config")
    .eq("user_id", userId)
    .eq("game_type", gameType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as RemoteSessionRow;
  return normalizeSession({ players: row.players ?? [], config: row.config }, gameType);
};

export const pushRemoteSession = async (
  gameType: GameType,
  session: GameSession,
  userId?: string,
): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase || !userId) {
    return false;
  }

  const nextSession = normalizeSession(session, gameType);
  const { error } = await supabase.from("game_sessions").upsert({
    user_id: userId,
    game_type: gameType,
    players: nextSession.players,
    config: nextSession.config,
    updated_at: new Date().toISOString(),
  });

  return !error;
};

export const hydrateSession = async (gameType: GameType, userId: string): Promise<GameSession> => {
  const local = seedFromLegacyIfNeeded(userId, gameType);
  if (!isSupabaseConfigured()) {
    return local;
  }

  const remote = await pullRemoteSession(gameType, userId);
  if (remote) {
    saveSession(gameType, remote, userId);
    return remote;
  }

  await pushRemoteSession(gameType, local, userId);
  return local;
};

export const clearStoredData = async (gameType: GameType, userId?: string): Promise<void> => {
  const reset = emptySession(gameType);
  saveSession(gameType, reset, userId);
  await pushRemoteSession(gameType, reset, userId);
};
