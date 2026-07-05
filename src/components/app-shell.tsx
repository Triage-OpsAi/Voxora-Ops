"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Activity, BarChart3, Bot, CircleDot, LayoutDashboard, LogOut, Menu, MessageSquareText, PhoneCall, Search, Settings, Sparkles, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useRealtime } from "@/hooks/use-realtime";
import { motion } from "framer-motion";
import { NewCallDialog } from "@/components/new-call-dialog";
import { useAuthStore } from "@/stores/auth-store";

const nav=[
  ["Overview","/dashboard",LayoutDashboard],["Leads","/leads",Users],["Conversations","/conversations",MessageSquareText],["Calls","/calls",PhoneCall],["Agents","/agents",Bot],["Analytics","/analytics",BarChart3],["Settings","/settings",Settings],
] as const;

export function AppShell({children}:{children:React.ReactNode}){
  const pathname=usePathname(); const {sidebarOpen,setSidebarOpen}=useUIStore(); const user=useAuthStore(s=>s.user); const signout=useAuthStore(s=>s.signout); useRealtime();
  return <div className="min-h-screen bg-[#08090d] text-zinc-100">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(123,92,246,.14),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(34,211,238,.06),transparent_24%)]"/>
    {sidebarOpen&&<button className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={()=>setSidebarOpen(false)} aria-label="Close navigation"/>}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[244px] flex-col border-r border-white/[.06] bg-[#0b0c11]/95 p-4 backdrop-blur-xl transition-transform lg:translate-x-0",sidebarOpen?"translate-x-0":"-translate-x-full")}>
      <div className="mb-7 flex items-center justify-between px-2 py-1"><Link href="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20"><Sparkles size={17}/></span><div><div className="font-semibold tracking-tight">Voxora</div><div className="text-[10px] uppercase tracking-[.18em] text-zinc-500">Agent OS</div></div></Link><button onClick={()=>setSidebarOpen(false)} className="lg:hidden"><X size={18}/></button></div>
      <nav className="space-y-1">{nav.map(([label,href,Icon])=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} onClick={()=>setSidebarOpen(false)} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[.04] hover:text-zinc-200",active&&"bg-white/[.07] text-white shadow-inner shadow-white/[.03]")}><Icon size={17} className={cn(active&&"text-violet-400")}/>{label}{label==="Calls"&&<span className="ml-auto size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"/>}</Link>})}</nav>
      <div className="mt-auto rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-transparent p-3"><div className="flex items-center gap-2 text-xs font-medium"><Activity size={14} className="text-emerald-400"/>Backend connected</div><p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Live call intelligence is syncing every 30 seconds.</p></div>
      <button onClick={signout} className="mt-3 flex items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[.04]"><span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs">{(user?.business_name || "VO").slice(0,2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{user?.business_name || "Workspace"}</span><span className="block truncate text-[10px] capitalize text-zinc-500">{(user?.default_niche || "production").replace("_"," ")}</span></span><LogOut size={14}/></button>
    </aside>
    <div className="relative lg:pl-[244px]"><header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/[.06] bg-[#08090d]/80 px-4 backdrop-blur-xl md:px-7"><button onClick={()=>setSidebarOpen(true)} className="mr-3 lg:hidden"><Menu size={20}/></button><div className="relative hidden max-w-sm flex-1 md:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"/><input className="h-9 w-full rounded-xl border border-white/[.06] bg-white/[.03] pl-9 pr-12 text-xs outline-none placeholder:text-zinc-600 focus:border-violet-500/40" placeholder="Search calls, leads, conversations…"/><kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">⌘ K</kbd></div><div className="ml-auto flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-[11px] text-emerald-300 sm:flex"><CircleDot size={12}/>Live</div><NewCallDialog/></div></header><motion.main key={pathname} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:.22,ease:"easeOut"}} className="p-4 md:p-7 lg:p-8">{children}</motion.main></div>
  </div>
}
