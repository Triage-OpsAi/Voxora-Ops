"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type { AuthSession, AuthUser, SigninRequest, SignupRequest, WorkspaceUpdateRequest } from "@/types";

const STORAGE_KEY = "voxora.auth.v1";

type AuthState = {
  hydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  hydrate: () => void;
  signup: (payload: SignupRequest) => Promise<void>;
  signin: (payload: SigninRequest) => Promise<void>;
  updateWorkspace: (payload: WorkspaceUpdateRequest) => Promise<void>;
  signout: () => void;
  setSession: (session: AuthSession) => void;
};

function persistSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  token: null,
  user: null,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      set({ hydrated: true, token: null, user: null });
      return;
    }
    try {
      const session = JSON.parse(raw) as AuthSession;
      set({ hydrated: true, token: session.token, user: session.user });
    } catch {
      persistSession(null);
      set({ hydrated: true, token: null, user: null });
    }
  },
  signup: async (payload) => {
    const session = await api.signup(payload);
    persistSession(session);
    set({ token: session.token, user: session.user });
  },
  signin: async (payload) => {
    const session = await api.signin(payload);
    persistSession(session);
    set({ token: session.token, user: session.user });
  },
  updateWorkspace: async (payload) => {
    const response = await api.updateWorkspace(payload);
    set((state) => {
      if (!state.token) return { user: response.user };
      persistSession({ token: state.token, user: response.user });
      return { user: response.user };
    });
  },
  signout: () => {
    persistSession(null);
    set({ token: null, user: null });
  },
  setSession: (session) => {
    persistSession(session);
    set({ token: session.token, user: session.user });
  },
}));
