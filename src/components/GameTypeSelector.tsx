import type { GameType } from "../types/team";

interface GameTypeSelectorProps {
  value: GameType;
  onChange: (gameType: GameType) => void;
}

const options: { value: GameType; label: string; hint: string }[] = [
  { value: "quadra", label: "Quadra", hint: "Society / futsal" },
  { value: "campo", label: "Campo", hint: "Campo de futebol" },
];

export function GameTypeSelector({ value, onChange }: GameTypeSelectorProps) {
  return (
    <section className="card">
      <h2>Tipo de jogo</h2>
      <p className="muted">Cada tipo mantém sua própria lista de jogadores e configuração.</p>
      <div className="position-options" role="radiogroup" aria-label="Tipo de jogo">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`position-chip game-type-chip ${isActive ? "active" : ""}`}
              onClick={() => onChange(option.value)}
              role="radio"
              aria-checked={isActive}
            >
              <span>{option.label}</span>
              <span className="game-type-hint">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
