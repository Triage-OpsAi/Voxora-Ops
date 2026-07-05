export type TranscriptTurn = { role: "caller" | "agent"; text: string; timestamp: string };
export type Call = { id: string; call_sid: string; niche: string; direction: string; from_number: string; to_number: string; status: string; captured_fields: Record<string,string>; transcript: TranscriptTurn[]; summary: string; next_action: string; started_at: string; ended_at: string | null; duration_seconds: number };
export type Lead = { id: string; name: string; phone: string; status: string; score: number; last_interaction: string; tags: string[]; assigned_agent: string; notes: string; call_count: number; captured_fields: Record<string,string> };
export type Agent = { id: string; name: string; niche: string; health: string; prompt_version: string; model: string; voice: string; success_rate: number; average_duration: number; call_count: number };
export type Dashboard = { total_calls: number; active_calls: number; calls_today: number; calls_this_month: number; conversion_rate: number; average_duration: number; calls: Call[] };
export type ApiResponse<T> = { data: T };
