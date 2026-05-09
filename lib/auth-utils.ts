import { getAuth } from "@/auth";
import { env } from "./cf";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function getApiSession(
  req: Request,
): Promise<{ user: SessionUser } | null> {
  const session = await getAuth().api.getSession({ headers: req.headers });
  if (!session?.user) return null;
  // Better Auth's session.user is typed without our additional fields;
  // role lives on the row but isn't in the default User type.
  const user = session.user as SessionUser & Record<string, unknown>;
  return { user: { ...user, role: (user.role as string) ?? "founder" } };
}

export function isAdminRole(role: string | undefined): boolean {
  return role === "goeo_admin" || role === "superadmin";
}

export function isSuperadmin(role: string | undefined): boolean {
  return role === "superadmin";
}

export function hasMachineToken(req: Request): boolean {
  const token = req.headers.get("x-atlas-admin-token");
  if (!token) return false;
  const expected = env().ATLAS_ADMIN_TOKEN;
  return Boolean(expected) && token === expected;
}
