"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type InstagramEmbedRecord = {
  id: string;
  title: string | null;
  permalink: string;
  embedUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type EmbedFormState = {
  title: string;
  embedInput: string;
  sortOrder: string;
};

const initialFormState: EmbedFormState = {
  title: "",
  embedInput: "",
  sortOrder: "0",
};

export function AdminInstagramEmbedsManager() {
  const router = useRouter();
  const [embeds, setEmbeds] = useState<InstagramEmbedRecord[]>([]);
  const [form, setForm] = useState<EmbedFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEmbeds = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/instagram-embeds");

      if (response.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        setError("讀取 IG 貼文失敗");
        return;
      }

      const data = (await response.json()) as { embeds: InstagramEmbedRecord[] };
      setEmbeds(data.embeds);
    } catch {
      setError("讀取 IG 貼文失敗");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadEmbeds();
  }, [loadEmbeds]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/instagram-embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          embedInput: form.embedInput,
          sortOrder: Number(form.sortOrder),
        }),
      });

      if (response.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "新增 IG 貼文失敗");
        return;
      }

      setForm(initialFormState);
      await loadEmbeds();
    } catch {
      setError("新增 IG 貼文失敗");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("確定要刪除這則 IG 貼文嗎？");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/instagram-embeds/${id}`, { method: "DELETE" });

    if (response.status === 401) {
      router.replace("/admin");
      return;
    }

    if (!response.ok) {
      setError("刪除 IG 貼文失敗");
      return;
    }

    await loadEmbeds();
  }

  return (
    <main className="mx-auto flex w-full max-w-[78rem] flex-col gap-8 px-5 py-12 sm:px-8 lg:gap-10 lg:px-12 lg:py-16">
      <header className="rounded-[2rem] border border-rose-100/80 bg-white/85 p-6 shadow-[0_18px_40px_-30px_rgba(99,63,77,0.48)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#3f2e34] sm:text-4xl">IG 貼文管理</h1>
            <p className="text-sm leading-[1.7] text-stone-600 sm:text-base">貼上 IG 內嵌碼或貼文網址，首頁會自動顯示。</p>
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
        <h2 className="text-2xl font-semibold tracking-tight text-[#3f2e34]">新增 IG 內嵌貼文</h2>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2 md:gap-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">顯示標題（可留白）</span>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">排序（數字越小越前面）</span>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
              className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              required
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">IG 內嵌碼或貼文網址</span>
            <textarea
              value={form.embedInput}
              onChange={(event) => setForm((prev) => ({ ...prev, embedInput: event.target.value }))}
              className="min-h-32 w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              placeholder='例如：https://www.instagram.com/p/XXXXXXXXX/ 或整段 blockquote 內嵌碼'
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_24px_-16px_rgba(190,24,93,0.75)] transition hover:bg-rose-700 disabled:opacity-60"
            >
              {isSubmitting ? "新增中..." : "新增貼文"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-rose-100/80 bg-white p-5 shadow-[0_18px_40px_-32px_rgba(99,63,77,0.48)] sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[#3f2e34]">已新增貼文</h2>
          <button
            onClick={loadEmbeds}
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-rose-50"
          >
            重新整理
          </button>
        </div>

        {isLoading ? <p className="text-sm text-stone-600">載入中...</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rose-100 text-left text-stone-600">
                <th className="px-3 py-3 font-medium">標題</th>
                <th className="px-3 py-3 font-medium">貼文連結</th>
                <th className="px-3 py-3 font-medium">排序</th>
                <th className="px-3 py-3 font-medium">建立時間</th>
                <th className="px-3 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {embeds.map((item) => (
                <tr key={item.id} className="border-b border-rose-50 align-top">
                  <td className="px-3 py-4 text-stone-700">{item.title || "（未命名）"}</td>
                  <td className="px-3 py-4">
                    <a
                      href={item.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-rose-700 underline decoration-rose-200 underline-offset-4"
                    >
                      {item.permalink}
                    </a>
                  </td>
                  <td className="px-3 py-4 text-stone-700">{item.sortOrder}</td>
                  <td className="px-3 py-4 text-stone-700">{new Date(item.createdAt).toLocaleString("zh-TW")}</td>
                  <td className="px-3 py-4">
                    <button
                      onClick={() => void handleDelete(item.id)}
                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-600 transition hover:bg-rose-50"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
              {embeds.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-stone-500">
                    目前還沒有貼文
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

