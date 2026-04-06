import Image from "next/image";
import Link from "next/link";

import { formatCurrency } from "@/src/lib/cart";
import { getActiveCatalogProducts } from "@/src/lib/catalog-db";
import { getActiveInstagramEmbeds } from "@/src/lib/instagram-embed";

export default async function HomePage() {
  const [products, instagramEmbeds] = await Promise.all([
    getActiveCatalogProducts().catch(() => []),
    getActiveInstagramEmbeds().catch(() => []),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-[76rem] flex-1 flex-col gap-16 px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:gap-24 lg:px-12">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-rose-100/90 bg-gradient-to-br from-[#fffdf9] via-[#fff8fb] to-[#fffefe] px-6 py-10 shadow-[0_22px_48px_-34px_rgba(127,84,98,0.42)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="absolute -right-12 -top-10 h-56 w-56 rounded-full bg-rose-100/50 blur-3xl" />
        <div className="absolute -bottom-14 left-5 h-40 w-40 rounded-full bg-amber-100/45 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-5xl py-1 sm:py-2">
          <Image src="/logo.svg" alt="PawFect Beads-韓式串珠" width={244} height={86} priority />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#412f34] sm:text-5xl sm:leading-tight">{"PawFect Beads-韓式串珠"}</h1>
          <p className="mt-5 max-w-2xl text-base leading-[1.7] text-stone-600 sm:text-lg">
            {"以溫柔韓系配色與細膩手工，為你打造專屬日常的串珠飾品。每件作品皆可客製尺寸、配色與款式細節。"}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/order"
              className="rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_24px_-16px_rgba(190,24,93,0.75)] transition hover:bg-rose-700"
            >
              {"開始下單"}
            </Link>
            <p className="text-sm text-stone-500">{"可客製尺寸、配色、吊飾配置"}</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-5xl scroll-mt-24">
        <h2 className="text-3xl font-semibold tracking-tight text-[#412f34] sm:text-[2rem]">{"品項"}</h2>
        <p className="mt-4 max-w-2xl text-base leading-[1.7] text-stone-600">{"以下為目前提供的固定品項，價格清楚透明，可直接加入訂單。"}</p>

        {products.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-rose-100/85 bg-white px-6 py-6 shadow-[0_16px_30px_-26px_rgba(111,75,89,0.52)]"
              >
                <p className="text-[15px] leading-[1.65] text-stone-600">{item.name}</p>
                <p className="mt-5 text-2xl font-semibold tracking-tight text-rose-900">{formatCurrency(item.price)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 px-5 py-4 text-sm leading-[1.7] text-stone-600">
            {"目前尚未上架商品，請至後台商品管理新增或開啟上架狀態。"}
          </p>
        )}
      </section>

      <section id="instagram-feed" className="mx-auto w-full max-w-5xl scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold tracking-tight text-[#412f34] sm:text-[2rem]">{"貼文"}</h2>
          <Link
            href="https://www.instagram.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-rose-700 transition hover:text-rose-800"
          >
            {"前往 Instagram 看更多"}
          </Link>
        </div>
        <p className="mt-4 max-w-2xl text-base leading-[1.7] text-stone-600">{"以下內容由後台新增的 IG 內嵌貼文自動顯示。"}</p>

        {instagramEmbeds.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {instagramEmbeds.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-3xl border border-rose-100/85 bg-white p-3 shadow-[0_16px_30px_-26px_rgba(111,75,89,0.52)]"
              >
                <div className="overflow-hidden rounded-2xl border border-rose-100">
                  <iframe
                    src={post.embedUrl}
                    title={post.title || "Instagram 內嵌貼文"}
                    loading="lazy"
                    className="h-[520px] w-full"
                    allowTransparency={true}
                  />
                </div>
                <div className="px-2 pb-1 pt-3">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-rose-700 underline decoration-rose-200 underline-offset-4"
                  >
                    {post.title || "前往 Instagram 原貼文"}
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 px-5 py-4 text-sm leading-[1.7] text-stone-600">
            {"目前尚未新增 IG 內嵌貼文。"}
          </p>
        )}
      </section>
    </main>
  );
}
