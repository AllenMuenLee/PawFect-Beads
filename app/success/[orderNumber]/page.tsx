import Link from "next/link";

type SuccessPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { orderNumber } = await params;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div className="w-full rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-rose-950">{"訂單已送出"}</h1>
        <p className="mt-4 text-stone-700">{"訂單編號："}{orderNumber}</p>
        <p className="mt-2 text-sm text-stone-600">{"我們已收到您的需求，將透過您提供的聯絡方式與您確認細節。"}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-rose-50">
            {"回到首頁"}
          </Link>
          <Link href="/order" className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            {"再下另一筆"}
          </Link>
        </div>
      </div>
    </main>
  );
}
