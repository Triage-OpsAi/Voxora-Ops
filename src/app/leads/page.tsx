import { ProtectedApp } from "@/components/protected-app";
import { LeadsView } from "@/features/leads/leads-view";

export default function Page() {
  return <ProtectedApp><LeadsView /></ProtectedApp>;
}
