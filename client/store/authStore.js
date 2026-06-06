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
  async candidateLogin(payload) {
    set({ loading: true });
    try {
      const data = await api("/candidate/auth/login", { method: "POST", body: JSON.stringify(payload) });
      setToken(data.token);
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async candidateSignup(payload) {
    set({ loading: true });
    try {
      const data = await api("/candidate/auth/signup", { method: "POST", body: JSON.stringify(payload) });
      setToken(data.token);
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async loadCandidateMe() {
    const data = await api("/candidate/auth/me");
    set({ user: data.user });
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
