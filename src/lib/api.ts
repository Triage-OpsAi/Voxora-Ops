import type { Agent, ApiResponse, AuthSession, Call, Dashboard, Lead, MarketingAgentState, MarketingAgentUpdate, MarketingCredentialInput, MarketingPlatform, OutboundCallRequest, OutboundCallResponse, SigninRequest, SignupRequest, WorkflowDraft, WorkflowRun, WorkspaceUpdateRequest } from "@/types";

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

async function putRaw<TResponse, TBody>(path: string, body: TBody, token = storedToken()): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
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

async function postForm<TResponse>(path: string, body: FormData): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return await response.json() as TResponse;
}

async function deleteRaw<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
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
  workflows: () => request<WorkflowDraft[]>("/api/workflows"),
  workflow: (id: string) => request<WorkflowDraft>(`/api/workflows/${id}`),
  createWorkflow: (payload: WorkflowDraft) => postRaw<ApiResponse<WorkflowDraft>, WorkflowDraft>("/api/workflows", payload).then((response) => response.data),
  saveWorkflow: (payload: WorkflowDraft) => putRaw<ApiResponse<WorkflowDraft>, WorkflowDraft>(`/api/workflows/${payload.id}`, payload).then((response) => response.data),
  duplicateWorkflow: (id: string) => postRaw<ApiResponse<WorkflowDraft>, Record<string, never>>(`/api/workflows/${id}/duplicate`, {}).then((response) => response.data),
  activateWorkflow: (id: string) => postRaw<ApiResponse<WorkflowDraft>, Record<string, never>>(`/api/workflows/${id}/activate`, {}).then((response) => response.data),
  runWorkflow: (id: string) => postRaw<ApiResponse<WorkflowRun>, Record<string, never>>(`/api/workflows/${id}/run`, {}).then((response) => response.data),
  workflowRuns: (id: string) => request<WorkflowRun[]>(`/api/workflows/${id}/runs`),
  marketingAgent: () => request<MarketingAgentState>("/api/marketing/agent"),
  saveMarketingAgent: (payload: MarketingAgentUpdate) => putRaw<ApiResponse<MarketingAgentState>, MarketingAgentUpdate>("/api/marketing/agent", payload).then((response) => response.data),
  refreshMarketingContext: () => postRaw<ApiResponse<MarketingAgentState>, Record<string, never>>("/api/marketing/agent/context/refresh", {}).then((response) => response.data),
  runMarketingAgent: () => postRaw<ApiResponse<MarketingAgentState>, Record<string, never>>("/api/marketing/agent/run", {}).then((response) => response.data),
  uploadMarketingAssets: (files: File[]) => {
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    return postForm<ApiResponse<MarketingAgentState>>("/api/marketing/assets", body).then((response) => response.data);
  },
  deleteMarketingAsset: (assetId: string) => deleteRaw<ApiResponse<MarketingAgentState>>(`/api/marketing/assets/${assetId}`).then((response) => response.data),
  saveMarketingCredential: (platform: MarketingPlatform, payload: MarketingCredentialInput) => putRaw<ApiResponse<MarketingAgentState>, MarketingCredentialInput>(`/api/marketing/credentials/${platform}`, payload).then((response) => response.data),
  deleteMarketingCredential: (platform: MarketingPlatform) => deleteRaw<ApiResponse<MarketingAgentState>>(`/api/marketing/credentials/${platform}`).then((response) => response.data),
};
