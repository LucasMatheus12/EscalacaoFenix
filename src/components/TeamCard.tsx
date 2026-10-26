import { ArrowLeftRight } from "lucide-react";
import type { Team } from "../types/team";
import type { PlayerSlot } from "../utils/drawUtils";

interface TeamCardProps {
  team: Team;
  highlight: boolean;
  selectedSlot: PlayerSlot | null;
  onPlayerClick: (slot: PlayerSlot) => void;
}

export function TeamCard({ team, highlight, selectedSlot, onPlayerClick }: TeamCardProps) {
  const isSelected = (playerId: string) =>
    selectedSlot?.kind === "team" &&
    selectedSlot.teamId === team.id &&
    selectedSlot.playerId === playerId;

  return (
    <article className={`team-card ${highlight ? "highlight" : ""}`}>
      <header>
        <div className="team-heading">
          <span className="team-index">{team.id}</span>
          <h3>{team.name}</h3>
        </div>
        <span className="team-total">{team.totalStars.toFixed(1)} ★</span>
      </header>
      <ul>
        {team.players.map((player) => (
          <li key={player.id}>
            <button
              type="button"
              className={`player-swap-btn ${isSelected(player.id) ? "selected" : ""}`}
              onClick={() => onPlayerClick({ kind: "team", teamId: team.id, playerId: player.id })}
            >
              <span className="player-swap-name">
                {player.name}
                {player.position ? <small className="player-position"> {player.position}</small> : null}
              </span>
              <span className="swap-meta">
                <em>{player.rating}</em>
                <ArrowLeftRight size={14} aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <footer>
        <span>Média {team.averageStars.toFixed(2)}</span>
        <span>{team.players.length} jogador(es)</span>
      </footer>
    </article>
  );
}
