import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { ResultView } from "./components/ResultView";
import { useAuth } from "./hooks/useAuth";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { SCREEN_PATHS, SCREEN_TITLES, screenFromPath, type Screen } from "./navigation";
import type { Player } from "./types/player";
import type { DrawConfig, DrawResult, GameType } from "./types/team";
import { getSupabase, isSupabaseConfigured } from "./lib/supabase";
import { balanceTeams } from "./utils/balanceTeams";
import { sortPlayersByName, swapPlayersInDraw, type PlayerSlot } from "./utils/drawUtils";
import {
  clearStoredData,
  hydrateSession,
  loadGameType,
  loadSession,
  pushRemoteSession,
  saveGameType,
  saveSession,
  type SyncStatus,
} from "./utils/storage";
import { validateDrawConfig } from "./utils/validations";
import { HomeView } from "./views/HomeView";
import { LoginView } from "./views/LoginView";
import { SetupView } from "./views/SetupView";

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const userId = user?.id;
  const [screen, setScreen] = useState<Screen>(() => screenFromPath(window.location.pathname));
  const [gameType, setGameType] = useState<GameType>(() => loadGameType());
  const [players, setPlayers] = useState<Player[]>([]);
  const [config, setConfig] = useState<DrawConfig>({ teamCount: 3, playersPerTeam: 6 });
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isSupabaseConfigured() ? "syncing" : "offline",
  );
  const resultRef = useRef<DrawResult | null>(null);
  const { canInstall, iosHint, install } = usePwaInstall();

  resultRef.current = result;

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    document.body.classList.toggle("is-standalone", standalone);
  }, []);

  const warningMessage = useMemo(() => validateDrawConfig(config, players), [config, players]);

  const goTo = (next: Screen) => {
    if (next === "results" && !resultRef.current) {
      return;
    }

    const path = SCREEN_PATHS[next];
    if (window.location.pathname !== path) {
      window.history.pushState({ screen: next }, "", path);
    }
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  useEffect(() => {
    if (screen === "results" && !result) {
      window.history.replaceState({ screen: "setup" }, "", SCREEN_PATHS.setup);
      setScreen("setup");
    }
  }, [screen, result]);

  useEffect(() => {
    const onPopState = () => {
      const next = screenFromPath(window.location.pathname);
      if (next === "results" && !resultRef.current) {
        window.history.replaceState({ screen: "setup" }, "", SCREEN_PATHS.setup);
        setScreen("setup");
        return;
      }
      setScreen(next);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!isSupabaseConfigured()) {
        const session = loadSession(gameType);
        if (!cancelled) {
          setPlayers(session.players);
          setConfig(session.config);
          setSyncStatus("offline");
        }
        return;
      }

      if (!userId) {
        setPlayers([]);
        setResult(null);
        setEditingPlayer(null);
        setSyncStatus(isSupabaseConfigured() ? "syncing" : "offline");
        return;
      }

      setSyncStatus("syncing");
      try {
        const session = await hydrateSession(gameType, userId);
        if (cancelled) {
          return;
        }
        setPlayers(session.players);
        setConfig(session.config);
        setSyncStatus("cloud");
      } catch {
        if (!cancelled) {
          setSyncStatus("error");
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [gameType, userId]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !userId) {
      return;
    }

    const channel = supabase
      .channel(`game_sessions:${userId}:${gameType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            game_type?: GameType;
            players?: Player[];
            config?: DrawConfig;
          } | undefined;
          if (!row?.players || !row.config || row.game_type !== gameType) {
            return;
          }

          const nextPlayers = sortPlayersByName(row.players);
          setPlayers(nextPlayers);
          setConfig(row.config);
          saveSession(gameType, { players: nextPlayers, config: row.config }, userId);
          setSyncStatus("cloud");
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [gameType, userId]);

  const saveCurrentSession = (nextPlayers: Player[], nextConfig: DrawConfig) => {
    const session = { players: nextPlayers, config: nextConfig };
    saveSession(gameType, session, userId);
    if (!isSupabaseConfigured() || !userId) {
      return;
    }
    void pushRemoteSession(gameType, session, userId).then((ok) => {
      setSyncStatus(ok ? "cloud" : "error");
    });
  };

  const addOrUpdatePlayer = ({
    name,
    position,
    rating,
    id,
  }: {
    name: string;
    position: string;
    rating: number;
    id?: string;
  }) => {
    const nextPlayers = sortPlayersByName(
      id
        ? players.map((player) => (player.id === id ? { ...player, name, position, rating } : player))
        : [...players, { id: crypto.randomUUID(), name, position, rating }],
    );

    setPlayers(nextPlayers);
    saveCurrentSession(nextPlayers, config);
    setEditingPlayer(null);
  };

  const addManyPlayers = (entries: { name: string; position: string }[]) => {
    const byName = new Map(
      players.map((player) => [player.name.toLocaleLowerCase("pt-BR"), player] as const),
    );
    const nextPlayers = [...players];
    let added = 0;
    let updated = 0;
    let skipped = 0;

    entries.forEach((entry) => {
      const key = entry.name.toLocaleLowerCase("pt-BR");
      const current = byName.get(key);

      if (!current) {
        const created: Player = {
          id: crypto.randomUUID(),
          name: entry.name,
          position: entry.position,
          rating: 0,
        };
        nextPlayers.push(created);
        byName.set(key, created);
        added += 1;
        return;
      }

      if (entry.position && current.position !== entry.position) {
        const patched = { ...current, position: entry.position };
        const index = nextPlayers.findIndex((player) => player.id === current.id);
        if (index >= 0) {
          nextPlayers[index] = patched;
        }
        byName.set(key, patched);
        updated += 1;
        return;
      }

      skipped += 1;
    });

    if (added || updated) {
      const sorted = sortPlayersByName(nextPlayers);
      setPlayers(sorted);
      saveCurrentSession(sorted, config);
    }

    return { added, skipped, updated };
  };

  const updatePlayerRating = (playerId: string, rating: number) => {
    const nextPlayers = players.map((player) =>
      player.id === playerId ? { ...player, rating } : player,
    );
    setPlayers(nextPlayers);
    saveCurrentSession(nextPlayers, config);
  };

  const removePlayer = (playerId: string) => {
    const nextPlayers = players.filter((player) => player.id !== playerId);
    setPlayers(nextPlayers);
    saveCurrentSession(nextPlayers, config);
    if (editingPlayer?.id === playerId) {
      setEditingPlayer(null);
    }
  };

  const updateConfig = (nextConfig: DrawConfig) => {
    setConfig(nextConfig);
    saveCurrentSession(players, nextConfig);
  };

  const switchGameType = (nextGameType: GameType) => {
    if (nextGameType === gameType) {
      return;
    }

    saveCurrentSession(players, config);

    const nextSession = loadSession(nextGameType, userId);
    setGameType(nextGameType);
    saveGameType(nextGameType);
    setPlayers(nextSession.players);
    setConfig(nextSession.config);
    setEditingPlayer(null);
    setResult(null);
  };

  const handleDraw = () => {
    if (warningMessage) {
      return;
    }
    const drawResult = balanceTeams(players, config.teamCount, config.playersPerTeam);
    setResult(drawResult);
    window.history.pushState({ screen: "results" }, "", SCREEN_PATHS.results);
    setScreen("results");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleSwapPlayers = (slotA: PlayerSlot, slotB: PlayerSlot) => {
    setResult((current) => (current ? swapPlayersInDraw(current, slotA, slotB) : current));
  };

  const clearAll = async () => {
    await clearStoredData(gameType, userId);
    const resetSession = loadSession(gameType, userId);
    setPlayers([]);
    setConfig(resetSession.config);
    setResult(null);
    setEditingPlayer(null);
    goTo("setup");
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    goTo(screen === "results" ? "setup" : "home");
  };

  if (authLoading) {
    return (
      <main className="app-shell">
        <p className="muted">Carregando...</p>
      </main>
    );
  }

  if (isSupabaseConfigured() && !user) {
    return (
      <main className="app-shell">
        <LoginView onSignIn={signIn} onSignUp={signUp} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <AppHeader
        title={SCREEN_TITLES[screen]}
        showBack={screen !== "home"}
        canInstall={canInstall}
        onBack={goBack}
        onInstall={() => {
          void install();
        }}
        onSignOut={
          isSupabaseConfigured()
            ? () => {
                void signOut();
              }
            : undefined
        }
      />
      {screen === "home" ? (
        <HomeView
          onStart={() => goTo("setup")}
          canInstall={canInstall}
          iosHint={iosHint}
          onInstall={() => {
            void install();
          }}
        />
      ) : null}
      {screen === "setup" ? (
        <SetupView
          gameType={gameType}
          onGameTypeChange={switchGameType}
          syncStatus={syncStatus}
          players={players}
          config={config}
          warningMessage={warningMessage}
          editingPlayer={editingPlayer}
          onPlayerSubmit={addOrUpdatePlayer}
          onBulkAdd={addManyPlayers}
          onEditPlayer={setEditingPlayer}
          onRatePlayer={updatePlayerRating}
          onDeletePlayer={removePlayer}
          onCancelEdit={() => setEditingPlayer(null)}
          onConfigChange={updateConfig}
          onDraw={handleDraw}
          drawDisabled={Boolean(warningMessage)}
        />
      ) : null}
      {screen === "results" && result ? (
        <ResultView
          result={result}
          onRedraw={handleDraw}
          onSwapPlayers={handleSwapPlayers}
          onEditPlayers={() => goTo("setup")}
          onEditConfig={() => goTo("setup")}
          onClearAll={() => {
            void clearAll();
          }}
        />
      ) : null}
      <BottomNav screen={screen} hasResult={Boolean(result)} onNavigate={goTo} />
    </main>
  );
}

export default App;
