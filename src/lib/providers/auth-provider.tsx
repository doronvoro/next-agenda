"use client";

import * as React from "react";

import { User as AuthUser } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

import { Database } from "@/types/supabase";

export const AuthContext = React.createContext<
  | {
      authUser: AuthUser | undefined;
      isAuthenticated: boolean;
      loading: boolean;
      error: string | null;
      logIn: (email: string, password: string) => any;
      logOut: () => any;
    }
  | undefined
>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = React.useState<AuthUser | undefined>(
    undefined
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const initAuthUser = async () => {
    try {
      setError(null);
      const supabase = createClient();
      const {
        data: { session },
        error: initError,
      } = await supabase.auth.getSession();

      if (initError) {
        console.error("Failed to initialize auth:", initError);
        setAuthUser(undefined);
        return;
      }

      setAuthUser(session?.user || undefined);
    } catch (error) {
      console.error("Error during auth initialization:", error);
      setAuthUser(undefined);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    initAuthUser();
  }, []);

  React.useEffect(() => {
    const supabase = createClient();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthUser(session?.user || undefined);
      }
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const logIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return { error: loginError.message };
    }

    setAuthUser(data.user);
    setLoading(false);
  };

  const logOut = async () => {
    setError(null);
    setLoading(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    setAuthUser(undefined);
    setLoading(false);
  };

  const isAuthenticated = !!authUser;

  const value = React.useMemo(
    () => ({
      authUser,
      isAuthenticated,
      loading,
      error,
      logIn,
      logOut,
    }),
    [authUser, loading, error, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
