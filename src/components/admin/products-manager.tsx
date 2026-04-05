"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CategoryType = "bracelet" | "ring" | "necklace";

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  categoryType: CategoryType;
  allowCharm: boolean;
  isActive: boolean;
};

type ProductFormState = {
  name: string;
  price: string;
  categoryType: CategoryType;
  allowCharm: boolean;
  isActive: boolean;
};

const initialFormState: ProductFormState = {
  name: "",
  price: "",
  categoryType: "bracelet",
  allowCharm: true,
  isActive: true,
};

const CATEGORY_LABEL: Record<CategoryType, string> = {
  bracelet: "手鍊",
  ring: "戒指",
  necklace: "項鍊",
};

export function AdminProductsManager() {
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/products");

      if (response.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        setError("讀取商品類型失敗");
        return;
      }

      const data = (await response.json()) as { products: CatalogProduct[] };
      setProducts(data.products);
    } catch {
      setError("讀取商品類型失敗");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function resetForm() {
    setForm(initialFormState);
    setEditingId(null);
  }

  function startEdit(product: CatalogProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      categoryType: product.categoryType,
      allowCharm: product.allowCharm,
      isActive: product.isActive,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        categoryType: form.categoryType,
        allowCharm: form.allowCharm,
        isActive: form.isActive,
      };

      const response = await fetch(editingId ? `/api/admin/products/${editingId}` : "/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "儲存商品類型失敗");
        return;
      }

      resetForm();
      await loadProducts();
    } catch {
      setError("儲存商品類型失敗");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("確定要刪除此商品類型嗎？");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });

    if (response.status === 401) {
      router.replace("/admin");
      return;
    }

    if (!response.ok) {
      setError("刪除商品類型失敗");
      return;
    }

    await loadProducts();
  }

  return (
    <main className="mx-auto flex w-full max-w-[78rem] flex-col gap-8 px-5 py-12 sm:px-8 lg:gap-10 lg:px-12 lg:py-16">
      <header className="rounded-[2rem] border border-rose-100/80 bg-white/85 p-6 shadow-[0_18px_40px_-30px_rgba(99,63,77,0.48)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#3f2e34] sm:text-4xl">商品類型管理</h1>
            <p className="text-sm leading-[1.7] text-stone-600 sm:text-base">控制客製區顯示項目、價格與小綴飾加購設定。</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
          >
            返回儀表板
          </Link>
        </div>
      </header>

      <section className="rounded-[1.75rem] border border-rose-100/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(99,63,77,0.48)] sm:p-7">
        <h2 className="text-2xl font-semibold tracking-tight text-[#3f2e34]">{editingId ? "編輯商品類型" : "新增商品類型"}</h2>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2 md:gap-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">名稱</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">價格</span>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">商品類別</span>
            <select
              value={form.categoryType}
              onChange={(event) => {
                const nextCategory = event.target.value as CategoryType;
                setForm((prev) => ({
                  ...prev,
                  categoryType: nextCategory,
                  allowCharm: nextCategory === "ring" ? false : prev.allowCharm,
                }));
              }}
              className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            >
              <option value="bracelet">手鍊</option>
              <option value="ring">戒指</option>
              <option value="necklace">項鍊</option>
            </select>
          </label>

          <div className="space-y-3 rounded-xl border border-rose-100/80 bg-rose-50/40 p-4">
            <p className="text-sm font-medium text-stone-700">設定</p>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.allowCharm}
                disabled={form.categoryType === "ring"}
                onChange={(event) => setForm((prev) => ({ ...prev, allowCharm: event.target.checked }))}
              />
              可加購小綴飾（每個 $15）
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              上架顯示於客製區
            </label>
          </div>

          {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_24px_-16px_rgba(190,24,93,0.75)] transition hover:bg-rose-700 disabled:opacity-60"
            >
              {isSubmitting ? "儲存中..." : editingId ? "更新商品類型" : "新增商品類型"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
              >
                取消編輯
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-rose-100/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(99,63,77,0.48)] sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[#3f2e34]">客製區商品類型列表</h2>
          <button
            onClick={loadProducts}
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
          >
            重新整理
          </button>
        </div>

        {isLoading ? <p className="text-sm text-stone-600">載入中...</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rose-100 text-left text-stone-600">
                <th className="px-3 py-3 font-medium">名稱</th>
                <th className="px-3 py-3 font-medium">價格</th>
                <th className="px-3 py-3 font-medium">類別</th>
                <th className="px-3 py-3 font-medium">小綴飾</th>
                <th className="px-3 py-3 font-medium">上架</th>
                <th className="px-3 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-rose-50 align-top">
                  <td className="px-3 py-4 font-medium text-[#3f2e34]">{product.name}</td>
                  <td className="px-3 py-4 text-stone-700">NT$ {product.price}</td>
                  <td className="px-3 py-4 text-stone-700">{CATEGORY_LABEL[product.categoryType]}</td>
                  <td className="px-3 py-4 text-stone-700">{product.allowCharm ? "可加購" : "不可加購"}</td>
                  <td className="px-3 py-4 text-stone-700">{product.isActive ? "上架中" : "已下架"}</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-700 transition hover:bg-stone-50"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => void handleDelete(product.id)}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-600 transition hover:bg-rose-50"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-stone-500">
                    目前沒有商品類型
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
