import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

const authErrorMessage = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) {
    return "E-mail ou senha incorretos.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Este e-mail já tem conta. Entre com a senha.";
  }
  if (lower.includes("password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Confirme o e-mail antes de entrar.";
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

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) {
      return "Configure o login na nuvem para continuar.";
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? authErrorMessage(error.message) : null;
  };

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const supabase = getSupabase();
    if (!supabase) {
      return "Configure o login na nuvem para continuar.";
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
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
