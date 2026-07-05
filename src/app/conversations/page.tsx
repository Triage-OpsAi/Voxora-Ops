import { ProtectedApp } from "@/components/protected-app";
import { ConversationsView } from "@/features/conversations/conversations-view";

export default function Page() {
  return <ProtectedApp><ConversationsView /></ProtectedApp>;
}
