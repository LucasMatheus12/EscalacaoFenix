import { useMemo, useState } from "react";
import { ResultView } from "./components/ResultView";
import type { Player } from "./types/player";
import type { DrawConfig, DrawResult, GameType } from "./types/team";
import { balanceTeams } from "./utils/balanceTeams";
import { sortPlayersByName, swapPlayersInDraw, type PlayerSlot } from "./utils/drawUtils";
import {
  clearStoredData,
  loadGameType,
  loadSession,
  saveGameType,
  saveSession,
} from "./utils/storage";
import { validateDrawConfig } from "./utils/validations";
import { HomeView } from "./views/HomeView";
import { SetupView } from "./views/SetupView";

type Screen = "home" | "setup" | "results";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [gameType, setGameType] = useState<GameType>(() => loadGameType());
  const initialSession = loadSession(loadGameType());
  const [players, setPlayers] = useState<Player[]>(() => initialSession.players);
  const [config, setConfig] = useState<DrawConfig>(() => initialSession.config);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [result, setResult] = useState<DrawResult | null>(null);

  const warningMessage = useMemo(
    () => validateDrawConfig(config, players.length),
    [config, players.length],
  );
  const requiredPlayers = config.teamCount * config.playersPerTeam;
  const addLocked = players.length >= requiredPlayers;
  const addLockMessage = `Limite atingido para esta configuracao (${requiredPlayers} jogadores). Ajuste a configuracao para cadastrar mais.`;

  const persistSession = (nextPlayers: Player[], nextConfig: DrawConfig) => {
    saveSession(gameType, { players: nextPlayers, config: nextConfig });
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
    if (!id && addLocked) {
      return;
    }

    const nextPlayers = sortPlayersByName(
      id
        ? players.map((player) => (player.id === id ? { ...player, name, position, rating } : player))
        : [...players, { id: crypto.randomUUID(), name, position, rating }],
    );

    setPlayers(nextPlayers);
    persistSession(nextPlayers, config);
    setEditingPlayer(null);
  };

  const removePlayer = (playerId: string) => {
    const nextPlayers = players.filter((player) => player.id !== playerId);
    setPlayers(nextPlayers);
    persistSession(nextPlayers, config);
    if (editingPlayer?.id === playerId) {
      setEditingPlayer(null);
    }
  };

  const updateConfig = (nextConfig: DrawConfig) => {
    setConfig(nextConfig);
    persistSession(players, nextConfig);
  };

  const switchGameType = (nextGameType: GameType) => {
    if (nextGameType === gameType) {
      return;
    }

    persistSession(players, config);

    const nextSession = loadSession(nextGameType);
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
    setScreen("results");
  };

  const handleSwapPlayers = (slotA: PlayerSlot, slotB: PlayerSlot) => {
    setResult((current) => (current ? swapPlayersInDraw(current, slotA, slotB) : current));
  };

  const clearAll = () => {
    clearStoredData(gameType);
    const resetSession = loadSession(gameType);
    setPlayers([]);
    setConfig(resetSession.config);
    setResult(null);
    setEditingPlayer(null);
    setScreen("setup");
  };

  return (
    <main className="app-shell">
      {screen === "home" ? <HomeView onStart={() => setScreen("setup")} /> : null}
      {screen === "setup" ? (
        <SetupView
          gameType={gameType}
          onGameTypeChange={switchGameType}
          players={players}
          config={config}
          warningMessage={warningMessage}
          editingPlayer={editingPlayer}
          onPlayerSubmit={addOrUpdatePlayer}
          onEditPlayer={setEditingPlayer}
          onDeletePlayer={removePlayer}
          onCancelEdit={() => setEditingPlayer(null)}
          onConfigChange={updateConfig}
          onDraw={handleDraw}
          drawDisabled={Boolean(warningMessage)}
          addLocked={addLocked}
          addLockMessage={addLockMessage}
        />
      ) : null}
      {screen === "results" && result ? (
        <ResultView
          result={result}
          onRedraw={handleDraw}
          onSwapPlayers={handleSwapPlayers}
          onEditPlayers={() => setScreen("setup")}
          onEditConfig={() => setScreen("setup")}
          onClearAll={clearAll}
        />
      ) : null}
    </main>
  );
}

export default App;
