"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Headphones, Loader2, LockKeyhole, Megaphone, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { PublicHeader } from "@/components/public-header";

type AuthMode = "signin" | "signup";

const FALLBACK_NICHES = ["healthcare", "real_estate", "restaurant"];

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const signin = useAuthStore((state) => state.signin);
  const signup = useAuthStore((state) => state.signup);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    business_name: "",
    business_phone: "",
    business_website: "",
    business_details: "",
    default_niche: "healthcare",
  });

  const { data: agents } = useQuery({ queryKey: ["public-agents"], queryFn: api.publicAgents, enabled: mode === "signup" });
  const nicheOptions = useMemo(
    () => Array.from(new Set((agents || []).map((agent) => agent.niche))).sort(),
    [agents],
  );
  const options = nicheOptions.length ? nicheOptions : FALLBACK_NICHES;

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "signin") {
        await signin({ email: form.email, password: form.password });
      } else {
        await signup({ ...form, default_niche: form.default_niche || options[0] });
      }
      const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      router.replace(next || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  const isSignup = mode === "signup";
  const highlights = isSignup
    ? [
      ["Business context", "Paste JSON, bullets, services, hours, policies, and offers. Voxora normalizes it for calls."],
      ["Default niche", "Start with restaurant, real estate, or healthcare behavior and edit it later in settings."],
      ["Secure workspace", "Calls, conversations, leads, and settings stay scoped to your signed-in workspace."],
    ]
    : [
      ["Command center", "Review calls, transcripts, captured fields, and active conversations."],
      ["Live operations", "Start outbound calls and watch realtime activity from the CRM."],
      ["Workspace defaults", "Keep your niche and business profile aligned before each campaign."],
    ];

  return (
    <main className="min-h-screen bg-[#07080b] text-zinc-100">
      <PublicHeader />
      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
        <section className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.08] px-3 py-1 text-xs text-cyan-200">
            <LockKeyhole size={13} /> Workspace required
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-5xl">
            {isSignup ? "Launch a voice team that knows your business." : "Welcome back to your voice operations desk."}
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            {isSignup
              ? "Choose a niche, add your business identity, and Voxora will use that context when it answers inbound calls or places campaign calls."
              : "Sign in to monitor calls, create campaigns, and keep your AI receptionist aligned with your operations."}
          </p>

          <div className="mt-8 grid gap-3">
            {highlights.map(([title, text], index) => (
              <div key={title} className="flex gap-4 rounded-lg border border-white/[.08] bg-white/[.03] p-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-cyan-300/[.09] text-cyan-200">
                  {index === 0 ? <Headphones size={16} /> : index === 1 ? <Megaphone size={16} /> : <ShieldCheck size={16} />}
                </span>
                <div>
                  <h2 className="text-sm font-medium text-white">{title}</h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/[.07] pt-6">
            {["Inbound", "Outbound", "CRM"].map((item) => (
              <div key={item}>
                <BadgeCheck size={15} className="text-emerald-300" />
                <div className="mt-2 text-xs font-medium text-zinc-300">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4">
          <form onSubmit={submit} className="rounded-lg border border-white/[.08] bg-[#11131a] p-5 shadow-[0_24px_120px_-40px_rgba(0,0,0,.95)]">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">{isSignup ? "Create workspace" : "Sign in"}</h2>
              <p className="mt-1 text-xs text-zinc-500">{isSignup ? "This becomes your default business profile." : "Use your workspace email and password."}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" value={form.email} onChange={(value) => update("email", value)} type="email" className="sm:col-span-2" />
              <Field label="Password" value={form.password} onChange={(value) => update("password", value)} type="password" className="sm:col-span-2" />

              {isSignup && (
                <>
                  <Field label="Your name" value={form.full_name} onChange={(value) => update("full_name", value)} />
                  <Field label="Business name" value={form.business_name} onChange={(value) => update("business_name", value)} />
                  <Field label="Business phone" value={form.business_phone} onChange={(value) => update("business_phone", value)} />
                  <Field label="Website" value={form.business_website} onChange={(value) => update("business_website", value)} />
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-xs font-medium text-zinc-300">Default niche</span>
                    <select
                      value={form.default_niche}
                      onChange={(event) => update("default_niche", event.target.value)}
                      className="h-11 w-full rounded-lg border border-white/[.08] bg-[#0b0d13] px-3 text-sm text-zinc-100 outline-none focus:border-cyan-400/50"
                    >
                      {options.map((option) => <option key={option} value={option}>{label(option)}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-xs font-medium text-zinc-300">Business details</span>
                    <textarea
                      value={form.business_details}
                      onChange={(event) => update("business_details", event.target.value)}
                      className="min-h-24 w-full resize-none rounded-lg border border-white/[.08] bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
                      placeholder="Hours, services, target customers, tone, locations, offers, booking rules"
                    />
                  </label>
                </>
              )}
            </div>

            {error && <div className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{error}</div>}

            <button
              type="submit"
              disabled={pending}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {isSignup ? "Create workspace" : "Sign in"}
            </button>
          </form>
          <div className="flex flex-col gap-2 rounded-lg border border-white/[.08] bg-white/[.03] p-4 text-xs leading-5 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{isSignup ? "Already running a workspace?" : "Need a new workspace?"}</span>
            <Link href={isSignup ? "/signin" : "/signup"} className="inline-flex items-center gap-2 font-medium text-cyan-200 hover:text-cyan-100">
              {isSignup ? "Sign in instead" : "Create one now"} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label: fieldLabel, value, onChange, type = "text", className }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return (
    <label className={cn("space-y-2", className)}>
      <span className="text-xs font-medium text-zinc-300">{fieldLabel}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        className="h-11 w-full rounded-lg border border-white/[.08] bg-black/20 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-cyan-400/50"
      />
    </label>
  );
}
