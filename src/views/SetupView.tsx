import { Shuffle } from "lucide-react";
import type { Player } from "../types/player";
import type { DrawConfig } from "../types/team";
import { DrawConfig as DrawConfigForm } from "../components/DrawConfig";
import { PlayerForm } from "../components/PlayerForm";
import { PlayerList } from "../components/PlayerList";

interface SetupViewProps {
  players: Player[];
  config: DrawConfig;
  warningMessage: string | null;
  editingPlayer: Player | null;
  onPlayerSubmit: (payload: { name: string; position: string; rating: number; id?: string }) => void;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onCancelEdit: () => void;
  onConfigChange: (config: DrawConfig) => void;
  onDraw: () => void;
  drawDisabled: boolean;
  addLocked: boolean;
  addLockMessage: string;
}

export function SetupView({
  players,
  config,
  warningMessage,
  editingPlayer,
  onPlayerSubmit,
  onEditPlayer,
  onDeletePlayer,
  onCancelEdit,
  onConfigChange,
  onDraw,
  drawDisabled,
  addLocked,
  addLockMessage,
}: SetupViewProps) {
  return (
    <section className="setup-view">
      <PlayerForm
        onSubmit={onPlayerSubmit}
        editingPlayer={editingPlayer}
        onCancelEdit={onCancelEdit}
        addLocked={addLocked}
        addLockMessage={addLockMessage}
      />
      <PlayerList players={players} onEdit={onEditPlayer} onDelete={onDeletePlayer} />
      <DrawConfigForm
        config={config}
        totalPlayers={players.length}
        onChange={onConfigChange}
        warningMessage={warningMessage}
      />
      <button type="button" className="btn primary big-action" onClick={onDraw} disabled={drawDisabled}>
        <Shuffle size={16} /> Sortear times
      </button>
    </section>
  );
}
