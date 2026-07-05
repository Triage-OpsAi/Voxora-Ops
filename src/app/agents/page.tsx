import { ProtectedApp } from "@/components/protected-app";
import { AgentsView } from "@/features/agents/agents-view";

export default function Page() {
  return <ProtectedApp><AgentsView /></ProtectedApp>;
}
