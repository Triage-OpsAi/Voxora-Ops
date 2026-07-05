import { Radio } from "lucide-react";
import { Card } from "./ui/card";
export function EmptyState({title="No activity yet",description="Complete a voice-agent test call and its captured data will appear here automatically."}:{title?:string;description?:string}){return <Card className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-300"><Radio/></span><h3 className="mt-4 font-medium">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">{description}</p></div></Card>}
