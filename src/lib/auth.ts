import { cookies } from "next/headers";
import { ensureAppSchema, getSql, hasDatabase } from "@/lib/db";

export type UserRole = "traveller" | "operator" | "admin";

export type AppUser = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  businessName?: string;
  createdAt: string;
};

const SESSION_COOKIE = "toursiwant_session";
const SESSION_DAYS = 30;

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function upsertUser(input: {
  email: string;
  name?: string;
  role?: UserRole;
  businessName?: string;
  phone?: string;
}): Promise<AppUser> {
  await ensureAppSchema();
  const sql = getSql();
  const email = input.email.trim().toLowerCase();

  const existing = (await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `) as Array<Record<string, unknown>>;

  if (existing[0]) {
    const row = existing[0];
    const role =
      input.role && input.role !== "traveller"
        ? input.role
        : (row.role as UserRole);
    await sql`
      UPDATE users
      SET
        name = COALESCE(${input.name ?? null}, name),
        phone = COALESCE(${input.phone ?? null}, phone),
        business_name = COALESCE(${input.businessName ?? null}, business_name),
        role = ${role}
      WHERE email = ${email}
    `;
    return {
      id: String(row.id),
      email,
      name: (input.name || row.name || undefined) as string | undefined,
      phone: (input.phone || row.phone || undefined) as string | undefined,
      role,
      businessName: (input.businessName ||
        row.business_name ||
        undefined) as string | undefined,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
    };
  }

  const user: AppUser = {
    id: newId("user"),
    email,
    name: input.name,
    phone: input.phone,
    role: input.role || "traveller",
    businessName: input.businessName,
    createdAt: new Date().toISOString(),
  };

  await sql`
    INSERT INTO users (id, email, name, phone, role, business_name, created_at)
    VALUES (
      ${user.id},
      ${user.email},
      ${user.name ?? null},
      ${user.phone ?? null},
      ${user.role},
      ${user.businessName ?? null},
      ${user.createdAt}
    )
  `;

  return user;
}

export async function createMagicLink(input: {
  email: string;
  role?: UserRole;
  name?: string;
  nextPath?: string;
}) {
  await ensureAppSchema();
  const sql = getSql();
  const token = newId("magic");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();

  await sql`
    INSERT INTO magic_tokens (token, email, role, name, next_path, expires_at)
    VALUES (
      ${token},
      ${input.email.trim().toLowerCase()},
      ${input.role || "traveller"},
      ${input.name ?? null},
      ${input.nextPath ?? "/account?welcome=1"},
      ${expiresAt}
    )
  `;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://www.toursiwant.com");

  return {
    token,
    magicUrl: `${siteUrl}/api/auth/verify?token=${token}`,
    expiresAt,
  };
}

export async function consumeMagicToken(token: string) {
  await ensureAppSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM magic_tokens WHERE token = ${token} LIMIT 1
  `) as Array<Record<string, unknown>>;

  const row = rows[0];
  if (!row) return null;

  const expiresAt = new Date(String(row.expires_at)).getTime();
  await sql`DELETE FROM magic_tokens WHERE token = ${token}`;
  if (expiresAt < Date.now()) return null;

  const user = await upsertUser({
    email: String(row.email),
    name: row.name ? String(row.name) : undefined,
    role: (row.role as UserRole) || "traveller",
  });

  const sessionToken = newId("sess");
  const sessionExpires = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  await sql`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (${sessionToken}, ${user.id}, ${sessionExpires})
  `;

  return {
    user,
    sessionToken,
    sessionExpires,
    nextPath: row.next_path ? String(row.next_path) : "/account?welcome=1",
  };
}

export async function createSessionCookie(sessionToken: string, expiresAt: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!hasDatabase()) return null;
  await ensureAppSchema();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT u.*, s.expires_at AS session_expires
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `) as Array<Record<string, unknown>>;

  const row = rows[0];
  if (!row) return null;

  if (new Date(String(row.session_expires)).getTime() < Date.now()) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
    return null;
  }

  return {
    id: String(row.id),
    email: String(row.email),
    name: row.name ? String(row.name) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    role: (row.role as UserRole) || "traveller",
    businessName: row.business_name
      ? String(row.business_name)
      : undefined,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function sendMagicEmail(email: string, magicUrl: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "ToursIWant <onboarding@resend.dev>";

  if (!apiKey) {
    return { sent: false as const, reason: "RESEND_API_KEY not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your ToursIWant sign-in link",
      html: `<p>Click to join ToursIWant and continue your request:</p><p><a href="${magicUrl}">${magicUrl}</a></p><p>This link expires in 30 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { sent: false as const, reason: text };
  }

  return { sent: true as const };
}
