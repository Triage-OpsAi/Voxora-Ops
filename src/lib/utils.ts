import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function duration(value = 0) { const m=Math.floor(value/60); const s=value%60; return `${m}:${String(s).padStart(2,"0")}`; }
export function date(value?: string | null) { return value ? new Intl.DateTimeFormat("en", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }).format(new Date(value)) : "—"; }
export function phone(value?: string) { return value || "Unknown number"; }
