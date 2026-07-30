"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OperatorLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/join?role=operator");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-white disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
