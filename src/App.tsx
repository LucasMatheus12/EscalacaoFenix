import { useMemo, useState } from "react";
import { ResultView } from "./components/ResultView";
import type { Player } from "./types/player";
import type { DrawConfig, DrawResult } from "./types/team";
import { balanceTeams } from "./utils/balanceTeams";
import { clearStoredData, loadConfig, loadPlayers, saveConfig, savePlayers } from "./utils/storage";
import { validateDrawConfig } from "./utils/validations";
import { HomeView } from "./views/HomeView";
import { SetupView } from "./views/SetupView";

type Screen = "home" | "setup" | "results";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [config, setConfig] = useState<DrawConfig>(() => loadConfig());
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [result, setResult] = useState<DrawResult | null>(null);

  const warningMessage = useMemo(
    () => validateDrawConfig(config, players.length),
    [config, players.length],
  );
  const requiredPlayers = config.teamCount * config.playersPerTeam;
  const addLocked = players.length >= requiredPlayers;
  const addLockMessage = `Limite atingido para esta configuracao (${requiredPlayers} jogadores). Ajuste a configuracao para cadastrar mais.`;

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

    const nextPlayers = id
      ? players.map((player) => (player.id === id ? { ...player, name, position, rating } : player))
      : [...players, { id: crypto.randomUUID(), name, position, rating }];

    setPlayers(nextPlayers);
    savePlayers(nextPlayers);
    setEditingPlayer(null);
  };

  const removePlayer = (playerId: string) => {
    const nextPlayers = players.filter((player) => player.id !== playerId);
    setPlayers(nextPlayers);
    savePlayers(nextPlayers);
    if (editingPlayer?.id === playerId) {
      setEditingPlayer(null);
    }
  };

  const updateConfig = (nextConfig: DrawConfig) => {
    setConfig(nextConfig);
    saveConfig(nextConfig);
  };

  const handleDraw = () => {
    if (warningMessage) {
      return;
    }
    const drawResult = balanceTeams(players, config.teamCount, config.playersPerTeam);
    setResult(drawResult);
    setScreen("results");
  };

  const clearAll = () => {
    setPlayers([]);
    setResult(null);
    setEditingPlayer(null);
    setConfig({ teamCount: 2, playersPerTeam: 5 });
    clearStoredData();
    setScreen("setup");
  };

  return (
    <main className="app-shell">
      {screen === "home" ? <HomeView onStart={() => setScreen("setup")} /> : null}
      {screen === "setup" ? (
        <SetupView
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
          onEditPlayers={() => setScreen("setup")}
          onEditConfig={() => setScreen("setup")}
          onClearAll={clearAll}
        />
      ) : null}
    </main>
  );
}

export default App;
