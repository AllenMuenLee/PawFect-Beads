import { AdminDashboard } from "@/src/components/admin/dashboard";
import { requireAdminPageSession } from "@/src/lib/admin-guard";

export default async function AdminDashboardPage() {
  await requireAdminPageSession();

  return <AdminDashboard />;
}
