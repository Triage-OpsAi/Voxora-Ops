import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";

const navItems = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#about" },
  { label: "Contact us", href: "/#contact" },
];

export function PublicHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#08090d]/[.92] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <Bot size={18} />
            </span>
            <span className="text-base font-semibold text-white">Voxora</span>
          </Link>
          {!compact && (
            <nav className="hidden items-center gap-6 md:flex" aria-label="Public navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-zinc-400 transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/signin" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-white sm:inline-flex">
            Sign in
          </Link>
          <Link href="/signup" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
            Start workspace <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      {!compact && (
        <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 pb-3 text-sm text-zinc-400 sm:px-6 md:hidden" aria-label="Public mobile navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
