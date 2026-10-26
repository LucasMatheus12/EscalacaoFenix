import type { DrawConfig as DrawConfigType } from "../types/team";

interface DrawConfigProps {
  config: DrawConfigType;
  fieldCount: number;
  goalkeeperCount: number;
  listedReserveCount: number;
  onChange: (config: DrawConfigType) => void;
  warningMessage: string | null;
}

export function DrawConfig({
  config,
  fieldCount,
  goalkeeperCount,
  listedReserveCount,
  onChange,
  warningMessage,
}: DrawConfigProps) {
  const required = config.teamCount * config.playersPerTeam;
  const overflow = fieldCount - required;

  return (
    <section className="card">
      <h2>Configuração do sorteio</h2>
      <p className="muted">Goleiros e reservas da lista não entram no sorteio.</p>
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
      <div className="stat-row">
        <div className="stat-chip">
          <strong>{required}</strong>
          <span>de linha no sorteio</span>
        </div>
        {overflow > 0 ? (
          <div className="stat-chip success">
            <strong>{overflow}</strong>
            <span>sobra de linha</span>
          </div>
        ) : null}
        {listedReserveCount ? (
          <div className="stat-chip">
            <strong>{listedReserveCount}</strong>
            <span>reserva(s) fora</span>
          </div>
        ) : null}
        {goalkeeperCount ? (
          <div className="stat-chip">
            <strong>{goalkeeperCount}</strong>
            <span>goleiro(s) fora</span>
          </div>
        ) : null}
      </div>
      {warningMessage ? <p className="field-error">{warningMessage}</p> : null}
    </section>
  );
}
