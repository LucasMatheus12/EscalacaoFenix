import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ClipboardPaste, UserPlus } from "lucide-react";
import type { Player } from "../types/player";
import { parsePlayerList } from "../utils/parsePlayerList";
import { validatePlayerName, validatePlayerRating } from "../utils/validations";
import { RatingStars } from "./RatingStars";

interface PlayerFormProps {
  onSubmit: (payload: { name: string; position: string; rating: number; id?: string }) => void;
  onBulkAdd: (entries: { name: string; position: string }[]) => {
    added: number;
    skipped: number;
    updated: number;
  };
  editingPlayer: Player | null;
  onCancelEdit: () => void;
}

const positionOptions = [
  "Não informar",
  "Goleiro",
  "Reserva",
  "Zagueiro",
  "Lateral",
  "Volante",
  "Meia",
  "Ponta",
  "Atacante",
];

export function PlayerForm({ onSubmit, onBulkAdd, editingPlayer, onCancelEdit }: PlayerFormProps) {
  const [mode, setMode] = useState<"paste" | "single">("paste");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [rating, setRating] = useState(0);
  const [listText, setListText] = useState("");
  const [error, setError] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");

  const isEditing = Boolean(editingPlayer);
  const parsedList = useMemo(() => parsePlayerList(listText), [listText]);
  const goalkeeperCount = parsedList.filter((player) => player.position === "Goleiro").length;
  const reserveCount = parsedList.filter((player) => player.position === "Reserva").length;

  useEffect(() => {
    if (!editingPlayer) {
      return;
    }
    setMode("single");
    setName(editingPlayer.name);
    setPosition(editingPlayer.position);
    setRating(editingPlayer.rating);
    setError("");
    setBulkMessage("");
  }, [editingPlayer]);

  const resetSingle = () => {
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

    onSubmit({
      id: editingPlayer?.id,
      name: name.trim(),
      position: position === "Não informar" ? "" : position.trim(),
      rating,
    });
    resetSingle();
  };

  const handleBulkAdd = () => {
    if (!parsedList.length) {
      setError("Não encontrei nomes na lista. Cole no formato 1- Nome.");
      setBulkMessage("");
      return;
    }

    const result = onBulkAdd(parsedList);
    setError("");
    if (!result.added && !result.updated) {
      setBulkMessage("Esses nomes já estão na lista.");
      return;
    }

    setListText("");
    const parts: string[] = [];
    if (result.added) {
      parts.push(`${result.added} adicionado(s)`);
    }
    if (result.updated) {
      parts.push(`${result.updated} marcado(s) pela lista`);
    }
    if (result.skipped) {
      parts.push(`${result.skipped} repetido(s) ignorado(s)`);
    }
    setBulkMessage(
      `${parts.join(" · ")}. Goleiros e reservas da lista ficam fora do sorteio. Defina as estrelas dos jogadores de linha.`,
    );
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>{isEditing ? "Editar jogador" : "Cadastrar jogador"}</h2>
      {!isEditing ? (
        <div className="add-mode-tabs" role="tablist" aria-label="Modo de cadastro">
          <button
            type="button"
            className={`add-mode-tab ${mode === "paste" ? "active" : ""}`}
            onClick={() => setMode("paste")}
          >
            <ClipboardPaste size={16} /> Colar lista
          </button>
          <button
            type="button"
            className={`add-mode-tab ${mode === "single" ? "active" : ""}`}
            onClick={() => setMode("single")}
          >
            <UserPlus size={16} /> Um a um
          </button>
        </div>
      ) : null}

      {mode === "paste" && !isEditing ? (
        <>
          <label htmlFor="playerList">Cole a lista do grupo</label>
          <textarea
            id="playerList"
            className="list-input"
            rows={8}
            value={listText}
            onChange={(event) => {
              setListText(event.target.value);
              setError("");
              setBulkMessage("");
            }}
            placeholder="1- Angelo&#10;2- Lucas Mascena&#10;3- Paulo"
          />
          <p className="muted">
            O app separa os nomes sozinho. GOLEIROS e RESERVAS da lista já saem com a posição
            e ficam fora do sorteio. Depois é só definir estrela nos jogadores de linha.
          </p>
          {parsedList.length ? (
            <p className="success-text">
              {parsedList.length} nome(s) encontrado(s)
              {goalkeeperCount ? ` · ${goalkeeperCount} goleiro(s)` : ""}
              {reserveCount ? ` · ${reserveCount} reserva(s)` : ""}.
            </p>
          ) : null}
          <button type="button" className="btn primary" onClick={handleBulkAdd}>
            Adicionar nomes
          </button>
        </>
      ) : (
        <>
          <label htmlFor="playerName">Nome</label>
          <input
            id="playerName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Lucas"
          />

          <label>Posição (opcional)</label>
          <div className="position-options" role="radiogroup" aria-label="Posicao em campo">
            {positionOptions.map((option) => {
              const isActive = (position || "Não informar") === option;
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

          <div className="btn-row">
            <button type="submit" className="btn primary">
              {isEditing ? "Salvar alterações" : "Adicionar jogador"}
            </button>
            {isEditing ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  onCancelEdit();
                  resetSingle();
                  setMode("paste");
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </>
      )}

      {error ? <p className="field-error">{error}</p> : null}
      {bulkMessage ? <p className="success-text">{bulkMessage}</p> : null}
    </form>
  );
}
