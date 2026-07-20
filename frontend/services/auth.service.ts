import { apiFetch } from "@/services/api";
import { ApiSuccess, AuthResponse, Faculty } from "@/lib/types";

export const authService = {
  register(input: { name: string; email: string; password: string }) {
    return apiFetch<ApiSuccess<AuthResponse>>("/api/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
  },

  login(input: { email: string; password: string }) {
    return apiFetch<ApiSuccess<AuthResponse>>("/api/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    });
  },

  logout() {
    return apiFetch<ApiSuccess<null>>("/api/auth/logout", { method: "POST" });
  },

  me() {
    return apiFetch<ApiSuccess<Faculty>>("/api/auth/me", { method: "GET" });
  },
};

export default authService;
