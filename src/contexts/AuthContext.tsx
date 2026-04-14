import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { api, type UserProfile } from "@/lib/api";

interface RegisterInput {
  email: string;
  password: string;
  fullName?: string;
  role?: "CHIEF_ACCOUNTANT" | "STAFF_ACCOUNTANT";
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const syncCurrentProfile = async (currentSession: Session) => {
    try {
      const meta = currentSession.user.user_metadata ?? {};
      const providerApp = currentSession.user.app_metadata?.provider;
      const provider = providerApp === "google" ? "GOOGLE" : "EMAIL";

      const res = await api.auth.syncProfile(
        {
          fullName:
            (typeof meta.full_name === "string" ? meta.full_name : undefined) ??
            (typeof meta.name === "string" ? meta.name : undefined),
          avatarUrl:
            (typeof meta.avatar_url === "string"
              ? meta.avatar_url
              : undefined) ??
            (typeof meta.picture === "string" ? meta.picture : undefined),
          provider,
        },
        currentSession.access_token,
      );

      if (mountedRef.current) {
        setProfile(res.data.profile);
      }
    } catch {
      // Profile sync failure should not block auth
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (!mountedRef.current) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession) {
        await syncCurrentProfile(currentSession);
      } else {
        setProfile(null);
      }

      if (mountedRef.current) {
        setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mountedRef.current) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (
        currentSession &&
        (event === "SIGNED_IN" || event === "INITIAL_SESSION")
      ) {
        await syncCurrentProfile(currentSession);
      } else if (!currentSession) {
        setProfile(null);
      }

      if (mountedRef.current) {
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    // Store session in Supabase client — triggers onAuthStateChange (SIGNED_IN)
    await supabase.auth.setSession({
      access_token: res.data.session.access_token,
      refresh_token: res.data.session.refresh_token,
    });
  };

  // Uses Supabase redirect-based Google OAuth.
  // The user's existing Google browser session is reused — no sign-out occurs.
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${globalThis.location.origin}/auth/callback`,
        queryParams: {
          // Prevent Google from logging the user out before showing accounts
          prompt: "select_account",
        },
      },
    });
    // Page will redirect to Google; nothing runs after this line
  };

  const register = async (data: RegisterInput) => {
    await api.auth.register({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: data.role,
    });
    // After this, consumer must navigate to /auth/verify-otp
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const contextValue = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      loginWithEmail,
      loginWithGoogle,
      register,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, user, profile, loading],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

// Vite HMR: AuthContext uses createContext() whose identity must stay stable.
// Partial hot-reload would break context identity, so force a full page reload.
if (import.meta.hot) {
  import.meta.hot.decline();
}
