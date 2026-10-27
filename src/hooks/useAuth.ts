import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

const USERNAME_DOMAIN = "fenix.local";

export const normalizeUsername = (value: string): string => value.trim().toLowerCase();

export const usernameToEmail = (username: string): string => {
  const normalized = normalizeUsername(username);
  return normalized.includes("@") ? normalized : `${normalized}@${USERNAME_DOMAIN}`;
};

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

const authErrorMessage = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) {
    return "Usuário ou senha incorretos.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Esse usuário já existe. Entre com a senha.";
  }
  if (lower.includes("password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Não foi possível confirmar o usuário. Tente entrar de novo.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Muitas tentativas. Espere um pouco e tente de novo.";
  }
  return "Não foi possível entrar agora. Tente de novo.";
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
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

    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    return error ? authErrorMessage(error.message) : null;
  };

  const signUp = async (username: string, password: string): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) {
      return "Configure o login na nuvem para continuar.";
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return usernameError;
    }

    const email = usernameToEmail(username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: normalizeUsername(username) },
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

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
  };

  return { user, loading, signIn, signUp, signOut };
}
