import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="text-lg font-semibold">Reel Studio</Link>
        <Link href="/settings" className="text-base text-muted transition hover:text-ink">Settings</Link>
      </header>
      <main className="flex flex-1 flex-col pb-16">{children}</main>
    </div>
  );
}
