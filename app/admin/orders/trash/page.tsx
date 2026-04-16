import { AdminOrderTrash } from "@/src/components/admin/order-trash";
import { requireAdminPageSession } from "@/src/lib/admin-guard";

export default async function AdminOrderTrashPage() {
  await requireAdminPageSession();

  return <AdminOrderTrash />;
}

