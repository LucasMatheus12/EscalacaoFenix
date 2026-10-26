import { MessageCircle, RotateCcw, Settings2, Trash2, UserRoundCog } from "lucide-react";
import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import type { Player } from "../types/player";
import type { DrawResult } from "../types/team";
import type { PlayerSlot } from "../utils/drawUtils";
import { TeamCard } from "./TeamCard";
import { TeamShareCard } from "./TeamShareCard";

interface ResultViewProps {
  result: DrawResult;
  onRedraw: () => void;
  onSwapPlayers: (slotA: PlayerSlot, slotB: PlayerSlot) => void;
  onEditPlayers: () => void;
  onEditConfig: () => void;
  onClearAll: () => void;
}

const isSameSlot = (a: PlayerSlot, b: PlayerSlot) => {
  if (a.playerId !== b.playerId) {
    return false;
  }

  if (a.kind === "reserve" && b.kind === "reserve") {
    return true;
  }

  if (a.kind === "goalkeeper" && b.kind === "goalkeeper") {
    return true;
  }

  return a.kind === "team" && b.kind === "team" && a.teamId === b.teamId;
};

export function ResultView({
  result,
  onRedraw,
  onSwapPlayers,
  onEditPlayers,
  onEditConfig,
  onClearAll,
}: ResultViewProps) {
  const teamRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [sharingTeamId, setSharingTeamId] = useState<number | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PlayerSlot | null>(null);
  const { teams, reserves, goalkeepers = [], balanceSpread } = result;
  const averages = teams.map((team) => team.averageStars);
  const lowestAverage = Math.min(...averages);
  const highestAverage = Math.max(...averages);
  const isLevel = balanceSpread === 0;

  const isHighlight = (average: number) =>
    !isLevel && (average === lowestAverage || average === highestAverage);

  const handlePlayerClick = (slot: PlayerSlot) => {
    if (!selectedSlot) {
      setSelectedSlot(slot);
      return;
    }

    if (isSameSlot(selectedSlot, slot)) {
      setSelectedSlot(null);
      return;
    }

    onSwapPlayers(selectedSlot, slot);
    setSelectedSlot(null);
  };

  const handleShareWhatsapp = async (teamId: number, teamName: string) => {
    const targetNode = teamRefs.current[teamId];
    if (!targetNode || sharingTeamId !== null) {
      return;
    }

    setSharingTeamId(teamId);
    setShareMessage("");

    try {
      await document.fonts.ready;
      const blob = await toBlob(targetNode, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#1a0e12",
        width: 640,
        style: {
          opacity: "1",
          transform: "none",
          position: "static",
          left: "0",
          top: "0",
        },
      });

      if (!blob) {
        throw new Error("Nao foi possivel gerar imagem.");
      }

      const fileName = `escalacao-fenix-time-${teamId}-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      const shareText = `${teamName} gerado no Escalacao Fenix.`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Escalacao Fenix",
          text: shareText,
          files: [file],
        });
        setShareMessage(`${teamName} compartilhado.`);
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(objectUrl);

        const whatsappText = encodeURIComponent(
          `${shareText} A imagem foi baixada para voce anexar no WhatsApp.`,
        );
        window.open(`https://wa.me/?text=${whatsappText}`, "_blank", "noopener,noreferrer");
        setShareMessage(`Imagem do ${teamName} baixada. Agora so anexar no WhatsApp.`);
      }
    } catch {
      setShareMessage("Nao foi possivel compartilhar agora.");
    } finally {
      setSharingTeamId(null);
    }
  };

  return (
    <section className="result-view">
      <div className="result-header card">
        <p className="hero-kicker">Sorteio pronto</p>
        <h2>Times equilibrados</h2>
        <div className="stat-row">
          <div className={`stat-chip ${isLevel ? "success" : ""}`}>
            <strong>{balanceSpread.toFixed(2)}</strong>
            <span>diferença de média</span>
          </div>
          <div className="stat-chip">
            <strong>{teams.length}</strong>
            <span>times</span>
          </div>
          {reserves.length ? (
            <div className="stat-chip">
              <strong>{reserves.length}</strong>
              <span>reservas</span>
            </div>
          ) : null}
          {goalkeepers.length ? (
            <div className="stat-chip">
              <strong>{goalkeepers.length}</strong>
              <span>goleiro(s)</span>
            </div>
          ) : null}
        </div>
        <p className="muted average-line">
          Médias: {teams.map((team) => team.averageStars.toFixed(2)).join(" · ")}
        </p>
        <p className="muted swap-hint">
          Toque em dois jogadores para trocar entre times
          {reserves.length ? ", reservas" : ""}
          {goalkeepers.length ? " ou goleiros" : ""}.
        </p>
      </div>

      <div className="team-grid">
        {teams.map((team) => (
          <div key={team.id} className="team-share-item">
            <TeamCard
              team={team}
              highlight={isHighlight(team.averageStars)}
              selectedSlot={selectedSlot}
              onPlayerClick={handlePlayerClick}
            />
            <div
              ref={(element) => (teamRefs.current[team.id] = element)}
              className="share-capture"
              aria-hidden
            >
              <TeamShareCard team={team} />
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={() => handleShareWhatsapp(team.id, team.name)}
              disabled={sharingTeamId !== null}
            >
              <MessageCircle size={16} />{" "}
              {sharingTeamId === team.id ? "Gerando imagem..." : `Compartilhar ${team.name}`}
            </button>
          </div>
        ))}
      </div>

      {goalkeepers.length ? (
        <section className="card">
          <h3>Goleiros</h3>
          <p className="muted">Fora do sorteio. Toque para encaixar em um time se quiser.</p>
          <ul className="reserves-list">
            {goalkeepers.map((player: Player) => (
              <li key={player.id}>
                <button
                  type="button"
                  className={`player-swap-btn ${
                    selectedSlot?.kind === "goalkeeper" && selectedSlot.playerId === player.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handlePlayerClick({ kind: "goalkeeper", playerId: player.id })}
                >
                  <span>
                    {player.name}
                    {player.position ? <small className="player-position"> ({player.position})</small> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {reserves.length ? (
        <section className="card">
          <h3>Reservas</h3>
          <p className="muted">Quem veio na lista como reserva fica fora do sorteio.</p>
          <ul className="reserves-list">
            {reserves.map((player: Player) => (
              <li key={player.id}>
                <button
                  type="button"
                  className={`player-swap-btn ${
                    selectedSlot?.kind === "reserve" && selectedSlot.playerId === player.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handlePlayerClick({ kind: "reserve", playerId: player.id })}
                >
                  <span>
                    {player.name}
                    {player.position ? <small className="player-position"> ({player.position})</small> : null}
                  </span>
                </button>
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
          <Settings2 size={16} /> Alterar configurações
        </button>
        <button type="button" className="btn ghost danger-text" onClick={onClearAll}>
          <Trash2 size={16} /> Limpar tudo
        </button>
      </div>
      {shareMessage ? <p className="muted share-feedback">{shareMessage}</p> : null}
    </section>
  );
}
