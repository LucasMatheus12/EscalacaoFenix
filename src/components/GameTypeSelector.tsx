import { Cloud, CloudOff, Flag, LayoutGrid, LoaderCircle } from "lucide-react";
import type { GameType } from "../types/team";
import type { SyncStatus } from "../utils/storage";

interface GameTypeSelectorProps {
  value: GameType;
  onChange: (gameType: GameType) => void;
  syncStatus: SyncStatus;
}

const options: { value: GameType; label: string; hint: string; icon: typeof LayoutGrid }[] = [
  { value: "quadra", label: "Quadra", hint: "Society / futsal", icon: LayoutGrid },
  { value: "campo", label: "Campo", hint: "Campo de futebol", icon: Flag },
];

const syncCopy: Record<SyncStatus, { label: string; icon: typeof Cloud }> = {
  cloud: { label: "Sincronizado na nuvem", icon: Cloud },
  syncing: { label: "Sincronizando...", icon: LoaderCircle },
  error: { label: "Sem conexão com a nuvem", icon: CloudOff },
  offline: { label: "Somente neste aparelho", icon: CloudOff },
};

export function GameTypeSelector({ value, onChange, syncStatus }: GameTypeSelectorProps) {
  const sync = syncCopy[syncStatus];
  const SyncIcon = sync.icon;

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>Tipo de jogo</h2>
          <p className="muted">Cada modo guarda a própria lista.</p>
        </div>
        <p className={`sync-pill ${syncStatus}`}>
          <SyncIcon size={14} className={syncStatus === "syncing" ? "spin" : undefined} />
          {sync.label}
        </p>
      </div>
      <div className="game-type-grid" role="radiogroup" aria-label="Tipo de jogo">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`game-type-card ${isActive ? "active" : ""}`}
              onClick={() => onChange(option.value)}
              role="radio"
              aria-checked={isActive}
            >
              <Icon size={22} />
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
