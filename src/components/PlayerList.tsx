import { Pencil, Trash2, Users } from "lucide-react";
import type { Player } from "../types/player";
import { RatingStars } from "./RatingStars";
import { EmptyState } from "./EmptyState";

interface PlayerListProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (playerId: string) => void;
}

export function PlayerList({ players, onEdit, onDelete }: PlayerListProps) {
  return (
    <section className="card">
      <div className="section-title">
        <h2>Jogadores</h2>
        <div className="badge">
          <Users size={16} />
          <span>{players.length}</span>
        </div>
      </div>

      {!players.length ? (
        <EmptyState
          title="Nenhum jogador cadastrado"
          description="Adicione jogadores para montar seus times equilibrados."
        />
      ) : (
        <ul className="player-list">
          {players.map((player) => (
            <li key={player.id} className="player-item">
              <div>
                <strong>{player.name}</strong>
                {player.position ? <small className="player-position">{player.position}</small> : null}
                <RatingStars value={player.rating} readonly size={16} />
              </div>
              <div className="icon-actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Editar ${player.name}`}
                  onClick={() => onEdit(player)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  aria-label={`Remover ${player.name}`}
                  onClick={() => onDelete(player.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
