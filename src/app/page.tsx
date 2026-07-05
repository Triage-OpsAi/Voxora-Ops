import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  Check,
  ClipboardList,
  Headphones,
  Megaphone,
  MousePointer2,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Users,
  Workflow,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";

const productCards = [
  {
    title: "No-code agent builder",
    text: "Choose a niche, add your business details, set the call goal, and launch without touching prompt code.",
    icon: MousePointer2,
  },
  {
    title: "Reception desk coverage",
    text: "Answer inbound calls, capture caller intent, route urgent requests, and keep missed calls from becoming lost revenue.",
    icon: Headphones,
  },
  {
    title: "Outbound campaigns",
    text: "Run cold calling, win-back, reactivation, lead qualification, and follow-up campaigns from the same workspace.",
    icon: Megaphone,
  },
  {
    title: "Conversation memory",
    text: "Every call becomes a transcript, captured fields, summary, outcome, and next action your team can audit.",
    icon: ClipboardList,
  },
];

const workflow = [
  ["Describe the business", "Paste services, hours, offers, policies, FAQs, and the tone your team expects."],
  ["Pick the niche", "Use restaurant, real estate, or healthcare behavior as the default operating mode."],
  ["Launch calls", "Place campaign calls from the CRM or let inbound calls route into the same agent brain."],
  ["Act on outcomes", "Review transcripts, lead signals, next actions, and live call metrics in the command center."],
];

const outcomes = [
  { label: "Less front desk pressure", value: "24/7", text: "Coverage for repetitive intake and follow-up." },
  { label: "Cleaner lead handoff", value: "1 view", text: "Transcript, fields, summary, and action together." },
  { label: "Faster campaigns", value: "Minutes", text: "Go from business context to live outreach." },
];

const pricing = [
  {
    name: "Starter",
    price: "$49",
    note: "For testing one voice workflow",
    features: ["1 workspace", "1 active niche", "CRM dashboard", "Basic call transcripts", "Email support"],
    cta: "Start workspace",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$149",
    note: "For small teams running campaigns",
    features: ["3 active agents", "Inbound and outbound calling", "Business profile memory", "Lead capture and summaries", "Priority support"],
    cta: "Choose Growth",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$399",
    note: "For multi-location operations",
    features: ["10 active agents", "Workspace isolation", "Advanced campaign goals", "Realtime monitoring", "Custom call routing"],
    cta: "Talk to sales",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "For regulated or high-volume teams",
    features: ["Dedicated deployment support", "SLA and security review", "Custom CRM integrations", "Higher call limits", "Solution architecture"],
    cta: "Contact us",
    highlighted: false,
  },
];

