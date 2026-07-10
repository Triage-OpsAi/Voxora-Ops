"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AtSign,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Camera,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileImage,
  Globe2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Play,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UsersRound,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type {
  MarketingAgentState,
  MarketingAgentUpdate,
  MarketingCredentialInput,
  MarketingPlatform,
  MarketingRun,
} from "@/types";

const PLATFORM_META: Record<MarketingPlatform, {
  label: string;
  description: string;
  accountLabel: string;
  accountPlaceholder: string;
  icon: typeof Bot;
  tone: string;
}> = {
  linkedin: {
    label: "LinkedIn Page",
    description: "Publish image posts as your organization.",
    accountLabel: "Organization ID or URN",
    accountPlaceholder: "123456 or urn:li:organization:123456",
    icon: BriefcaseBusiness,
    tone: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  },
  instagram: {
    label: "Instagram",
    description: "Publish to an Instagram professional account.",
    accountLabel: "Instagram account ID",
    accountPlaceholder: "17841400000000000",
    icon: Camera,
    tone: "text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-400/20",
  },
  facebook: {
    label: "Facebook Page",
    description: "Upload and publish directly to a Page.",
    accountLabel: "Facebook Page ID",
    accountPlaceholder: "102030405060",
    icon: UsersRound,
    tone: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  },
  threads: {
    label: "Threads",
    description: "Publish image-led posts to Threads.",
    accountLabel: "Threads user ID",
    accountPlaceholder: "1234567890",
    icon: AtSign,
    tone: "text-zinc-200 bg-white/[.06] border-white/[.1]",
  },
  webhook: {
    label: "Other platforms",
    description: "Send the campaign to your publishing webhook.",
    accountLabel: "Connection name",
    accountPlaceholder: "Buffer, Make, Zapier, custom publisher",
    icon: Webhook,
    tone: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  },
};

const PLATFORMS = Object.keys(PLATFORM_META) as MarketingPlatform[];
const EMPTY_CREDENTIAL: MarketingCredentialInput = { access_token: "", account_id: "", account_label: "", webhook_url: "" };

