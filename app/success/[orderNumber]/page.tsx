import Link from "next/link";

type SuccessPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { orderNumber } = await params;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div className="w-full rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-rose-950">{"\u8a02\u55ae\u5df2\u9001\u51fa"}</h1>
        <p className="mt-4 text-stone-700">{"\u8a02\u55ae\u7de8\u865f\uff1a"}{orderNumber}</p>
        <p className="mt-2 text-sm text-stone-600">{"\u6211\u5011\u5df2\u6536\u5230\u60a8\u7684\u9700\u6c42\uff0c\u5c07\u900f\u904e\u60a8\u63d0\u4f9b\u7684\u806f\u7d61\u65b9\u5f0f\u8207\u60a8\u78ba\u8a8d\u7d30\u7bc0\u3002"}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-rose-50">
            {"\u56de\u5230\u9996\u9801"}
          </Link>
          <Link href="/order" className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            {"\u518d\u4e0b\u53e6\u4e00\u7b46"}
          </Link>
        </div>
      </div>
    </main>
  );
}
