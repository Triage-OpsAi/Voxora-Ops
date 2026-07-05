import { cn } from "@/lib/utils";
export function Card({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn("rounded-2xl border border-white/[.07] bg-[#11131a]/80 shadow-[0_20px_80px_-40px_rgba(0,0,0,.8)] backdrop-blur-xl",className)} {...props}/>}
