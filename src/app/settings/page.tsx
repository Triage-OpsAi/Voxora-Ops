"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Eye, ExternalLink, Loader2, LockKeyhole, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ProtectedApp } from "@/components/protected-app";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const groups = [
  { title: "Voice infrastructure", description: "Twilio phone and webhook configuration", fields: ["Twilio Account SID", "Twilio phone number", "Voice webhook URL"] },
  { title: "Speech providers", description: "ElevenLabs and OpenAI runtime configuration", fields: ["ElevenLabs API key", "ElevenLabs Voice ID", "OpenAI API key"] },
  { title: "Backend connectivity", description: "Public API and realtime transport", fields: ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_WS_URL"] },
];
const FALLBACK_NICHES = ["healthcare", "real_estate", "restaurant"];

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateWorkspace = useAuthStore((state) => state.updateWorkspace);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    business_phone: "",
    business_website: "",
    business_details: "",
    default_niche: "",
  });

  const { data: agents } = useQuery({ queryKey: ["agents"], queryFn: api.agents });
  const nicheOptions = useMemo(
    () => Array.from(new Set((agents || []).map((agent) => agent.niche))).sort(),
    [agents],
  );
  const options = nicheOptions.length ? nicheOptions : FALLBACK_NICHES;

  useEffect(() => {
    if (!user) return;
    setForm({
      full_name: user.full_name || "",
      business_name: user.business_name || "",
      business_phone: user.business_phone || "",
      business_website: user.business_website || "",
      business_details: user.business_details || "",
      default_niche: user.default_niche || options[0] || "",
    });
  }, [options, user]);

  function update(key: keyof typeof form, value: string) {
    setStatus(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    if (!form.business_name.trim()) {
      setStatus({ type: "error", message: "Business name is required." });
      return;
    }
    if (!form.default_niche) {
      setStatus({ type: "error", message: "Choose a default niche." });
      return;
    }
    setPending(true);
    try {
      await updateWorkspace(form);
      setStatus({ type: "success", message: "Workspace saved. New inbound and outbound calls will use this profile." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Could not save workspace." });
    } finally {
      setPending(false);
    }
  }

  const profileSummary = typeof user?.business_profile?.summary === "string" ? user.business_profile.summary : "";
  const missing = Array.isArray(user?.business_profile?.missing) ? user.business_profile.missing.filter(Boolean).join(", ") : "";

  return (
    <ProtectedApp>
      <PageHeader title="Settings" description="Tune the workspace identity and default agent behavior without exposing provider secrets in the browser." />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-medium">Workspace profile</h2>
                <p className="mt-1 text-xs text-zinc-600">This context is normalized by the backend and becomes the default for calls.</p>
              </div>
              {status && (
                <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px]", status.type === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200")}>
                  {status.type === "success" && <CheckCircle2 size={12} />}
                  {status.message}
                </span>
              )}
            </div>

            <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
              <Field label="Your name" value={form.full_name} onChange={(value) => update("full_name", value)} />
              <Field label="Business name" value={form.business_name} onChange={(value) => update("business_name", value)} />
              <Field label="Business phone" value={form.business_phone} onChange={(value) => update("business_phone", value)} />
              <Field label="Website" value={form.business_website} onChange={(value) => update("business_website", value)} />
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs font-medium text-zinc-300">Default niche</span>
                <select
                  value={form.default_niche}
                  onChange={(event) => update("default_niche", event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/[.08] bg-[#0b0d13] px-3 text-sm text-zinc-100 outline-none focus:border-cyan-400/50"
                >
                  {options.map((option) => <option key={option} value={option}>{label(option)}</option>)}
                </select>
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs font-medium text-zinc-300">Business details</span>
                <textarea
                  value={form.business_details}
                  onChange={(event) => update("business_details", event.target.value)}
                  className="min-h-44 w-full resize-y rounded-xl border border-white/[.08] bg-black/20 px-3 py-2 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
                  placeholder="Paste JSON, bullet points, services, pricing, FAQs, policies, timings, address, offers, tone, booking rules, or website copy."
                />
              </label>
              <div className="flex justify-end sm:col-span-2">
                <button disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70">
                  {pending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save workspace
                </button>
              </div>
            </form>
          </Card>

          {groups.map((group) => (
            <Card key={group.title} className="p-5">
              <h2 className="text-sm font-medium">{group.title}</h2>
              <p className="mt-1 text-xs text-zinc-600">{group.description}</p>
              <div className="mt-5 space-y-3">
                {group.fields.map((field) => (
                  <div key={field} className="flex items-center justify-between rounded-xl border border-white/[.05] bg-black/10 p-3">
                    <div>
                      <div className="text-xs text-zinc-300">{field}</div>
                      <div className="mt-1 font-mono text-[10px] text-zinc-600">Managed in environment</div>
                    </div>
                    <span className="flex items-center gap-2 text-[10px] text-emerald-400"><LockKeyhole size={12} />Protected</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <Eye size={18} className="text-cyan-300" />
            <h3 className="mt-4 text-sm font-medium">Normalized context</h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">{profileSummary || "Save business details to generate a structured agent profile."}</p>
            {missing && <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[10px] text-amber-100">Missing: {missing}</div>}
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-medium">Connection</h3>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300"><span className="size-2 rounded-full bg-emerald-400" />Environment configured</div>
            <button className="mt-4 flex items-center gap-2 text-xs text-cyan-300">Integration guide <ExternalLink size={12} /></button>
          </Card>
        </div>
      </div>
    </ProtectedApp>
  );
}

function Field({ label: fieldLabel, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium text-zinc-300">{fieldLabel}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-white/[.08] bg-black/20 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
      />
    </label>
  );
}
