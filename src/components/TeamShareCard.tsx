import type { Team } from "../types/team";

interface TeamShareCardProps {
  team: Team;
}

export function TeamShareCard({ team }: TeamShareCardProps) {
  return (
    <article className="share-card">
      <p className="share-card-kicker">Escalação Fenix</p>
      <div className="share-card-header">
        <span className="share-card-badge-cell">
          <span className="share-card-badge">{team.id}</span>
        </span>
        <strong className="share-card-title">{team.name}</strong>
        <span className="share-card-total">Média {team.averageStars.toFixed(2)}</span>
      </div>
      <div className="share-card-list">
        {team.players.map((player) => (
          <div key={player.id} className="share-card-row">
            <span className="share-card-name">
              {player.name}
              {player.position ? ` · ${player.position}` : ""}
            </span>
          </div>
        ))}
      </div>
      <div className="share-card-footer">
        <span>{team.players.length} jogadores</span>
      </div>
    </article>
  );
}
