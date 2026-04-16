"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ReadyMadeProduct } from "@/src/lib/ready-made";

type ReadyMadeFormState = {
  name: string;
  price: string;
  stock: string;
  description: string;
  imageUrl: string;
};

const initialFormState: ReadyMadeFormState = {
  name: "",
  price: "",
  stock: "",
  description: "",
  imageUrl: "",
};

export function ReadyMadeProductsManager() {
  const router = useRouter();
  const [products, setProducts] = useState<ReadyMadeProduct[]>([]);
  const [form, setForm] = useState<ReadyMadeFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/ready-made-products");

      if (response.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        setError("讀取預製作品失敗");
        return;
      }

      const data = (await response.json()) as { products: ReadyMadeProduct[] };
      setProducts(data.products);
    } catch {
      setError("讀取預製作品失敗");
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
    setUploadError(null);
  }

  function startEdit(product: ReadyMadeProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description,
      imageUrl: product.imageUrl || "",
    });
    setUploadError(null);
  }

  async function handleUploadFile(file?: File) {
    if (!file) {
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "圖片上傳失敗");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: payload.url || "",
      }));
    } catch (uploadError) {
      setUploadError(uploadError instanceof Error ? uploadError.message : "圖片上傳失敗");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description,
        imageUrl: form.imageUrl,
      };

      const response = await fetch(
        editingId ? `/api/admin/ready-made-products/${editingId}` : "/api/admin/ready-made-products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "儲存預製作品失敗");
        return;
      }

      resetForm();
      await loadProducts();
    } catch {
      setError("儲存預製作品失敗");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("確定要刪除此預製作品嗎？");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/ready-made-products/${id}`, { method: "DELETE" });

    if (response.status === 401) {
      router.replace("/admin");
      return;
    }

    if (!response.ok) {
      setError("刪除預製作品失敗");
      return;
    }

    await loadProducts();
  }

  return (
    <main className="mx-auto flex w-full max-w-[78rem] flex-col gap-8 px-5 py-12 sm:px-8 lg:gap-10 lg:px-12 lg:py-16">
      <header className="rounded-[2rem] border border-rose-100/80 bg-white/85 p-6 shadow-[0_18px_40px_-30px_rgba(99,63,77,0.48)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#3f2e34] sm:text-4xl">預製作品管理</h1>
            <p className="text-sm leading-[1.7] text-stone-600 sm:text-base">
              新增現貨作品、調整價格與庫存。下單後庫存會自動扣除。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
            >
              返回儀表板
            </Link>
            <Link
              href="/admin/products"
              className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
            >
              客製商品管理
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-[1.75rem] border border-rose-100/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(99,63,77,0.48)] sm:p-7">
        <h2 className="text-2xl font-semibold tracking-tight text-[#3f2e34]">{editingId ? "編輯預製作品" : "新增預製作品"}</h2>

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
            <span className="text-sm font-medium text-stone-700">庫存</span>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
              className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              required
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">描述</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              required
            />
          </label>

          <div className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">商品圖片</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handleUploadFile(event.target.files?.[0])}
              className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
            {isUploading ? <p className="text-xs text-stone-500">圖片上傳中...</p> : null}
            {uploadError ? <p className="text-xs text-rose-600">{uploadError}</p> : null}

            {form.imageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-rose-100">
                <Image
                  src={form.imageUrl}
                  alt="預製作品圖片預覽"
                  width={1200}
                  height={700}
                  className="h-auto max-h-[28rem] w-full object-contain bg-stone-50"
                />
                <div className="border-t border-rose-100 bg-white p-2">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-stone-700 hover:bg-rose-50"
                  >
                    移除圖片
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_24px_-16px_rgba(190,24,93,0.75)] transition hover:bg-rose-700 disabled:opacity-60"
            >
              {isSubmitting ? "儲存中..." : editingId ? "更新預製作品" : "新增預製作品"}
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
          <h2 className="text-2xl font-semibold tracking-tight text-[#3f2e34]">預製作品列表</h2>
          <button
            onClick={loadProducts}
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
          >
            重新整理
          </button>
        </div>

        {isLoading ? <p className="text-sm text-stone-600">載入中...</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rose-100 text-left text-stone-600">
                <th className="px-3 py-3 font-medium">圖片</th>
                <th className="px-3 py-3 font-medium">名稱</th>
                <th className="px-3 py-3 font-medium">價格</th>
                <th className="px-3 py-3 font-medium">庫存</th>
                <th className="px-3 py-3 font-medium">描述</th>
                <th className="px-3 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-rose-50 align-top">
                  <td className="px-3 py-4">
                    {product.imageUrl ? (
                      <div className="overflow-hidden rounded-lg border border-rose-100">
                        <Image
                          src={product.imageUrl}
                          alt={`${product.name} 圖片`}
                          width={160}
                          height={100}
                          className="h-auto max-h-20 w-24 object-contain bg-stone-50"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">無圖片</span>
                    )}
                  </td>
                  <td className="px-3 py-4 font-medium text-[#3f2e34]">{product.name}</td>
                  <td className="px-3 py-4 text-stone-700">NT$ {product.price}</td>
                  <td className="px-3 py-4 text-stone-700">{product.stock}</td>
                  <td className="max-w-[420px] px-3 py-4 text-stone-700">{product.description}</td>
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
                    目前沒有預製作品
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
