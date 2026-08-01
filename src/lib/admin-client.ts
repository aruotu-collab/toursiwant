/** Client-safe platform admin check (email list only — no secrets). */
export function platformAdminEmails(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS?.trim();
  const raw = fromEnv || "aruotu@gmail.com";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string) {
  return platformAdminEmails().includes(email.trim().toLowerCase());
}
