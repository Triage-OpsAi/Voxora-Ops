import type { Agent, ApiResponse, Call, Dashboard, Lead } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured");

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Backend request failed (${response.status})`);
  return (await response.json() as ApiResponse<T>).data;
}

export const api = {
  dashboard: () => request<Dashboard>("/api/dashboard"),
  calls: () => request<Call[]>("/api/calls"),
  call: (id: string) => request<Call>(`/api/calls/${id}`),
  conversations: () => request<Call[]>("/api/conversations"),
  conversation: (id: string) => request<Call>(`/api/conversations/${id}`),
  leads: () => request<Lead[]>("/api/leads"),
  lead: (id: string) => request<Lead>(`/api/leads/${id}`),
  agents: () => request<Agent[]>("/api/agents"),
  agent: (id: string) => request<Agent>(`/api/agents/${id}`),
};
