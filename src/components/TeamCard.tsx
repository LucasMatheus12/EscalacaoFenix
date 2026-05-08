import { Trophy } from "lucide-react";
import type { Team } from "../types/team";
import { RatingStars } from "./RatingStars";

interface TeamCardProps {
  team: Team;
  highlight: boolean;
}

export function TeamCard({ team, highlight }: TeamCardProps) {
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
            <span>
              {player.name}
              {player.position ? <small className="player-position"> ({player.position})</small> : null}
            </span>
            <RatingStars value={player.rating} readonly size={14} />
          </li>
        ))}
      </ul>
      <footer>
        <span>Media: {team.averageStars.toFixed(2)}</span>
      </footer>
    </article>
  );
}