export function AgentsView() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["marketing-agent"],
    queryFn: api.marketingAgent,
    refetchInterval: 15_000,
  });
  const [form, setForm] = useState<MarketingAgentUpdate | null>(null);
  const [credentials, setCredentials] = useState<Record<MarketingPlatform, MarketingCredentialInput>>(() => ({
    linkedin: { ...EMPTY_CREDENTIAL },
    instagram: { ...EMPTY_CREDENTIAL },
    facebook: { ...EMPTY_CREDENTIAL },
    threads: { ...EMPTY_CREDENTIAL },
    webhook: { ...EMPTY_CREDENTIAL },
  }));
  const [pending, setPending] = useState<string>("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!data || form) return;
    setForm(configToForm(data));
  }, [data, form]);

  const connectedCount = useMemo(
    () => data ? PLATFORMS.filter((platform) => data.credentials[platform]?.connected).length : 0,
    [data],
  );

  function update<K extends keyof MarketingAgentUpdate>(key: K, value: MarketingAgentUpdate[K]) {
    setNotice(null);
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function acceptState(next: MarketingAgentState, syncForm = false) {
    queryClient.setQueryData(["marketing-agent"], next);
    if (syncForm) setForm(configToForm(next));
  }

  async function saveAgent(activate?: boolean) {
    if (!form) return null;
    const payload = activate === undefined ? form : { ...form, active: activate };
    setPending("save");
    setNotice(null);
    try {
      const next = await api.saveMarketingAgent(payload);
      acceptState(next, true);
      setNotice({ type: "success", message: payload.active ? "Agent saved and schedule activated." : "Agent configuration saved." });
      return next;
    } catch (caught) {
      setNotice({ type: "error", message: messageFrom(caught, "Could not save the agent.") });
      return null;
    } finally {
      setPending("");
    }
  }

  async function runNow() {
    if (!form) return;
    setPending("run");
    setNotice(null);
    try {
      const saved = await api.saveMarketingAgent(form);
      acceptState(saved, true);
      const next = await api.runMarketingAgent();
      acceptState(next, true);
      const latest = next.runs[0];
      setNotice({
        type: latest?.status === "failed" ? "error" : "success",
        message: latest?.status === "failed" ? latest.error || "Campaign run failed." : "Campaign generated and sent to the connected publishers.",
      });
    } catch (caught) {
      setNotice({ type: "error", message: messageFrom(caught, "Could not run the campaign.") });
    } finally {
      setPending("");
    }
  }

  async function refreshContext() {
    if (!form) return;
    setPending("context");
    setNotice(null);
    try {
      const saved = await api.saveMarketingAgent(form);
      acceptState(saved, true);
      const next = await api.refreshMarketingContext();
      acceptState(next, true);
      setNotice({ type: "success", message: "Website context refreshed and cached for future campaigns." });
    } catch (caught) {
      setNotice({ type: "error", message: messageFrom(caught, "Could not read the website.") });
    } finally {
      setPending("");
    }
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setPending("upload");
    setNotice(null);
    try {
      const next = await api.uploadMarketingAssets(files);
      acceptState(next);
      const newIds = next.assets.filter((asset) => files.some((file) => file.name === asset.filename)).map((asset) => asset.id);
      setForm((current) => current ? {
        ...current,
        selected_asset_ids: Array.from(new Set([...current.selected_asset_ids, ...newIds])),
      } : current);
      setNotice({ type: "success", message: `${files.length} image${files.length === 1 ? "" : "s"} added to the campaign library.` });
    } catch (caught) {
      setNotice({ type: "error", message: messageFrom(caught, "Could not upload the selected images.") });
    } finally {
      setPending("");
    }
  }

  async function deleteAsset(assetId: string) {
    setPending(`asset:${assetId}`);
    try {
      const next = await api.deleteMarketingAsset(assetId);
      acceptState(next);
      setForm((current) => current ? { ...current, selected_asset_ids: current.selected_asset_ids.filter((id) => id !== assetId) } : current);
    } catch (caught) {
      setNotice({ type: "error", message: messageFrom(caught, "Could not delete the image.") });
    } finally {
      setPending("");
    }
  }

  function toggleAsset(assetId: string) {
    if (!form) return;
    const selected = form.selected_asset_ids.includes(assetId);
    update("selected_asset_ids", selected
      ? form.selected_asset_ids.filter((id) => id !== assetId)
      : [...form.selected_asset_ids, assetId]);
  }

  function togglePlatform(platform: MarketingPlatform) {
    if (!form) return;
    const selected = form.platforms.includes(platform);
    update("platforms", selected ? form.platforms.filter((item) => item !== platform) : [...form.platforms, platform]);
  }

  function updateCredential(platform: MarketingPlatform, key: keyof MarketingCredentialInput, value: string) {
    setCredentials((current) => ({ ...current, [platform]: { ...current[platform], [key]: value } }));
  }

  async function connectPlatform(platform: MarketingPlatform) {
    const draft = credentials[platform];
    if (!draft.access_token.trim() || !draft.account_id.trim() || (platform === "webhook" && !draft.webhook_url?.trim())) {
      setNotice({ type: "error", message: `Complete the ${PLATFORM_META[platform].label} connection fields first.` });
      return;
    }
    setPending(`credential:${platform}`);
    setNotice(null);
    try {
      const next = await api.saveMarketingCredential(platform, draft);
      acceptState(next);
      setCredentials((current) => ({ ...current, [platform]: { ...EMPTY_CREDENTIAL } }));
      setForm((current) => current && !current.platforms.includes(platform)
        ? { ...current, platforms: [...current.platforms, platform] }
        : current);
      setNotice({ type: "success", message: `${PLATFORM_META[platform].label} connected. The token is encrypted and is never returned to the browser.` });
    } catch (caught) {
      setNotice({ type: "error", message: messageFrom(caught, `Could not connect ${PLATFORM_META[platform].label}.`) });
    } finally {
      setPending("");
    }
  }

  async function disconnectPlatform(platform: MarketingPlatform) {
    setPending(`credential:${platform}`);
    try {
      const next = await api.deleteMarketingCredential(platform);
      acceptState(next);
      setForm((current) => current ? { ...current, platforms: current.platforms.filter((item) => item !== platform) } : current);
    } catch (caught) {
      setNotice({ type: "error", message: messageFrom(caught, `Could not disconnect ${PLATFORM_META[platform].label}.`) });
    } finally {
      setPending("");
    }
  }

  if (isLoading || !data || !form) return <MarketingAgentSkeleton />;
  if (error) return <LoadError message={messageFrom(error, "Could not load the marketing agent.")} />;

  const nextRun = form.active ? data.agent.next_run_at : null;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-[#0d1017] p-5 shadow-2xl shadow-black/20 md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(139,92,246,.2),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(34,211,238,.09),transparent_30%)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200 shadow-lg shadow-violet-500/10">
              <Bot size={22} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-violet-200">Default agent</span>
                <span className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px]", form.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-white/[.08] bg-white/[.03] text-zinc-500")}>
                  <span className={cn("size-1.5 rounded-full", form.active ? "bg-emerald-400" : "bg-zinc-600")} />
                  {form.active ? "Schedule active" : "Draft"}
                </span>
              </div>
              <input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="mt-3 w-full bg-transparent text-2xl font-semibold tracking-tight text-white outline-none md:text-3xl"
                aria-label="Agent name"
              />
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">Learns the business once, creates one focused image campaign, and publishes it across connected channels on your schedule.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => saveAgent()} disabled={Boolean(pending)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[.1] bg-white/[.04] px-4 text-xs font-semibold text-zinc-200 transition hover:bg-white/[.08] disabled:opacity-50">
              {pending === "save" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
            <button onClick={() => saveAgent(!form.active)} disabled={Boolean(pending)} className={cn("inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition disabled:opacity-50", form.active ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100")}>
              <CalendarClock size={14} />
              {form.active ? "Pause schedule" : "Save & activate"}
            </button>
            <button onClick={runNow} disabled={Boolean(pending)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50">
              {pending === "run" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Run now
            </button>
          </div>
        </div>
      </section>

      {notice && (
        <div className={cn("flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs", notice.type === "success" ? "border-emerald-400/20 bg-emerald-400/[.08] text-emerald-100" : "border-rose-400/20 bg-rose-400/[.08] text-rose-100")}>
          {notice.type === "success" ? <CheckCircle2 size={15} className="mt-px shrink-0" /> : <XCircle size={15} className="mt-px shrink-0" />}
          {notice.message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-0">
            <SectionHeader icon={Building2} eyebrow="01 · Context" title="Business intelligence" description="Workspace details are the source of truth; the website is optional supporting context." />
            <div className="grid gap-5 border-t border-white/[.06] p-5 lg:grid-cols-[1.1fr_.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[.06] bg-black/15 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[.16em] text-zinc-600">Workspace profile</p>
                      <h3 className="mt-2 text-base font-semibold text-white">{data.business.name}</h3>
                    </div>
                    <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-2 py-1 text-[10px] text-emerald-300">Synced</span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-zinc-500">{data.business.summary || data.business.details || "Add business details in Settings so the agent can create specific campaigns."}</p>
                </div>
                <Field label="Business website" hint="Used for text context only. Images are selected below, never entered as image URLs.">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input value={form.website_url} onChange={(event) => update("website_url", event.target.value)} placeholder="https://yourbusiness.com" className="field-input pl-9" />
                    </div>
                    <button onClick={refreshContext} disabled={Boolean(pending) || !form.website_url.trim()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.04] px-3 text-xs text-zinc-300 hover:bg-white/[.07] disabled:opacity-40">
                      {pending === "context" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Refresh
                    </button>
                  </div>
                </Field>
                {data.business.website_summary && (
                  <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[.04] px-3 py-2.5 text-[11px] leading-5 text-zinc-500">
                    <span className="font-medium text-cyan-200">Cached website context: </span>{data.business.website_summary}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <Field label="Campaign goal"><textarea value={form.goal} onChange={(event) => update("goal", event.target.value)} className="field-textarea min-h-28" placeholder="Generate qualified interest for our core offer." /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Audience"><input value={form.audience} onChange={(event) => update("audience", event.target.value)} className="field-input" placeholder="Decision-makers in India" /></Field>
                  <Field label="Brand tone"><input value={form.tone} onChange={(event) => update("tone", event.target.value)} className="field-input" placeholder="Clear, warm, confident" /></Field>
                </div>
                <Field label="Call to action"><input value={form.call_to_action} onChange={(event) => update("call_to_action", event.target.value)} className="field-input" placeholder="Book a demo" /></Field>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <SectionHeader icon={ImagePlus} eyebrow="02 · Creative" title="Image campaign studio" description="Upload product, team, location, or brand references from your device. Video generation stays disabled." trailing={<span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[10px] text-zinc-500">Images only</span>} />
            <div className="border-t border-white/[.06] p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Visual direction" className="md:col-span-2"><input value={form.image_style} onChange={(event) => update("image_style", event.target.value)} className="field-input" placeholder="Premium editorial photography with natural lighting" /></Field>
                <Field label="Image quality"><select value={form.image_quality} onChange={(event) => update("image_quality", event.target.value as MarketingAgentUpdate["image_quality"])} className="field-input"><option value="low">Low · economical</option><option value="medium">Medium · recommended</option><option value="high">High · premium</option></select></Field>
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-dashed border-white/[.12] bg-white/[.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Upload size={17} /></span>
                  <div><p className="text-xs font-medium text-zinc-200">Select image files</p><p className="mt-1 text-[10px] text-zinc-600">PNG, JPEG or WebP · up to 10 MB each · all stay selectable; the router uses up to 2 per run to control image tokens</p></div>
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={Boolean(pending)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[.08] bg-white/[.05] px-3 text-xs text-zinc-200 hover:bg-white/[.08] disabled:opacity-50">
                  {pending === "upload" ? <Loader2 size={14} className="animate-spin" /> : <FileImage size={14} />}
                  Choose pictures
                </button>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={uploadFiles} />
              </div>

              {data.assets.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {data.assets.map((asset) => {
                    const selected = form.selected_asset_ids.includes(asset.id);
                    return (
                      <div key={asset.id} className={cn("group relative overflow-hidden rounded-2xl border bg-black/20 transition", selected ? "border-violet-400/50 ring-2 ring-violet-400/10" : "border-white/[.07]")}>
                        <button onClick={() => toggleAsset(asset.id)} className="block aspect-square w-full overflow-hidden text-left" title={selected ? "Remove from campaign references" : "Use in campaign references"}>
                          {/* The backend serves unguessable public asset URLs so Instagram and Threads can retrieve generated media. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={asset.public_url} alt={asset.filename} className="size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                          <span className={cn("absolute left-2 top-2 grid size-6 place-items-center rounded-lg border backdrop-blur", selected ? "border-violet-300/30 bg-violet-500/80 text-white" : "border-white/15 bg-black/50 text-zinc-400")}>
                            {selected && <Check size={13} />}
                          </span>
                        </button>
                        <div className="flex items-center gap-2 px-2.5 py-2">
                          <div className="min-w-0 flex-1"><p className="truncate text-[10px] text-zinc-300">{asset.filename}</p><p className="mt-0.5 text-[9px] capitalize text-zinc-600">{asset.origin}</p></div>
                          <button onClick={() => deleteAsset(asset.id)} disabled={pending === `asset:${asset.id}`} className="grid size-7 place-items-center rounded-lg text-zinc-600 hover:bg-rose-400/10 hover:text-rose-300"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/[.05] bg-black/10 px-4 py-7 text-center"><FileImage size={20} className="mx-auto text-zinc-700" /><p className="mt-2 text-xs text-zinc-500">No reference images yet. The agent can still generate a new campaign image from business context.</p></div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <SectionHeader icon={Send} eyebrow="03 · Distribution" title="Publishing credentials" description="Credentials are encrypted in the backend. Saved tokens are never sent back to this page." trailing={<span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-2.5 py-1 text-[10px] text-emerald-300"><LockKeyhole size={11} />{connectedCount} connected</span>} />
            <div className="grid gap-4 border-t border-white/[.06] p-5 lg:grid-cols-2">
              {PLATFORMS.map((platform) => (
                <PlatformCard
                  key={platform}
                  platform={platform}
                  enabled={form.platforms.includes(platform)}
                  status={data.credentials[platform]}
                  draft={credentials[platform]}
                  pending={pending === `credential:${platform}`}
                  onToggle={() => togglePlatform(platform)}
                  onChange={(key, value) => updateCredential(platform, key, value)}
                  onConnect={() => connectPlatform(platform)}
                  onDisconnect={() => disconnectPlatform(platform)}
                />
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <SectionHeader icon={Clock3} eyebrow="04 · Automation" title="Campaign schedule" description="Save an interval and the default agent will claim due runs automatically." />
            <div className="grid gap-4 border-t border-white/[.06] p-5 md:grid-cols-3">
              <Field label="Run every"><select value={form.interval_hours} onChange={(event) => update("interval_hours", Number(event.target.value))} className="field-input"><option value={3}>3 hours</option><option value={6}>6 hours</option><option value={12}>12 hours</option><option value={24}>24 hours</option></select></Field>
              <Field label="Timezone"><input value={form.timezone} onChange={(event) => update("timezone", event.target.value)} className="field-input" placeholder="Asia/Kolkata" /></Field>
              <div className="rounded-2xl border border-white/[.06] bg-black/15 p-3.5"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-600">Next run</p><p className="mt-2 text-xs font-medium text-zinc-200">{nextRun ? formatDate(nextRun) : "Schedule paused"}</p><p className="mt-1 text-[10px] text-zinc-600">Runs continue without this page open.</p></div>
            </div>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/[.06] p-5"><div className="flex items-center gap-2 text-sm font-semibold"><Zap size={16} className="text-amber-300" />Token-efficient route</div><p className="mt-2 text-xs leading-5 text-zinc-600">One compact brief, one image request, then direct API publishers.</p></div>
            <div className="p-5">
              <RouteStep icon={Building2} title="Cached context" detail="Workspace + website summary" active />
              <RouteConnector />
              <RouteStep icon={BrainCircuit} title="Copy router" detail={`${data.routing.copy_model} · one JSON brief`} active />
              <RouteConnector />
              <RouteStep icon={Sparkles} title="Image model" detail={`${data.routing.image_model} · ${form.image_quality}`} active />
              <RouteConnector />
              <RouteStep icon={Send} title="Direct publishers" detail={`${form.platforms.length} selected channel${form.platforms.length === 1 ? "" : "s"}`} active={form.platforms.length > 0} />
            </div>
            <div className="border-t border-white/[.06] bg-white/[.02] px-5 py-3 text-[10px] leading-4 text-zinc-600">{data.routing.strategy}</div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/[.06] p-5"><div><h3 className="text-sm font-semibold">Recent campaigns</h3><p className="mt-1 text-[10px] text-zinc-600">Latest automated and manual runs</p></div><Activity size={16} className="text-cyan-300" /></div>
            <div className="divide-y divide-white/[.05]">
              {data.runs.length ? data.runs.slice(0, 6).map((run) => <RunItem key={run.id} run={run} />) : <div className="p-6 text-center text-xs text-zinc-600">Run the agent to create the first campaign.</div>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><Clock3 size={15} className="text-violet-300" />Automation health</div><span className={cn("size-2 rounded-full", form.active ? "bg-emerald-400 shadow-[0_0_9px_#34d399]" : "bg-zinc-700")} /></div>
            <div className="mt-4 space-y-3 text-xs">
              <HealthRow label="Status" value={form.active ? "Scheduled" : "Paused"} />
              <HealthRow label="Interval" value={`${form.interval_hours} hours`} />
              <HealthRow label="Last run" value={data.agent.last_run_at ? formatDate(data.agent.last_run_at) : "Not run yet"} />
              <HealthRow label="Next run" value={nextRun ? formatDate(nextRun) : "—"} />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function PlatformCard({ platform, enabled, status, draft, pending, onToggle, onChange, onConnect, onDisconnect }: {
  platform: MarketingPlatform;
  enabled: boolean;
  status: MarketingAgentState["credentials"][MarketingPlatform];
  draft: MarketingCredentialInput;
  pending: boolean;
  onToggle: () => void;
  onChange: (key: keyof MarketingCredentialInput, value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const meta = PLATFORM_META[platform];
  const Icon = meta.icon;
  return (
    <div className={cn("rounded-2xl border p-4 transition", enabled ? "border-white/[.12] bg-white/[.025]" : "border-white/[.06] bg-black/10")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl border", meta.tone)}><Icon size={17} /></span>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-xs font-semibold text-zinc-200">{meta.label}</h3>{status.connected && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] text-emerald-300">Connected</span>}</div><p className="mt-1 text-[10px] leading-4 text-zinc-600">{meta.description}</p></div>
        <button onClick={onToggle} className={cn("relative h-6 w-11 shrink-0 rounded-full border transition", enabled ? "border-violet-300/30 bg-violet-500" : "border-white/[.1] bg-white/[.04]")} aria-label={`${enabled ? "Disable" : "Enable"} ${meta.label}`}><span className={cn("absolute top-0.5 size-4 rounded-full bg-white transition", enabled ? "left-[22px]" : "left-1")} /></button>
      </div>
      {status.connected ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[.04] p-3"><LockKeyhole size={14} className="text-emerald-300" /><div className="min-w-0 flex-1"><p className="truncate text-[10px] text-emerald-100">{status.account_label}</p><p className="mt-0.5 font-mono text-[9px] text-zinc-600">Token ·••••••••· encrypted</p></div><button onClick={onDisconnect} disabled={pending} className="text-[10px] text-zinc-500 hover:text-rose-300">Remove</button></div>
      ) : (
        <div className="mt-4 space-y-2.5">
          <input value={draft.account_id} onChange={(event) => onChange("account_id", event.target.value)} className="field-input h-10 text-xs" placeholder={meta.accountPlaceholder} aria-label={meta.accountLabel} />
          {platform === "webhook" && <input value={draft.webhook_url} onChange={(event) => onChange("webhook_url", event.target.value)} className="field-input h-10 text-xs" placeholder="https://publisher.example.com/campaigns" aria-label="Webhook URL" />}
          <div className="flex gap-2"><input type="password" value={draft.access_token} onChange={(event) => onChange("access_token", event.target.value)} className="field-input h-10 flex-1 text-xs" placeholder={platform === "webhook" ? "Webhook bearer secret" : "Access token"} aria-label={`${meta.label} access token`} /><button onClick={onConnect} disabled={pending} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.05] px-3 text-[10px] font-semibold text-zinc-200 hover:bg-white/[.08] disabled:opacity-50">{pending ? <Loader2 size={12} className="animate-spin" /> : <LockKeyhole size={12} />}Connect</button></div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, description, trailing }: { icon: typeof Bot; eyebrow: string; title: string; description: string; trailing?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.04] text-zinc-300"><Icon size={17} /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-violet-300/70">{eyebrow}</p><h2 className="mt-1 text-sm font-semibold text-zinc-100">{title}</h2><p className="mt-1 text-[11px] leading-5 text-zinc-600">{description}</p></div>{trailing}</div>;
}

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("block space-y-2", className)}><span className="flex items-center justify-between gap-2 text-[11px] font-medium text-zinc-300">{label}{hint && <span className="text-right text-[9px] font-normal text-zinc-600">{hint}</span>}</span>{children}</label>;
}

function RouteStep({ icon: Icon, title, detail, active }: { icon: typeof Bot; title: string; detail: string; active: boolean }) {
  return <div className="flex items-center gap-3"><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl border", active ? "border-violet-400/20 bg-violet-400/10 text-violet-200" : "border-white/[.06] bg-white/[.02] text-zinc-700")}><Icon size={15} /></span><div className="min-w-0"><p className={cn("text-xs font-medium", active ? "text-zinc-200" : "text-zinc-600")}>{title}</p><p className="mt-0.5 truncate text-[9px] text-zinc-600">{detail}</p></div></div>;
}

function RouteConnector() { return <div className="ml-[17px] h-5 w-px bg-gradient-to-b from-violet-400/50 to-white/[.08]" />; }

function RunItem({ run }: { run: MarketingRun }) {
  const successful = run.platform_results.filter((result) => result.status === "published").length;
  const statusTone = run.status === "completed" ? "bg-emerald-400" : run.status === "failed" ? "bg-rose-400" : run.status === "running" || run.status === "queued" ? "bg-amber-400" : "bg-cyan-400";
  return <div className="flex gap-3 p-4">{run.image_url ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={run.image_url} alt={run.headline || "Campaign image"} className="size-12 shrink-0 rounded-xl object-cover" /></> : <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/[.04] text-zinc-700"><FileImage size={17} /></span>}<div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className={cn("size-1.5 shrink-0 rounded-full", statusTone)} /><p className="truncate text-[11px] font-medium text-zinc-300">{run.headline || run.status}</p></div><p className="mt-1 line-clamp-2 text-[9px] leading-4 text-zinc-600">{run.error || run.caption || "Preparing campaign…"}</p><div className="mt-2 flex items-center justify-between text-[9px] text-zinc-700"><span>{formatDate(run.started_at)}</span><span>{successful} published · {run.model_route}</span></div></div></div>;
}

function HealthRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><span className="text-zinc-600">{label}</span><span className="text-right text-zinc-300">{value}</span></div>; }

function MarketingAgentSkeleton() {
  return <div className="mx-auto max-w-[1500px] space-y-5"><div className="h-44 animate-pulse rounded-3xl border border-white/[.06] bg-white/[.03]" /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"><div className="space-y-5">{[280, 360, 420].map((height) => <div key={height} style={{ height }} className="animate-pulse rounded-2xl border border-white/[.06] bg-white/[.025]" />)}</div><div className="h-[520px] animate-pulse rounded-2xl border border-white/[.06] bg-white/[.025]" /></div></div>;
}

function LoadError({ message }: { message: string }) {
  return <div className="mx-auto max-w-2xl rounded-3xl border border-rose-400/20 bg-rose-400/[.06] p-8 text-center"><XCircle size={24} className="mx-auto text-rose-300" /><h2 className="mt-3 text-base font-semibold">Marketing agent unavailable</h2><p className="mt-2 text-sm text-rose-100/70">{message}</p></div>;
}

function configToForm(state: MarketingAgentState): MarketingAgentUpdate {
  const { agent } = state;
  return {
    name: agent.name,
    active: agent.active,
    goal: agent.goal,
    audience: agent.audience,
    tone: agent.tone,
    call_to_action: agent.call_to_action,
    website_url: agent.website_url || state.business.website,
    image_style: agent.image_style,
    image_quality: agent.image_quality,
    interval_hours: agent.interval_hours,
    timezone: agent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    platforms: agent.platforms,
    selected_asset_ids: agent.selected_asset_ids,
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function messageFrom(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
