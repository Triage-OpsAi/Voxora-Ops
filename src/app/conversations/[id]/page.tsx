import { ProtectedApp } from "@/components/protected-app";
import { ConversationDetail } from "@/features/conversations/conversation-detail";

export default function Page() {
  return <ProtectedApp><ConversationDetail /></ProtectedApp>;
}
