import type { DrawConfig as DrawConfigType } from "../types/team";

interface DrawConfigProps {
  config: DrawConfigType;
  totalPlayers: number;
  onChange: (config: DrawConfigType) => void;
  warningMessage: string | null;
}

export function DrawConfig({ config, totalPlayers, onChange, warningMessage }: DrawConfigProps) {
  const required = config.teamCount * config.playersPerTeam;
  const reserves = totalPlayers - required;

  return (
    <section className="card">
      <h2>Configuração do sorteio</h2>
      <div className="grid-2">
        <div>
          <label htmlFor="teamCount">Quantidade de times</label>
          <input
            id="teamCount"
            type="number"
            min={2}
            value={config.teamCount}
            onChange={(event) =>
              onChange({ ...config, teamCount: Number(event.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label htmlFor="playersPerTeam">Jogadores por time</label>
          <input
            id="playersPerTeam"
            type="number"
            min={1}
            value={config.playersPerTeam}
            onChange={(event) =>
              onChange({ ...config, playersPerTeam: Number(event.target.value) || 0 })
            }
          />
        </div>
      </div>
      <p className="muted">Total necessário para o sorteio: {required} jogador(es).</p>
      {reserves > 0 ? (
        <p className="success-text">
          {reserves} jogador(es) ficará(ão) como reserva nessa configuração.
        </p>
      ) : null}
      {warningMessage ? <p className="field-error">{warningMessage}</p> : null}
    </section>
  );
}
