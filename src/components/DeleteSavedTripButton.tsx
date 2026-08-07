"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteSavedTripButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Remove this trip from My trips?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/saved-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: tripId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Could not delete");
      }
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onDelete}
      className="border border-ink/15 px-4 py-2.5 text-sm text-ink-soft hover:border-ink/40 hover:text-ink disabled:opacity-60"
    >
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
