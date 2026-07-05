import { ProtectedApp } from "@/components/protected-app";
import { AnalyticsView } from "@/features/analytics/analytics-view";

export default function Page() {
  return <ProtectedApp><AnalyticsView /></ProtectedApp>;
}
