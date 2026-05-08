import { RotateCcw, Settings2, Trash2, UserRoundCog } from "lucide-react";
import type { Player } from "../types/player";
import type { DrawResult } from "../types/team";
import { TeamCard } from "./TeamCard";
import { RatingStars } from "./RatingStars";

interface ResultViewProps {
  result: DrawResult;
  onRedraw: () => void;
  onEditPlayers: () => void;
  onEditConfig: () => void;
  onClearAll: () => void;
}

export function ResultView({
  result,
  onRedraw,
  onEditPlayers,
  onEditConfig,
  onClearAll,
}: ResultViewProps) {
  const { teams, reserves, balanceSpread } = result;
  const best = Math.min(...teams.map((team) => team.totalStars));
  const worst = Math.max(...teams.map((team) => team.totalStars));

  const isHighlight = (teamTotal: number) => teamTotal === best || teamTotal === worst;

  return (
    <section className="result-view">
      <div className="result-header card">
        <h2>Resultado da Escalacao</h2>
        <p>
          Diferenca de equilibrio: <strong>{balanceSpread} estrela(s)</strong>
        </p>
      </div>

      <div className="team-grid">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} highlight={isHighlight(team.totalStars)} />
        ))}
      </div>

      {reserves.length ? (
        <section className="card">
          <h3>Reservas</h3>
          <ul className="reserves-list">
            {reserves.map((player: Player) => (
              <li key={player.id}>
                <span>
                  {player.name}
                  {player.position ? <small className="player-position"> ({player.position})</small> : null}
                </span>
                <RatingStars value={player.rating} readonly size={14} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="actions-grid">
        <button type="button" className="btn primary" onClick={onRedraw}>
          <RotateCcw size={16} /> Sortear novamente
        </button>
        <button type="button" className="btn secondary" onClick={onEditPlayers}>
          <UserRoundCog size={16} /> Editar jogadores
        </button>
        <button type="button" className="btn secondary" onClick={onEditConfig}>
          <Settings2 size={16} /> Alterar configuracoes
        </button>
        <button type="button" className="btn ghost danger-text" onClick={onClearAll}>
          <Trash2 size={16} /> Limpar tudo
        </button>
      </div>
    </section>
  );
}
