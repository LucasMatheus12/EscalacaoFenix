import { useState, type FormEvent } from "react";
import { Flame, KeyRound, LogIn, UserPlus } from "lucide-react";
import { validateRecoveryEmail, validateUsername } from "../hooks/useAuth";

interface LoginViewProps {
  onSignIn: (username: string, password: string) => Promise<string | null>;
  onSignUp: (username: string, password: string, recoveryEmail: string) => Promise<string | null>;
  onRequestReset: (username: string) => Promise<string | null>;
}

export function LoginView({ onSignIn, onSignUp, onRequestReset }: LoginViewProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (next: "signin" | "signup" | "forgot") => {
    setMode(next);
    setError("");
    setInfo("");
  };

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

    setBusy(true);
    setError("");
    setInfo("");

    if (mode === "forgot") {
      const message = await onRequestReset(username);
      setBusy(false);
      if (message) {
        setError(message);
        return;
      }
      setInfo("Se esse usuário existir, enviamos o link de nova senha para o e-mail cadastrado.");
      return;
    }

    if (mode === "signup") {
      const emailError = validateRecoveryEmail(recoveryEmail);
      if (emailError) {
        setBusy(false);
        setError(emailError);
        return;
      }
    }

    if (!password) {
      setBusy(false);
      setError("Informe a senha.");
      return;
    }

    const message =
      mode === "signin"
        ? await onSignIn(username, password)
        : await onSignUp(username, password, recoveryEmail);

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
      <p className="muted">
        {mode === "forgot"
          ? "Informe o usuário. O link vai para o e-mail cadastrado na conta."
          : "Login com usuário e senha. O e-mail serve só para recuperar a senha."}
      </p>

      {mode !== "forgot" ? (
        <div className="add-mode-tabs" role="tablist" aria-label="Tipo de acesso">
          <button
            type="button"
            className={`add-mode-tab ${mode === "signin" ? "active" : ""}`}
            onClick={() => switchMode("signin")}
          >
            <LogIn size={16} /> Entrar
          </button>
          <button
            type="button"
            className={`add-mode-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            <UserPlus size={16} /> Criar conta
          </button>
        </div>
      ) : null}

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

        {mode === "signup" ? (
          <>
            <label htmlFor="loginEmail">E-mail para recuperar senha</label>
            <input
              id="loginEmail"
              type="email"
              autoComplete="email"
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
              placeholder="seu@email.com"
            />
          </>
        ) : null}

        {mode !== "forgot" ? (
          <>
            <label htmlFor="loginPassword">Senha</label>
            <input
              id="loginPassword"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </>
        ) : null}

        {error ? <p className="field-error">{error}</p> : null}
        {info ? <p className="success-text">{info}</p> : null}

        <button type="submit" className="btn primary big-action" disabled={busy}>
          {busy
            ? "Aguarde..."
            : mode === "signin"
              ? "Entrar"
              : mode === "signup"
                ? "Criar conta"
                : "Enviar link"}
        </button>
      </form>

      {mode === "signin" ? (
        <button type="button" className="btn ghost" onClick={() => switchMode("forgot")}>
          <KeyRound size={16} /> Esqueci a senha
        </button>
      ) : (
        <button type="button" className="btn ghost" onClick={() => switchMode("signin")}>
          Voltar para entrar
        </button>
      )}
    </section>
  );
}
