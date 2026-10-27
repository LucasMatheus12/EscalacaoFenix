import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

const LEGACY_USERNAME_DOMAIN = "fenix.local";

export const normalizeUsername = (value: string): string => value.trim().toLowerCase();

export const validateUsername = (username: string): string | null => {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return "Informe o usuário.";
  }
  if (normalized.includes("@")) {
    return "Use só o usuário, sem e-mail.";
  }
  if (!/^[a-z0-9._-]{3,24}$/.test(normalized)) {
    return "O usuário deve ter 3 a 24 letras ou números.";
  }
  return null;
};

export const validateRecoveryEmail = (email: string): string | null => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return "Informe um e-mail para recuperar a senha.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.endsWith(".local")) {
    return "Informe um e-mail válido.";
  }
  return null;
};

const authErrorMessage = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) {
    return "Usuário ou senha incorretos.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Esse e-mail já está em uso. Entre ou recupere a senha.";
  }
  if (lower.includes("password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Muitas tentativas. Espere um pouco e tente de novo.";
  }
  return "Não foi possível entrar agora. Tente de novo.";
};

const emailForUsername = async (username: string): Promise<string | null> => {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.rpc("login_email_for_username", {
    p_username: normalizeUsername(username),
  });

  if (typeof data === "string" && data.trim()) {
    return data.trim().toLowerCase();
  }

  return `${normalizeUsername(username)}@${LEGACY_USERNAME_DOMAIN}`;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    if (hashParams.get("type") === "recovery" || queryParams.get("type") === "recovery") {
      setRecovering(true);
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") {
        setRecovering(true);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) {
      return "Configure o login na nuvem para continuar.";
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return usernameError;
    }

    const email = await emailForUsername(username);
    if (!email) {
      return "Usuário ou senha incorretos.";
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? authErrorMessage(error.message) : null;
  };

  const signUp = async (
    username: string,
    password: string,
    recoveryEmail: string,
  ): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) {
      return "Configure o login na nuvem para continuar.";
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return usernameError;
    }
    const emailError = validateRecoveryEmail(recoveryEmail);
    if (emailError) {
      return emailError;
    }

    const { data: taken } = await supabase.rpc("username_taken", {
      p_username: normalizeUsername(username),
    });
    if (taken) {
      return "Esse usuário já existe. Entre com a senha.";
    }

    const email = recoveryEmail.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: normalizeUsername(username) },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      return authErrorMessage(error.message);
    }
    if (data.session) {
      return null;
    }

    const login = await supabase.auth.signInWithPassword({ email, password });
    if (login.error) {
      return authErrorMessage(login.error.message);
    }
    return null;
  };

  const requestPasswordReset = async (username: string): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) {
      return "Configure o login na nuvem para continuar.";
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return usernameError;
    }

    const email = await emailForUsername(username);
    if (email && !email.endsWith(`@${LEGACY_USERNAME_DOMAIN}`)) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
    }

    return null;
  };

  const updatePassword = async (password: string): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) {
      return "Configure o login na nuvem para continuar.";
    }
    if (!password || password.length < 6) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return authErrorMessage(error.message);
    }

    window.history.replaceState({}, "", window.location.pathname || "/");
    setRecovering(false);
    return null;
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      return;
    }
    setRecovering(false);
    await supabase.auth.signOut();
  };

  return {
    user,
    loading,
    recovering,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
  };
}
