import { AdminInstagramEmbedsManager } from "@/src/components/admin/instagram-embeds-manager";
import { requireAdminPageSession } from "@/src/lib/admin-guard";

export default async function AdminInstagramPage() {
  await requireAdminPageSession();

  return <AdminInstagramEmbedsManager />;
}

