import { useEffect, useState, type FormEvent } from "react";
import type { Player } from "../types/player";
import { validatePlayerName, validatePlayerRating } from "../utils/validations";
import { RatingStars } from "./RatingStars";

interface PlayerFormProps {
  onSubmit: (payload: { name: string; position: string; rating: number; id?: string }) => void;
  editingPlayer: Player | null;
  onCancelEdit: () => void;
  addLocked: boolean;
  addLockMessage: string;
}

export function PlayerForm({
  onSubmit,
  editingPlayer,
  onCancelEdit,
  addLocked,
  addLockMessage,
}: PlayerFormProps) {
  const positionOptions = [
    "Nao informar",
    "Goleiro",
    "Zagueiro",
    "Lateral",
    "Volante",
    "Meia",
    "Atacante",
  ];

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");

  const isEditing = Boolean(editingPlayer);

  useEffect(() => {
    if (!editingPlayer) {
      return;
    }
    setName(editingPlayer.name);
    setPosition(editingPlayer.position);
    setRating(editingPlayer.rating);
    setError("");
  }, [editingPlayer]);

  const reset = () => {
    setName("");
    setPosition("");
    setRating(0);
    setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nameError = validatePlayerName(name);
    const ratingError = validatePlayerRating(rating);

    if (nameError || ratingError) {
      setError(nameError ?? ratingError ?? "");
      return;
    }

    if (!editingPlayer && addLocked) {
      setError(addLockMessage);
      return;
    }

    onSubmit({
      id: editingPlayer?.id,
      name: name.trim(),
      position: position === "Nao informar" ? "" : position.trim(),
      rating,
    });
    reset();
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>{isEditing ? "Editar jogador" : "Cadastrar jogador"}</h2>
      <label htmlFor="playerName">Nome do jogador</label>
      <input
        id="playerName"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ex: Lucas"
      />

      <label>Posicao em campo (opcional)</label>
      <div className="position-options" role="radiogroup" aria-label="Posicao em campo">
        {positionOptions.map((option) => {
          const isActive = (position || "Nao informar") === option;
          return (
            <button
              key={option}
              type="button"
              className={`position-chip ${isActive ? "active" : ""}`}
              onClick={() => setPosition(option)}
              role="radio"
              aria-checked={isActive}
            >
              {option}
            </button>
          );
        })}
      </div>

      <label>Nota em estrelas</label>
      <RatingStars value={rating} onChange={setRating} />

      {error ? <p className="field-error">{error}</p> : null}
      {addLocked && !isEditing ? <p className="muted">{addLockMessage}</p> : null}

      <div className="btn-row">
        <button type="submit" className="btn primary" disabled={addLocked && !isEditing}>
          {isEditing ? "Salvar alterações" : "Adicionar jogador"}
        </button>
        {isEditing ? (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              onCancelEdit();
              reset();
            }}
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
