import { ProtectedApp } from "@/components/protected-app";
import { CallsView } from "@/features/calls/calls-view";

export default function Page() {
  return <ProtectedApp><CallsView /></ProtectedApp>;
}
