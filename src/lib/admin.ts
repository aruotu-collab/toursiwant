import type { AppUser, UserRole } from "@/lib/auth";

/** Hard-locked platform owners. Comma-separated override via PLATFORM_ADMIN_EMAILS. */
export function platformAdminEmails(): string[] {
  const fromEnv = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  const raw = fromEnv || "aruotu@gmail.com";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string) {
  return platformAdminEmails().includes(email.trim().toLowerCase());
}

/** Admin can use traveller + operator surfaces. */
export function canAccessOperator(user: Pick<AppUser, "role"> | null | undefined) {
  return user?.role === "operator" || user?.role === "admin";
}

export function canAccessAdmin(user: Pick<AppUser, "role"> | null | undefined) {
  return user?.role === "admin";
}

export function resolveStoredRole(
  email: string,
  requested?: UserRole,
  current?: UserRole,
): UserRole {
  if (isPlatformAdminEmail(email)) return "admin";

  // Never allow self-promotion to admin via magic-link payload
  if (requested === "admin") {
    return current === "admin" ? "admin" : current || "traveller";
  }

  if (requested === "operator") return "operator";

  // Keep elevated roles unless explicitly demoted by an admin later
  if (current === "admin" || current === "operator") return current;

  return "traveller";
}

export function roleLabel(role: UserRole | string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "operator":
      return "Operator";
    default:
      return "Traveller";
  }
}
