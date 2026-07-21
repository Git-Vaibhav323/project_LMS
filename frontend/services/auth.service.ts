import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/services/api";
import { ApiSuccess, Faculty } from "@/lib/types";

export const authService = {
  /**
   * Register with Supabase Auth, then sync the Faculty row in our DB.
   */
  async register(input: { name: string; email: string; password: string }) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      // Persist the name in user metadata so the backend can materialize the
      // Faculty row itself — no blocking round-trip needed before navigation.
      options: { data: { name: input.name } },
    });

    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Check your email to confirm your account.");

    // Kick off the Faculty-row sync but don't block on it: the backend also
    // self-heals the row on /me and on content creation.
    void apiFetch<ApiSuccess<Faculty>>("/api/auth/sync", {
      method: "POST",
      body: { name: input.name },
      auth: false,
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    }).catch(() => {});

    return {
      faculty: {
        id: data.user?.id ?? "",
        name: input.name,
        email: data.user?.email ?? input.email,
        createdAt: data.user?.created_at ?? new Date().toISOString(),
      } as Faculty,
      token: data.session.access_token,
    };
  },

  /**
   * Sign in with Supabase Auth.
   */
  async login(input: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Login failed. Please try again.");

    // Ensure the Faculty row exists, but don't block sign-in on it: the backend
    // self-heals on /me and on content creation, so we fire-and-forget here.
    void apiFetch<ApiSuccess<Faculty>>("/api/auth/sync", {
      method: "POST",
      body: { name: data.user.user_metadata?.name ?? data.user.email ?? "Faculty" },
      auth: false,
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    }).catch(() => {}); // non-fatal if already exists

    return {
      faculty: {
        id: data.user.id,
        name: data.user.user_metadata?.name ?? "",
        email: data.user.email ?? "",
        createdAt: data.user.created_at,
      } as Faculty,
      token: data.session.access_token,
    };
  },

  /**
   * Sign out from Supabase Auth.
   */
  async logout() {
    await supabase.auth.signOut();
  },

  /**
   * Get the current faculty profile from our backend.
   */
  me() {
    return apiFetch<ApiSuccess<Faculty>>("/api/auth/me", { method: "GET" });
  },

  /**
   * Get the current Supabase session token (for re-attaching after page reload).
   */
  async getSessionToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
};

export default authService;
