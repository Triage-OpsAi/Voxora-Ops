"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Check, Loader2, PhoneCall, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const INDIAN_PHONE_PATTERN = /^\d{10}$/;

function formatNicheLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function NewCallDialog() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [niche, setNiche] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [nicheMenuOpen, setNicheMenuOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: agents, isLoading: nichesLoading, error: nichesError } = useQuery({
    queryKey: ["agents"],
    queryFn: api.agents,
    enabled: open,
  });

  const nicheOptions = useMemo(
    () => Array.from(new Set((agents || []).map((agent) => agent.niche))).sort(),
    [agents],
  );

  const mutation = useMutation({
    mutationFn: api.startOutboundCall,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const normalizedNumber = useMemo(() => `+91${phoneDigits}`, [phoneDigits]);
  const selectedNicheLabel = niche ? formatNicheLabel(niche) : "Select niche";

  useEffect(() => {
    if (open && !niche && nicheOptions.length) {
      setNiche(user?.default_niche && nicheOptions.includes(user.default_niche) ? user.default_niche : nicheOptions[0]);
    }
  }, [niche, nicheOptions, open, user?.default_niche]);

  function resetForm() {
    setPhoneDigits("");
    setNiche("");
    setCampaignGoal("");
    setNicheMenuOpen(false);
    setValidationError(null);
    mutation.reset();
  }

  function handlePhoneChange(value: string) {
    setPhoneDigits(value.replace(/\D/g, "").slice(0, 10));
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.reset();
    setValidationError(null);

    if (!INDIAN_PHONE_PATTERN.test(phoneDigits)) {
      setValidationError("Enter a 10 digit phone number. +91 will be added automatically.");
      return;
    }

    if (!niche) {
      setValidationError("Choose a niche from the backend options.");
      return;
    }

    mutation.mutate({
      to_number: normalizedNumber,
      niche,
      business_name: user?.business_name,
      business_details: user?.business_details,
      campaign_goal: campaignGoal.trim() || `Introduce ${user?.business_name || "the business"}, qualify interest, and book the next best step.`,
    });
  }

  const statusMessage = validationError
    || (nichesError instanceof Error ? "Could not load backend niches. Check NEXT_PUBLIC_API_URL and FastAPI." : null)
    || (mutation.error instanceof Error ? mutation.error.message : null);
  const canPlaceCall = Boolean(niche) && !nichesLoading && !nichesError && !mutation.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200">
          + New call
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[.08] bg-[#11131a] p-5 shadow-[0_24px_120px_-32px_rgba(0,0,0,.95)] outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold tracking-tight text-white">
                Start outbound call
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Enter the phone number and niche for the outbound call.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="grid size-8 shrink-0 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/[.05] hover:text-zinc-200" aria-label="Close new call dialog">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="outbound-to-number" className="text-xs font-medium text-zinc-300">
                Number
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-0 top-1/2 flex h-8 -translate-y-1/2 items-center border-r border-white/[.08] px-3 text-sm font-medium text-zinc-400">
                  +91
                </span>
                <input
                  id="outbound-to-number"
                  value={phoneDigits}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/[.08] bg-black/20 pl-14 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
                  placeholder="8055678283"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="outbound-niche" className="text-xs font-medium text-zinc-300">
                Niche
              </label>
              <div className="relative">
                <button
                  id="outbound-niche"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={nicheMenuOpen}
                  disabled={nichesLoading || Boolean(nichesError)}
                  onClick={() => setNicheMenuOpen((value) => !value)}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-white/[.08] bg-black/20 px-3 text-left text-sm text-zinc-100 outline-none transition focus:border-violet-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className={cn(!niche && "text-zinc-600")}>
                    {nichesLoading ? "Loading backend niches..." : selectedNicheLabel}
                  </span>
                  <ChevronDown size={16} className={cn("text-zinc-500 transition", nicheMenuOpen && "rotate-180")} />
                </button>

                {nicheMenuOpen && (
                  <div
                    role="listbox"
                    aria-labelledby="outbound-niche"
                    className="absolute z-[100] mt-2 w-full overflow-hidden rounded-xl border border-white/[.08] bg-[#0d0f16] p-1 shadow-2xl shadow-black/60"
                  >
                    {nicheOptions.map((option) => {
                      const selected = option === niche;
                      return (
                        <button
                          key={option}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setNiche(option);
                            setNicheMenuOpen(false);
                          }}
                          className={cn(
                            "flex h-9 w-full items-center justify-between rounded-lg px-3 text-left text-sm text-zinc-300 transition hover:bg-white/[.06] hover:text-white",
                            selected && "bg-violet-500/15 text-violet-100",
                          )}
                        >
                          {formatNicheLabel(option)}
                          {selected && <Check size={14} className="text-violet-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="outbound-campaign-goal" className="text-xs font-medium text-zinc-300">
                Campaign goal
              </label>
              <textarea
                id="outbound-campaign-goal"
                value={campaignGoal}
                onChange={(event) => setCampaignGoal(event.target.value)}
                className="min-h-20 w-full resize-none rounded-xl border border-white/[.08] bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-500/50"
                placeholder={`Introduce ${user?.business_name || "the business"} and qualify the next best action`}
              />
            </div>

            {statusMessage && (
              <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                {statusMessage}
              </div>
            )}

            {mutation.data && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                Call queued for {mutation.data.niche}. SID: <span className="font-mono">{mutation.data.call_sid}</span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              {mutation.data ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-10 rounded-xl border border-white/[.08] px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/[.04]"
                >
                  Start another
                </button>
              ) : (
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="h-10 rounded-xl border border-white/[.08] px-4 text-xs font-medium text-zinc-300 transition hover:bg-white/[.04]"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
              )}
              <button
                type="submit"
                disabled={!canPlaceCall}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70",
                  mutation.data && "sm:min-w-28",
                )}
              >
                {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <PhoneCall size={14} />}
                {mutation.data ? "Call again" : "Place call"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
