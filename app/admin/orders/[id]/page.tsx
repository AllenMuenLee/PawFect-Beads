import { AdminOrderDetail } from "@/src/components/admin/order-detail";
import { requireAdminPageSession } from "@/src/lib/admin-guard";

export default async function AdminOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdminPageSession();
  const { id } = await props.params;

  return <AdminOrderDetail orderId={id} />;
}
