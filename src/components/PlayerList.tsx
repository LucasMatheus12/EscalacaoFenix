import { Pencil, Trash2, Users } from "lucide-react";
import type { Player } from "../types/player";
import { fieldPlayersOf, isGoalkeeper, isReserve, sitsOutOfDraw } from "../utils/drawUtils";
import { RatingStars } from "./RatingStars";
import { EmptyState } from "./EmptyState";

interface PlayerListProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onRate: (playerId: string, rating: number) => void;
  onDelete: (playerId: string) => void;
}

const initialsFor = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

export function PlayerList({ players, onEdit, onRate, onDelete }: PlayerListProps) {
  const missingRatings = fieldPlayersOf(players).filter((player) => !player.rating).length;

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <h2>Jogadores</h2>
          {missingRatings ? (
            <p className="muted">Toque nas estrelas para avaliar {missingRatings} jogador(es).</p>
          ) : null}
        </div>
        <div className="badge">
          <Users size={15} />
          <span>{players.length}</span>
        </div>
      </div>

      {!players.length ? (
        <EmptyState
          title="Nenhum jogador ainda"
          description="Cole a lista do grupo ou cadastre um a um."
        />
      ) : (
        <ul className="player-list">
          {players.map((player) => (
            <li
              key={player.id}
              className={`player-item ${
                player.rating || sitsOutOfDraw(player) ? "" : "needs-rating"
              }`}
            >
              <span className="player-avatar" aria-hidden>
                {initialsFor(player.name)}
              </span>
              <div className="player-meta">
                <strong>{player.name}</strong>
                <small className="player-position">
                  {isGoalkeeper(player)
                    ? "Goleiro · fora do sorteio"
                    : isReserve(player)
                      ? "Reserva · fora do sorteio"
                      : player.position || "Posição livre"}
                </small>
                <RatingStars
                  value={player.rating}
                  onChange={(rating) => onRate(player.id, rating)}
                  size={18}
                  showTip={false}
                />
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
