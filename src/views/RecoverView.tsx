import { useState, type FormEvent } from "react";
import { Flame, KeyRound } from "lucide-react";

interface RecoverViewProps {
  onSubmit: (password: string) => Promise<string | null>;
}

export function RecoverView({ onSubmit }: RecoverViewProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) {
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não são iguais.");
      return;
    }

    setBusy(true);
    setError("");
    const message = await onSubmit(password);
    if (message) {
      setError(message);
    }
    setBusy(false);
  };

  return (
    <section className="login-view card">
      <div className="logo-chip">
        <Flame size={18} />
        <span>Escalação Fenix</span>
      </div>
      <h1>Nova senha</h1>
      <p className="muted">Defina uma senha nova para entrar com seu usuário.</p>

      <form className="form-card" onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="newPassword">Nova senha</label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
        />

        <label htmlFor="confirmPassword">Confirmar senha</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />

        {error ? <p className="field-error">{error}</p> : null}

        <button type="submit" className="btn primary big-action" disabled={busy}>
          <KeyRound size={16} /> {busy ? "Salvando..." : "Salvar senha"}
        </button>
      </form>
    </section>
  );
}
