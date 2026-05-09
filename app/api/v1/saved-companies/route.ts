import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, investorProfiles, savedCompanies } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { authorizeSessionWrite, getApiSession } from "@/lib/auth-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PostBodySchema = z.object({
  company_id: z.string().regex(/^co_[a-z0-9]+$/, "Expected co_ id."),
  note: z.string().max(1000).nullable().optional(),
});

const PatchBodySchema = z.object({
  company_id: z.string().regex(/^co_[a-z0-9]+$/),
  note: z.string().max(1000).nullable(),
});

async function getOwnInvestorId(userId: string): Promise<string | null> {
  const [row] = await db()
    .select({ id: investorProfiles.id })
    .from(investorProfiles)
    .where(eq(investorProfiles.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

export async function POST(req: Request) {
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const investorId = await getOwnInvestorId(auth.user.id);
  if (!investorId) {
    return errorResponse(
      "forbidden",
      "Investor profile required.",
      403,
    );
  }
  const raw = await req.json().catch(() => null);
  const parsed = PostBodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid save request.",
      400,
      parsed.error.flatten(),
    );
  }
  const body = parsed.data;

  // Verify the company exists.
  const [company] = await db()
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, body.company_id))
    .limit(1);
  if (!company) {
    return errorResponse("not_found", "Company not found.", 404);
  }

  try {
    const [inserted] = await db()
      .insert(savedCompanies)
      .values({
        investorId,
        companyId: body.company_id,
        note: body.note ?? null,
        savedAt: new Date(),
      })
      .returning({ id: savedCompanies.id });
    return NextResponse.json(
      { id: inserted.id, status: "created" },
      { status: 201 },
    );
  } catch (err) {
    // UNIQUE-violation surfaces as a SQL error; D1 doesn't expose a
    // typed error code, so we match on the generic "UNIQUE" substring.
    const message = err instanceof Error ? err.message : String(err);
    if (/UNIQUE/i.test(message)) {
      return errorResponse("conflict", "Already saved.", 409);
    }
    throw err;
  }
}

export async function DELETE(req: Request) {
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const investorId = await getOwnInvestorId(auth.user.id);
  if (!investorId) {
    return errorResponse("forbidden", "Investor profile required.", 403);
  }
  const url = new URL(req.url);
  const companyId = url.searchParams.get("company_id");
  if (!companyId || !/^co_[a-z0-9]+$/.test(companyId)) {
    return errorResponse("bad_request", "company_id query param required.", 400);
  }
  const result = await db()
    .delete(savedCompanies)
    .where(
      and(
        eq(savedCompanies.investorId, investorId),
        eq(savedCompanies.companyId, companyId),
      ),
    )
    .returning({ id: savedCompanies.id });
  if (result.length === 0) {
    return errorResponse("not_found", "Not saved.", 404);
  }
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: Request) {
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const investorId = await getOwnInvestorId(auth.user.id);
  if (!investorId) {
    return errorResponse("forbidden", "Investor profile required.", 403);
  }
  const raw = await req.json().catch(() => null);
  const parsed = PatchBodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid patch.",
      400,
      parsed.error.flatten(),
    );
  }
  const result = await db()
    .update(savedCompanies)
    .set({ note: parsed.data.note })
    .where(
      and(
        eq(savedCompanies.investorId, investorId),
        eq(savedCompanies.companyId, parsed.data.company_id),
      ),
    )
    .returning({ id: savedCompanies.id });
  if (result.length === 0) {
    return errorResponse("not_found", "Not saved.", 404);
  }
  return NextResponse.json({ id: result[0].id, status: "updated" });
}

export async function GET(req: Request) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);

  const investorId = await getOwnInvestorId(session.user.id);
  if (!investorId) {
    return NextResponse.json({ saved: [] });
  }

  const rows = await db()
    .select({
      id: savedCompanies.id,
      note: savedCompanies.note,
      savedAt: savedCompanies.savedAt,
      companyId: companies.id,
      companySlug: companies.slug,
      companyName: companies.name,
      companySector: companies.sector,
      companyStage: companies.stage,
      companyLogoUrl: companies.logoUrl,
    })
    .from(savedCompanies)
    .leftJoin(companies, eq(savedCompanies.companyId, companies.id))
    .where(eq(savedCompanies.investorId, investorId))
    .orderBy(desc(savedCompanies.savedAt));

  return NextResponse.json({
    saved: rows.map((r) => ({
      id: r.id,
      saved_at: r.savedAt ? r.savedAt.toISOString?.() ?? null : null,
      note: r.note,
      company: r.companyId
        ? {
            id: r.companyId,
            slug: r.companySlug,
            name: r.companyName,
            sector: r.companySector,
            stage: r.companyStage,
            logo_url: r.companyLogoUrl,
          }
        : null,
    })),
  });
}
