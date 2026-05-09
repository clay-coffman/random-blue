import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getAuth } from "@/auth";
import { db } from "@/lib/db";
import { founderPassports } from "@/db/schema";

export async function GET(): Promise<never> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/me/plan");
  const role = (session.user as { role?: string }).role ?? "founder";
  if (role !== "founder") redirect("/settings");
  const [latest] = await db()
    .select({ id: founderPassports.id })
    .from(founderPassports)
    .where(eq(founderPassports.userId, session.user.id))
    .orderBy(desc(founderPassports.createdAt))
    .limit(1);
  redirect(latest ? `/plan/${latest.id}` : "/founder");
}
