"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status").then((r) => r.json()).then((d) => setCreating(!d.hasPasscode));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ passcode: code }) });
    const d = await r.json();
    setBusy(false);
    if (d.ok) return router.replace("/");
    setMsg(
      d.error === "locked" ? "Too many tries. Wait 5 minutes."
      : d.error === "too_short" ? "Use at least 4 characters."
      : "That passcode is wrong.",
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">{creating ? "Set a passcode" : "Enter passcode"}</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          type="password" inputMode="numeric" autoFocus value={code} onChange={(e) => setCode(e.target.value)}
          aria-label="Passcode" className="rounded-xl border border-line bg-surface px-4 py-3 text-lg"
        />
        {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
        <button disabled={busy || !code} className="btn-primary">{creating ? "Save and continue" : "Unlock"}</button>
      </form>
    </main>
  );
}
