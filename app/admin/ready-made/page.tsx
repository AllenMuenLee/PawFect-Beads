import { ReadyMadeProductsManager } from "@/src/components/admin/ready-made-products-manager";
import { requireAdminPageSession } from "@/src/lib/admin-guard";

export default async function AdminReadyMadePage() {
  await requireAdminPageSession();

  return <ReadyMadeProductsManager />;
}

