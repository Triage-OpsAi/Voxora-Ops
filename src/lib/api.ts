import type { Agent, ApiResponse, AuthSession, Call, Dashboard, Lead, OutboundCallRequest, OutboundCallResponse, SigninRequest, SignupRequest, WorkspaceUpdateRequest } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured");
const BASE_URL = API_URL.replace(/\/$/, "");
const AUTH_STORAGE_KEY = "voxora.auth.v1";

function storedToken() {
  if (typeof window === "undefined") return undefined;
  try {
    const session = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null") as AuthSession | null;
    return session?.token;
  } catch {
    return undefined;
  }
}

function authHeaders(token = storedToken()) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function request<T>(path: string, token: string | null | undefined = storedToken()): Promise<T> {
  const resolvedToken = token === null ? undefined : token;
  const response = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    headers: authHeaders(resolvedToken),
  });
  if (!response.ok) throw new Error(`Backend request failed (${response.status})`);
  return (await response.json() as ApiResponse<T>).data;
}

async function postRaw<TResponse, TBody>(path: string, body: TBody, token?: string): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as TResponse;
}

async function patchRaw<TResponse, TBody>(path: string, body: TBody, token = storedToken()): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as TResponse;
}

async function getRaw<TResponse>(path: string, token?: string): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as TResponse;
}

async function errorMessage(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") return payload.detail;
  } catch {}
  return `Backend request failed (${response.status})`;
}

export const api = {
  signup: (payload: SignupRequest) => postRaw<AuthSession, SignupRequest>("/auth/signup", payload),
  signin: (payload: SigninRequest) => postRaw<AuthSession, SigninRequest>("/auth/signin", payload),
  me: (token: string) => getRaw<{ user: AuthSession["user"] }>("/auth/me", token),
  updateWorkspace: (payload: WorkspaceUpdateRequest) => patchRaw<{ user: AuthSession["user"] }, WorkspaceUpdateRequest>("/auth/workspace", payload),
  dashboard: () => request<Dashboard>("/api/dashboard"),
  calls: () => request<Call[]>("/api/calls"),
  call: (id: string) => request<Call>(`/api/calls/${id}`),
  conversations: () => request<Call[]>("/api/conversations"),
  conversation: (id: string) => request<Call>(`/api/conversations/${id}`),
  leads: () => request<Lead[]>("/api/leads"),
  lead: (id: string) => request<Lead>(`/api/leads/${id}`),
  agents: () => request<Agent[]>("/api/agents"),
  publicAgents: () => request<Agent[]>("/api/agents", null),
  agent: (id: string) => request<Agent>(`/api/agents/${id}`),
  startOutboundCall: (payload: OutboundCallRequest) => postRaw<OutboundCallResponse, OutboundCallRequest>("/calls/outbound", payload, storedToken()),
};
