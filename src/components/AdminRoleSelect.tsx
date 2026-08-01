"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isPlatformAdminEmail } from "@/lib/admin-client";

type AdminRoleSelectProps = {
  userId: string;
  email: string;
  role: "traveller" | "operator" | "admin";
};

export function AdminRoleSelect({ userId, email, role }: AdminRoleSelectProps) {
  const router = useRouter();
  const locked = isPlatformAdminEmail(email);
  const [value, setValue] = useState(role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: typeof role) {
    if (locked || next === value) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not update role.");
        return;
      }
      setValue(next);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <select
        value={value}
        disabled={busy || locked}
        onChange={(e) => onChange(e.target.value as typeof role)}
        className="border border-ink/15 bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-skyline disabled:opacity-60"
        title={locked ? "Platform owner — always admin" : "Change member role"}
      >
        <option value="traveller">Traveller</option>
        <option value="operator">Operator</option>
        <option value="admin">Admin</option>
      </select>
      {locked ? (
        <p className="mt-1 text-[10px] uppercase tracking-wider text-stone">
          Locked owner
        </p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-amber-deep">{error}</p> : null}
    </div>
  );
}
