"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ORDER_STATUS, getOrderStatusLabel } from "@/src/lib/order-status";

type DashboardOrderItem = {
  id: string;
  productName: string;
  quantity: number;
  isCompleted: boolean;
};

type DashboardOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: DashboardOrderItem[];
};

type FinanceSummary = {
  totalRevenue: number;
  personalProfit: number;
  donationAmount: number;
};

const currencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [ordersResponse, financeResponse] = await Promise.all([fetch("/api/admin/orders"), fetch("/api/admin/finance")]);

      if (ordersResponse.status === 401 || financeResponse.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!ordersResponse.ok || !financeResponse.ok) {
        setError("讀取資料失敗");
        return;
      }

      const ordersData = (await ordersResponse.json()) as { orders: DashboardOrder[] };
      const financeData = (await financeResponse.json()) as FinanceSummary;

      setOrders(ordersData.orders);
      setFinance(financeData);
    } catch {
      setError("讀取資料失敗");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  const handleShipOrder = useCallback(
    async (orderId: string) => {
      const pickupTimeInput = window.prompt("請輸入領件時間（例如：4/8 17:30）");
      if (pickupTimeInput === null) {
        return;
      }

      const pickupTime = pickupTimeInput.trim();
      if (!pickupTime) {
        setError("請先輸入領件時間");
        return;
      }

      setPendingKey(`ship-${orderId}`);
      setError(null);

      try {
        const response = await fetch(`/api/admin/orders/${orderId}/complete`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pickupTime }),
        });

        if (response.status === 401) {
          router.replace("/admin");
          return;
        }

        if (!response.ok) {
          setError("出貨失敗");
          return;
        }

        const payload = (await response.json().catch(() => null)) as { warning?: string } | null;
        if (payload?.warning) {
          setError(payload.warning);
        }

        await loadData();
      } catch {
        setError("出貨失敗");
      } finally {
        setPendingKey(null);
      }
    },
    [loadData, router],
  );

  const handleDeleteOrder = useCallback(
    async (orderId: string) => {
      const confirmed = window.confirm("確定要將此訂單移到回收區嗎？");
      if (!confirmed) {
        return;
      }

      setPendingKey(`delete-${orderId}`);
      setError(null);

      try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
          method: "DELETE",
        });

        if (response.status === 401) {
          router.replace("/admin");
          return;
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? "移到回收區失敗");
          return;
        }

        await loadData();
      } catch {
        setError("移到回收區失敗");
      } finally {
        setPendingKey(null);
      }
    },
    [loadData, router],
  );

  const handleToggleItemDone = useCallback(
    async (orderId: string, itemId: string, nextCompleted: boolean) => {
      setPendingKey(`item-${itemId}`);
      setError(null);

      try {
        const response = await fetch(`/api/admin/orders/${orderId}/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCompleted: nextCompleted }),
        });

        if (response.status === 401) {
          router.replace("/admin");
          return;
        }

        if (!response.ok) {
          setError("更新商品進度失敗");
          return;
        }

        await loadData();
      } catch {
        setError("更新商品進度失敗");
      } finally {
        setPendingKey(null);
      }
    },
    [loadData, router],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const financeCards = useMemo(
    () => [
      { title: "總營業額（已完成訂單）", value: finance?.totalRevenue ?? 0 },
      { title: "個人所得 (25%)", value: finance?.personalProfit ?? 0 },
      { title: "預計捐出金額 (75%)", value: finance?.donationAmount ?? 0 },
    ],
    [finance],
  );

  return (
    <main className="mx-auto flex w-full max-w-[78rem] flex-col gap-10 px-5 py-12 sm:px-8 lg:gap-12 lg:px-12 lg:py-16">
      <header className="rounded-[2rem] border border-rose-100/80 bg-white/85 p-7 shadow-[0_18px_40px_-30px_rgba(99,63,77,0.48)] backdrop-blur-sm sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#3f2e34] sm:text-4xl">後台儀表板</h1>
            <p className="text-sm leading-[1.7] text-stone-600 sm:text-base">訂單總覽、製作進度與財務結算。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products"
              className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
            >
              商品管理
            </Link>
            <Link
              href="/admin/ready-made"
              className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
            >
              預製作品管理
            </Link>
            <Link
              href="/admin/instagram"
              className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
            >
              IG貼文管理
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        {isLoading ? <p className="text-sm text-stone-600">載入中...</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="grid gap-5 md:grid-cols-3 md:gap-6">
        {financeCards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-rose-100/75 bg-white p-6 shadow-[0_16px_34px_-30px_rgba(100,62,77,0.46)] sm:p-7"
          >
            <p className="text-sm text-stone-600">{card.title}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-[#3f2e34] sm:text-[1.75rem]">{currencyFormatter.format(card.value)}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-rose-100/80 bg-white p-6 shadow-[0_18px_40px_-32px_rgba(99,63,77,0.48)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
          <h2 className="text-2xl font-semibold tracking-tight text-[#3f2e34]">所有訂單</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders/trash"
              className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
              aria-label="前往回收區"
              title="回收區"
            >
              垃圾桶
            </Link>
            <button
              onClick={loadData}
              className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
            >
              重新整理
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rose-100 text-left text-stone-600">
                <th className="px-4 py-3.5 font-medium">訂單編號</th>
                <th className="px-4 py-3.5 font-medium">商品與數量</th>
                <th className="px-4 py-3.5 font-medium">金額</th>
                <th className="px-4 py-3.5 font-medium">狀態</th>
                <th className="px-4 py-3.5 font-medium">建立時間</th>
                <th className="px-4 py-3.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isShipped = order.status === ORDER_STATUS.COMPLETED;
                const itemDoneCount = order.items.filter((item) => item.isCompleted).length;

                return (
                  <tr key={order.id} className="border-b border-rose-50 align-top">
                    <td className="px-4 py-5 font-medium text-[#3f2e34]">
                      <Link href={`/admin/orders/${order.id}`} className="underline decoration-rose-200 underline-offset-4">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-5 text-stone-700">
                      <ul className="space-y-2.5">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-rose-50/45 px-3 py-2">
                            <span className={item.isCompleted ? "text-emerald-700" : ""}>
                              {item.productName} x {item.quantity}
                            </span>
                            <label className="flex items-center gap-1.5 text-xs text-stone-600">
                              <input
                                type="checkbox"
                                checked={item.isCompleted}
                                disabled={pendingKey === `item-${item.id}`}
                                onChange={(event) => void handleToggleItemDone(order.id, item.id, event.target.checked)}
                              />
                              已做完
                            </label>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2.5 text-xs text-stone-500">
                        進度：{itemDoneCount}/{order.items.length}
                      </p>
                    </td>
                    <td className="px-4 py-5 text-stone-700">{currencyFormatter.format(order.totalAmount)}</td>
                    <td className="px-4 py-5 text-stone-700">{getOrderStatusLabel(order.status)}</td>
                    <td className="px-4 py-5 text-stone-700">{new Date(order.createdAt).toLocaleString("zh-TW")}</td>
                    <td className="px-4 py-5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          onClick={() => void handleShipOrder(order.id)}
                          disabled={isShipped || pendingKey === `ship-${order.id}`}
                          className="rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                        >
                          出貨
                        </button>
                        <button
                          onClick={() => void handleDeleteOrder(order.id)}
                          disabled={pendingKey === `delete-${order.id}`}
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          移到回收區
                        </button>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          aria-label={`查看訂單 ${order.orderNumber} 明細`}
                          title="查看訂單明細"
                          className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                        >
                          i
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-stone-500">
                    目前沒有訂單
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
