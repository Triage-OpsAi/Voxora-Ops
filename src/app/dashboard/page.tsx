import { ProtectedApp } from "@/components/protected-app";
import { DashboardView } from "@/features/dashboard/dashboard-view";

export default function Page() {
  return <ProtectedApp><DashboardView /></ProtectedApp>;
}
