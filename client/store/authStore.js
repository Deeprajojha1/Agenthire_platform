import { create } from "zustand";
import { api, clearToken, setToken } from "../lib/api.js";

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  async login(payload) {
    set({ loading: true });
    const data = await api("/auth/login", { method: "POST", body: JSON.stringify(payload) });
    setToken(data.token);
    set({ user: data.user, loading: false });
  },
  async signup(payload) {
    set({ loading: true });
    const data = await api("/auth/signup", { method: "POST", body: JSON.stringify(payload) });
    setToken(data.token);
    set({ user: data.user, loading: false });
  },
  async loadMe() {
    const data = await api("/auth/me");
    set({ user: data.user });
  },
  logout() {
    clearToken();
    set({ user: null });
  }
}));
