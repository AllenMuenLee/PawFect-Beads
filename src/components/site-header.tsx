import Link from "next/link";

const navItems = [
  { href: "/", label: "首頁" },
  { href: "/#pricing", label: "品項" },
  { href: "/#instagram-feed", label: "貼文" },
  { href: "/order", label: "下單" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-rose-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-wide text-rose-950">
          {"PawFect Beads-韓式串珠"}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-stone-700">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-rose-700">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
