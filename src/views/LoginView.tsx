import { useState, type FormEvent } from "react";
import { Flame, LogIn, UserPlus } from "lucide-react";
import { validateUsername } from "../hooks/useAuth";

interface LoginViewProps {
  onSignIn: (username: string, password: string) => Promise<string | null>;
  onSignUp: (username: string, password: string) => Promise<string | null>;
}

export function LoginView({ onSignIn, onSignUp }: LoginViewProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) {
      return;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (!password) {
      setError("Informe a senha.");
      return;
    }

    setBusy(true);
    setError("");
    const message = mode === "signin" ? await onSignIn(username, password) : await onSignUp(username, password);
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
      <h1>Entre para ver a escalação</h1>
      <p className="muted">Use usuário e senha. Só quem tem conta vê a lista.</p>

      <div className="add-mode-tabs" role="tablist" aria-label="Tipo de acesso">
        <button
          type="button"
          className={`add-mode-tab ${mode === "signin" ? "active" : ""}`}
          onClick={() => {
            setMode("signin");
            setError("");
          }}
        >
          <LogIn size={16} /> Entrar
        </button>
        <button
          type="button"
          className={`add-mode-tab ${mode === "signup" ? "active" : ""}`}
          onClick={() => {
            setMode("signup");
            setError("");
          }}
        >
          <UserPlus size={16} /> Criar conta
        </button>
      </div>

      <form className="form-card" onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="loginUsername">Usuário</label>
        <input
          id="loginUsername"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Ex: lucas"
        />

        <label htmlFor="loginPassword">Senha</label>
        <input
          id="loginPassword"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
        />

        {error ? <p className="field-error">{error}</p> : null}

        <button type="submit" className="btn primary big-action" disabled={busy}>
          {busy ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>
      </form>
    </section>
  );
}
