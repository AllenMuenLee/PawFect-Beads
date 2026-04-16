"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TrashOrderItem = {
  id: string;
  productName: string;
  quantity: number;
};

type TrashOrder = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  createdAt: string;
  deletedAt: string | null;
  items: TrashOrderItem[];
};

const currencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function AdminOrderTrash() {
  const router = useRouter();
  const [orders, setOrders] = useState<TrashOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/orders?includeDeleted=1");
      if (response.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        setError("讀取回收區失敗");
        return;
      }

      const data = (await response.json()) as { orders: TrashOrder[] };
      setOrders(data.orders.filter((order) => !!order.deletedAt));
    } catch {
      setError("讀取回收區失敗");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleRestoreOrder = useCallback(
    async (orderId: string) => {
      const confirmed = window.confirm("確定要還原此訂單嗎？");
      if (!confirmed) {
        return;
      }

      setPendingKey(`restore-${orderId}`);
      setError(null);

      try {
        const response = await fetch(`/api/admin/orders/${orderId}/restore`, { method: "PATCH" });
        if (response.status === 401) {
          router.replace("/admin");
          return;
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? "還原訂單失敗");
          return;
        }

        await loadOrders();
      } catch {
        setError("還原訂單失敗");
      } finally {
        setPendingKey(null);
      }
    },
    [loadOrders, router],
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <main className="mx-auto flex w-full max-w-[78rem] flex-col gap-8 px-5 py-12 sm:px-8 lg:gap-10 lg:px-12 lg:py-16">
      <header className="rounded-[2rem] border border-rose-100/80 bg-white/85 p-6 shadow-[0_18px_40px_-30px_rgba(99,63,77,0.48)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#3f2e34] sm:text-4xl">訂單回收區</h1>
            <p className="text-sm leading-[1.7] text-stone-600 sm:text-base">可還原誤刪的訂單。</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
          >
            返回儀表板
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        {isLoading ? <p className="text-sm text-stone-600">載入中...</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="rounded-[1.75rem] border border-rose-100/80 bg-white p-6 shadow-[0_18px_40px_-32px_rgba(99,63,77,0.48)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
          <h2 className="text-2xl font-semibold tracking-tight text-[#3f2e34]">已刪除訂單</h2>
          <button
            onClick={loadOrders}
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
          >
            重新整理
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rose-100 text-left text-stone-600">
                <th className="px-4 py-3.5 font-medium">訂單編號</th>
                <th className="px-4 py-3.5 font-medium">商品與數量</th>
                <th className="px-4 py-3.5 font-medium">金額</th>
                <th className="px-4 py-3.5 font-medium">建立時間</th>
                <th className="px-4 py-3.5 font-medium">刪除時間</th>
                <th className="px-4 py-3.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-rose-50 align-top">
                  <td className="px-4 py-5 font-medium text-[#3f2e34]">{order.orderNumber}</td>
                  <td className="px-4 py-5 text-stone-700">
                    <ul className="space-y-1.5">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.productName} x {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-5 text-stone-700">{currencyFormatter.format(order.totalAmount)}</td>
                  <td className="px-4 py-5 text-stone-700">{new Date(order.createdAt).toLocaleString("zh-TW")}</td>
                  <td className="px-4 py-5 text-stone-700">
                    {order.deletedAt ? new Date(order.deletedAt).toLocaleString("zh-TW") : "-"}
                  </td>
                  <td className="px-4 py-5">
                    <button
                      onClick={() => void handleRestoreOrder(order.id)}
                      disabled={pendingKey === `restore-${order.id}`}
                      className="rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      還原
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-stone-500">
                    回收區目前沒有訂單
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

