"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";
import { ApiRequestError } from "@/services/api";
import { API_BASE_URL, AUTH_COOKIE_KEY } from "@/lib/constants";
import { deleteCookie, setCookie } from "@/lib/cookies";
import { Faculty } from "@/lib/types";

interface AuthContextValue {
  faculty: Faculty | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Wake the backend as early as possible. The free host spins down when
    // idle, so we kick off a lightweight /health request the moment the app
    // loads (e.g. while the user is still typing on the login screen). By the
    // time they reach the dashboard the instance is already warm, so the first
    // data fetch returns immediately instead of waiting on a cold start.
    fetch(`${API_BASE_URL}/health`, { cache: "no-store" }).catch(() => {});

    // On mount, restore session from Supabase (handles page reloads)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Store token in cookie so Next.js middleware can read it for route protection
        setCookie(AUTH_COOKIE_KEY, data.session.access_token);
        authService.me()
          .then((res) => setFaculty(res.data))
          .catch(() => {
            deleteCookie(AUTH_COOKIE_KEY);
          })
          .finally(() => setIsLoading(false));
      } else {
        deleteCookie(AUTH_COOKIE_KEY);
        setIsLoading(false);
      }
    });

    // Keep token cookie in sync when Supabase refreshes the session automatically
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCookie(AUTH_COOKIE_KEY, session.access_token);
      } else {
        deleteCookie(AUTH_COOKIE_KEY);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login({ email, password });
      setCookie(AUTH_COOKIE_KEY, res.token);
      setFaculty(res.faculty);
      toast.success("Welcome back", { description: `Signed in as ${res.faculty.email}` });
      router.push("/dashboard");
    },
    [router]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authService.register({ name, email, password });
      setCookie(AUTH_COOKIE_KEY, res.token);
      setFaculty(res.faculty);
      toast.success("Account created", { description: "Your faculty account is ready." });
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if Supabase call fails, clear local session
    } finally {
      deleteCookie(AUTH_COOKIE_KEY);
      setFaculty(null);
      toast.success("Logged out", { description: "Come back soon." });
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ faculty, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