const useCases = [
  "Restaurants qualifying reservations, catering, orders, and event requests.",
  "Real estate teams calling leads, scheduling viewings, and collecting buyer intent.",
  "Healthcare front desks capturing appointment requests without giving medical advice.",
  "Local businesses recovering missed calls and turning voicemail chaos into tasks.",
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#08090d] text-zinc-100">
      <PublicHeader />

      <section className="relative isolate overflow-hidden border-b border-white/[.06]">
        <div className="absolute inset-0 grid-fade opacity-60" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:py-20">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-3 py-1 text-xs text-emerald-200">
              <ShieldCheck size={13} /> AI voice operations for real businesses
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-none text-white md:text-7xl">Voxora</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
              Build voice agents that answer reception calls, run marketing campaigns, cold call leads, and turn every conversation into operational follow-up.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
                Create your first agent <ArrowRight size={16} />
              </Link>
              <Link href="/signin" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/[.1] px-5 text-sm font-medium text-zinc-300 transition hover:bg-white/[.04]">
                Open command center
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {outcomes.map((item) => (
                <div key={item.label} className="border-l border-white/[.1] pl-4">
                  <div className="text-2xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-xs font-medium text-zinc-300">{item.label}</div>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px]">
            <div className="voxora-orbit" />
            <div className="voxora-speech">
              I am Voxora. I answer, qualify, schedule, follow up, and call prospects while your team runs the business.
            </div>
            <div className="voxora-robot" aria-hidden="true">
              <div className="voxora-antenna" />
              <div className="voxora-head"><span /><span /></div>
              <div className="voxora-body">
                <div />
                <div />
                <div />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="scroll-mt-24 border-b border-white/[.06] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-200"><Sparkles size={14} /> Product</div>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">A voice operations layer your team can actually run.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              Voxora connects call handling, campaign execution, and CRM visibility. Your team describes the business once, then the agent uses that context for inbound and outbound conversations.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productCards.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-white/[.08] bg-[#10131a] p-5">
                <Icon className="text-cyan-200" size={21} />
                <h3 className="mt-5 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <div className="rounded-lg border border-white/[.08] bg-white/[.03] p-6">
              <Workflow size={20} className="text-emerald-200" />
              <h3 className="mt-5 text-xl font-semibold text-white">From setup to follow-up</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-500">
                The workflow is built for operators, not developers: configure context, choose the niche, launch calls, and review outcomes.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflow.map(([title, text], index) => (
                <div key={title} className="rounded-lg border border-white/[.08] bg-[#10131a] p-4">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-300/10 text-xs font-semibold text-cyan-200">{index + 1}</div>
                  <h4 className="mt-4 text-sm font-medium text-white">{title}</h4>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[.06] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-200"><BarChart3 size={14} /> Operations impact</div>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Automate the repetitive call work that slows teams down.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              Voxora helps ops teams reduce missed calls, clean up lead intake, and run consistent outreach without pulling humans into every first conversation.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Reception", text: "Capture names, requests, timing, urgency, and next actions from inbound calls.", icon: PhoneCall },
              { title: "Lead generation", text: "Qualify cold leads and route interested prospects to the right human follow-up.", icon: Target },
              { title: "Campaign follow-up", text: "Call back old leads, reminders, inquiries, and no-shows with consistent scripts.", icon: TimerReset },
            ].map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-white/[.08] bg-white/[.035] p-5">
                <Icon size={20} className="text-amber-200" />
                <h3 className="mt-5 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 border-b border-white/[.06] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-200"><BadgeCheck size={14} /> Pricing</div>
              <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Plans that scale from first agent to full voice operations.</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-500">
                Simple starter plans for validation, business plans for teams, and enterprise support for high-volume or regulated deployments.
              </p>
            </div>
            <Link href="/signup" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/[.1] px-4 text-sm font-medium text-zinc-200 transition hover:bg-white/[.04]">
              Compare in workspace <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {pricing.map((plan) => (
              <article key={plan.name} className={`rounded-lg border p-5 ${plan.highlighted ? "border-cyan-300/[.35] bg-cyan-300/[.07]" : "border-white/[.08] bg-[#10131a]"}`}>
                {plan.highlighted && <div className="mb-4 inline-flex rounded-full bg-cyan-300/[.12] px-3 py-1 text-[10px] font-semibold text-cyan-100">Most popular</div>}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-semibold text-white">{plan.price}</span>
                  {plan.price.startsWith("$") && <span className="pb-1 text-xs text-zinc-500">/month</span>}
                </div>
                <p className="mt-3 min-h-10 text-sm leading-6 text-zinc-500">{plan.note}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-xs leading-5 text-zinc-300">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === "Enterprise" ? "/#contact" : "/signup"} className={`mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition ${plan.highlighted ? "bg-white text-zinc-950 hover:bg-zinc-200" : "border border-white/[.1] text-zinc-200 hover:bg-white/[.04]"}`}>
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 border-b border-white/[.06] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-200"><Users size={14} /> About</div>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Built for teams where every call can become revenue, risk, or work.</h2>
          </div>
          <div className="space-y-5">
            <p className="text-sm leading-7 text-zinc-500">
              Voxora is designed around practical operating work: answer the phone, qualify the person, capture the details, and make the next step visible. The CRM keeps this work close to transcripts and live call status instead of burying it in scattered notes.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div key={item} className="rounded-lg border border-white/[.08] bg-white/[.03] p-4 text-sm leading-6 text-zinc-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-white/[.08] bg-[#10131a] p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-cyan-200"><CalendarCheck size={14} /> Contact us</div>
            <h2 className="mt-4 text-3xl font-semibold text-white">Ready to put Voxora on your calls?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
              Start a workspace for local testing, or talk to the team about campaign volume, CRM integration, compliance, and deployment planning.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link href="/signup" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
              Start workspace <ArrowRight size={15} />
            </Link>
            <a href="mailto:sales@voxora.ai" className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[.1] px-5 text-sm font-medium text-zinc-200 transition hover:bg-white/[.04]">
              sales@voxora.ai
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
