"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ORDER_STATUS, getOrderStatusLabel } from "@/src/lib/order-status";

type OrderDetailItem = {
  id: string;
  productName: string;
  quantity: number;
  sizeValue: string;
  colorScheme: string;
  styleDescription: string;
  addOnCharmQuantity: number;
  isCompleted: boolean;
  referenceImageUrl: string | null;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderDetailItem[];
};

const currencyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function AdminOrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
        if (response.status === 401) {
          router.replace("/admin");
          return;
        }
        if (!response.ok) {
          setError("讀取訂單明細失敗");
          return;
        }

        const data = (await response.json()) as { order: OrderDetail };
        setOrder(data.order);
      } catch {
        setError("讀取訂單明細失敗");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOrder();
  }, [orderId, router]);

  if (isLoading) {
    return <main className="mx-auto w-full max-w-5xl px-5 py-10 text-sm text-stone-600">載入中...</main>;
  }

  if (error || !order) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <p className="text-sm text-rose-600">{error ?? "找不到訂單"}</p>
        <Link href="/admin/dashboard" className="mt-3 inline-block text-sm text-stone-700 underline">
          返回訂單列表
        </Link>
      </main>
    );
  }

  const isShipped = order.status === ORDER_STATUS.COMPLETED;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#3f2e34]">訂單明細</h1>
          <p className="mt-1 text-sm text-stone-600">訂單編號：{order.orderNumber}</p>
        </div>
        <Link href="/admin/dashboard" className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700">
          返回列表
        </Link>
      </header>

      <section className="rounded-2xl border border-rose-100 bg-white p-5">
        <div className="grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
          <p>狀態：{getOrderStatusLabel(order.status)}</p>
          <p>是否已出貨：{isShipped ? "是" : "否"}</p>
          <p>建立時間：{new Date(order.createdAt).toLocaleString("zh-TW")}</p>
          <p>總金額：{currencyFormatter.format(order.totalAmount)}</p>
        </div>
      </section>

      <section className="space-y-4">
        {order.items.map((item, index) => (
          <article key={item.id} className="rounded-2xl border border-rose-100 bg-white p-5">
            <h2 className="text-lg font-semibold text-[#3f2e34]">
              {index + 1}. {item.productName} x {item.quantity}
            </h2>
            <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <p>尺寸：{item.sizeValue}</p>
              <p>配色：{item.colorScheme}</p>
              <p>款式描述：{item.styleDescription || "無"}</p>
              <p>是否加購綴飾：{item.addOnCharmQuantity > 0 ? `是（${item.addOnCharmQuantity} 個）` : "否"}</p>
              <p>製作完成：{item.isCompleted ? "是" : "否"}</p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm text-stone-700">參考圖片：</p>
              {item.referenceImageUrl ? (
                <a href={item.referenceImageUrl} target="_blank" rel="noreferrer" className="inline-block">
                  <Image
                    src={item.referenceImageUrl}
                    alt={`${item.productName} 參考圖片`}
                    width={176}
                    height={176}
                    unoptimized
                    className="h-44 w-44 rounded-xl border border-rose-100 object-cover"
                  />
                </a>
              ) : (
                <p className="text-sm text-stone-500">未提供</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
