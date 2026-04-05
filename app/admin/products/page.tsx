import { AdminProductsManager } from "@/src/components/admin/products-manager";
import { requireAdminPageSession } from "@/src/lib/admin-guard";

export default async function AdminProductsPage() {
  await requireAdminPageSession();

  return <AdminProductsManager />;
}
