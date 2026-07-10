export type TranscriptTurn = { role: "caller" | "agent"; text: string; timestamp: string };
export type BusinessProfile = Record<string, string | string[] | Record<string, unknown> | unknown[] | null | undefined>;
export type Call = { id: string; workspace_id?: string; call_sid: string; niche: string; direction: string; from_number: string; to_number: string; status: string; captured_fields: Record<string,string>; transcript: TranscriptTurn[]; summary: string; next_action: string; started_at: string; ended_at: string | null; duration_seconds: number };
export type Lead = { id: string; name: string; phone: string; status: string; score: number; last_interaction: string; tags: string[]; assigned_agent: string; notes: string; call_count: number; captured_fields: Record<string,string> };
export type Agent = { id: string; name: string; niche: string; health: string; prompt_version: string; model: string; voice: string; success_rate: number; average_duration: number; call_count: number };
export type Dashboard = { total_calls: number; active_calls: number; calls_today: number; calls_this_month: number; conversion_rate: number; average_duration: number; calls: Call[] };
export type ApiResponse<T> = { data: T };
export type AuthUser = { id: string; workspace_id: string; email: string; full_name: string; business_name: string; business_phone: string; business_website: string; business_details: string; business_profile?: BusinessProfile; default_niche: string };
export type AuthSession = { token: string; user: AuthUser };
export type SignupRequest = { email: string; password: string; full_name: string; business_name: string; business_phone: string; business_website: string; business_details: string; default_niche: string };
export type SigninRequest = { email: string; password: string };
export type WorkspaceUpdateRequest = Partial<Pick<AuthUser, "full_name" | "business_name" | "business_phone" | "business_website" | "business_details" | "default_niche">>;
export type OutboundCallRequest = { to_number: string; niche: string; business_name?: string; business_details?: string; campaign_goal?: string };
export type OutboundCallResponse = { call_sid: string; niche: string };
export type WorkflowNodeStatus = "idle" | "running" | "success" | "error";
export type WorkflowNode = { id: string; type: string; label: string; x: number; y: number; config: Record<string, string>; status: WorkflowNodeStatus };
export type WorkflowEdge = { id: string; source: string; target: string; output: string };
export type WorkflowDraft = { id: string; name: string; active: boolean; updatedAt: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] };
export type WorkflowRunLog = { id: string; nodeId: string; nodeLabel: string; status: "success" | "error"; message: string; timestamp: string };
export type WorkflowRun = { id: string; workflowId: string; status: string; startedAt: string; finishedAt: string; logs: WorkflowRunLog[] };

export type MarketingPlatform = "linkedin" | "instagram" | "facebook" | "threads" | "webhook";
export type MarketingCredentialStatus = {
  platform: MarketingPlatform;
  connected: boolean;
  account_label: string;
  connected_at: string | null;
};
export type MarketingAsset = {
  id: string;
  filename: string;
  content_type: string;
  origin: "uploaded" | "generated";
  created_at: string;
  public_url: string;
};
export type MarketingPlatformResult = {
  platform: MarketingPlatform;
  status: "published" | "failed" | "skipped";
  post_id?: string;
  message?: string;
};
export type MarketingRun = {
  id: string;
  status: "queued" | "running" | "completed" | "partial" | "failed";
  trigger: "manual" | "schedule" | "cron";
  caption: string;
  headline: string;
  image_asset_id: string | null;
  image_url: string | null;
  model_route: "fast" | "smart";
  platform_results: MarketingPlatformResult[];
  error: string;
  started_at: string;
  finished_at: string | null;
};
export type MarketingBusinessContext = {
  name: string;
  website: string;
  details: string;
  summary: string;
  website_summary: string;
  website_refreshed_at: string | null;
};
export type MarketingAgentConfig = {
  id: string;
  name: string;
  active: boolean;
  goal: string;
  audience: string;
  tone: string;
  call_to_action: string;
  website_url: string;
  image_style: string;
  image_quality: "low" | "medium" | "high";
  interval_hours: number;
  timezone: string;
  platforms: MarketingPlatform[];
  selected_asset_ids: string[];
  next_run_at: string | null;
  last_run_at: string | null;
  updated_at: string;
};
export type MarketingAgentState = {
  agent: MarketingAgentConfig;
  business: MarketingBusinessContext;
  credentials: Record<MarketingPlatform, MarketingCredentialStatus>;
  assets: MarketingAsset[];
  runs: MarketingRun[];
  routing: {
    copy_model: string;
    image_model: string;
    strategy: string;
  };
};
export type MarketingAgentUpdate = Pick<MarketingAgentConfig,
  "name" | "active" | "goal" | "audience" | "tone" | "call_to_action" | "website_url" |
  "image_style" | "image_quality" | "interval_hours" | "timezone" | "platforms" | "selected_asset_ids"
>;
export type MarketingCredentialInput = {
  access_token: string;
  account_id: string;
  account_label?: string;
  webhook_url?: string;
};
