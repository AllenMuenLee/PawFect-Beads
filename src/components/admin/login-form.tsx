"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "登入失敗");
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-2xl rounded-[2rem] border border-rose-100/80 bg-white/90 p-6 shadow-[0_20px_45px_-32px_rgba(99,63,77,0.48)] backdrop-blur-sm sm:mt-14 sm:p-10">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-[#3f2e34] sm:text-4xl">後台登入</h1>
        <p className="mt-4 text-sm leading-[1.7] text-stone-600 sm:text-base">請輸入管理員密碼以進入系統。</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">管理員密碼</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-stone-300/90 px-4 py-3 text-[15px] outline-none ring-0 transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            required
          />
        </label>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_24px_-16px_rgba(190,24,93,0.75)] transition hover:bg-rose-700 disabled:opacity-60"
        >
          {isLoading ? "登入中..." : "登入"}
        </button>
      </form>
    </section>
  );
}
