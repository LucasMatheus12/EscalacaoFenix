import { Shuffle } from "lucide-react";
import type { Player } from "../types/player";
import type { DrawConfig, GameType } from "../types/team";
import type { SyncStatus } from "../utils/storage";
import { DrawConfig as DrawConfigForm } from "../components/DrawConfig";
import { GameTypeSelector } from "../components/GameTypeSelector";
import { PlayerForm } from "../components/PlayerForm";
import { PlayerList } from "../components/PlayerList";
import { fieldPlayersOf, goalkeepersOf, listedReservesOf } from "../utils/drawUtils";

interface SetupViewProps {
  gameType: GameType;
  onGameTypeChange: (gameType: GameType) => void;
  syncStatus: SyncStatus;
  players: Player[];
  config: DrawConfig;
  warningMessage: string | null;
  editingPlayer: Player | null;
  onPlayerSubmit: (payload: { name: string; position: string; rating: number; id?: string }) => void;
  onBulkAdd: (entries: { name: string; position: string }[]) => {
    added: number;
    skipped: number;
    updated: number;
  };
  onEditPlayer: (player: Player) => void;
  onRatePlayer: (playerId: string, rating: number) => void;
  onDeletePlayer: (playerId: string) => void;
  onCancelEdit: () => void;
  onConfigChange: (config: DrawConfig) => void;
  onDraw: () => void;
  drawDisabled: boolean;
}

export function SetupView({
  gameType,
  onGameTypeChange,
  syncStatus,
  players,
  config,
  warningMessage,
  editingPlayer,
  onPlayerSubmit,
  onBulkAdd,
  onEditPlayer,
  onRatePlayer,
  onDeletePlayer,
  onCancelEdit,
  onConfigChange,
  onDraw,
  drawDisabled,
}: SetupViewProps) {
  return (
    <section className="setup-view">
      <GameTypeSelector value={gameType} onChange={onGameTypeChange} syncStatus={syncStatus} />
      <PlayerForm
        onSubmit={onPlayerSubmit}
        onBulkAdd={onBulkAdd}
        editingPlayer={editingPlayer}
        onCancelEdit={onCancelEdit}
      />
      <PlayerList
        players={players}
        onEdit={onEditPlayer}
        onRate={onRatePlayer}
        onDelete={onDeletePlayer}
      />
      <DrawConfigForm
        config={config}
        fieldCount={fieldPlayersOf(players).length}
        goalkeeperCount={goalkeepersOf(players).length}
        listedReserveCount={listedReservesOf(players).length}
        onChange={onConfigChange}
        warningMessage={warningMessage}
      />
      <button type="button" className="btn primary big-action" onClick={onDraw} disabled={drawDisabled}>
        <Shuffle size={16} /> Sortear times
      </button>
    </section>
  );
}
