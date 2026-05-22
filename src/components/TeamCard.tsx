import { ArrowLeftRight, Trophy } from "lucide-react";
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
        <h3>
          <Trophy size={16} /> {team.name}
        </h3>
        <span className="team-total">{team.totalStars} estrelas</span>
      </header>
      <ul>
        {team.players.map((player) => (
          <li key={player.id}>
            <button
              type="button"
              className={`player-swap-btn ${isSelected(player.id) ? "selected" : ""}`}
              onClick={() => onPlayerClick({ kind: "team", teamId: team.id, playerId: player.id })}
            >
              <span>
                {player.name}
                {player.position ? <small className="player-position"> ({player.position})</small> : null}
              </span>
              <ArrowLeftRight size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <footer>
        <span>Media: {team.averageStars.toFixed(2)}</span>
      </footer>
    </article>
  );
}
