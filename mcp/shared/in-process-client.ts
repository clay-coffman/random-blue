// In-process AtlasClient for the remote MCP route. Calls the Next.js
// App-Router route handlers as plain functions instead of round-tripping
// through fetch. Necessary because a Cloudflare Worker can't fetch its
// own custom domain (Cloudflare loops the request → 522), so the HTTP
// atlas-client doesn't work from inside `app/api/mcp/route.ts` even
// though it works fine for the CLI and the local stdio MCP.
//
// Shape-compatible with `createAtlasClient` so MCP tool/resource code
// can take either client transparently. Methods unused by the remote
// MCP surface (writes + flows that the MCP doesn't expose) throw — the
// remote MCP only registers read tools, so those throws are unreachable
// in practice.
//
// Same pattern is used by the SSR `fakeReq` calls in
// `app/{me,investors,startups}/.../page.tsx` — synthesize a Request,
// hand it to the route handler, parse the response.
//
// Self-targeted host string is functionally inert (handlers only read
// `req.url` for query params on a few routes); using a non-public
// `atlas.internal` host here makes the no-network-hop intent obvious
// in logs / stack traces.

import {
  AtlasError,
  type AtlasClient,
  type RecommendBody,
  type RecommendResponse,
  type ResourceSummary,
  type CompanySummary,
} from "@/cli/lib/atlas-client";
import { GET as listResourcesGET } from "@/app/api/v1/resources/route";
import { GET as getResourceGET } from "@/app/api/v1/resources/[id]/route";
import { GET as listCompaniesGET } from "@/app/api/v1/companies/route";
import { GET as getCompanyGET } from "@/app/api/v1/companies/[slug]/route";
import { POST as recommendPOST } from "@/app/api/v1/resources/recommend/route";

const INTERNAL_BASE = "https://atlas.internal";

function notImplemented(method: string): never {
  throw new AtlasError({
    code: "not_implemented",
    message: `${method} is not exposed via the remote MCP in-process client.`,
    status: 501,
  });
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  if (!res.ok) {
    if (isJson) {
      const body = (await res.json().catch(() => null)) as
        | { error?: { code?: string; message?: string; details?: unknown } }
        | null;
      throw new AtlasError({
        code: body?.error?.code ?? "http_error",
        message: body?.error?.message ?? `HTTP ${res.status}`,
        status: res.status,
        details: body?.error?.details,
      });
    }
    const text = await res.text().catch(() => "");
    throw new AtlasError({
      code: "http_error",
      message: text || `HTTP ${res.status}`,
      status: res.status,
    });
  }
  if (isJson) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

function buildListUrl(
  path: string,
  q?: string,
  limit?: number,
): URL {
  const url = new URL(`${INTERNAL_BASE}${path}`);
  if (q) url.searchParams.set("q", q);
  if (limit !== undefined) url.searchParams.set("limit", String(limit));
  return url;
}

export function createInProcessAtlasClient(): AtlasClient {
  return {
    baseUrl: INTERNAL_BASE,
    hasAdminToken: () => false,

    // ── Read methods used by the remote MCP ─────────────────────────
    recommend: async (body: RecommendBody) => {
      const req = new Request(`${INTERNAL_BASE}/api/v1/resources/recommend`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return unwrap<RecommendResponse>(await recommendPOST(req));
    },

    listResources: async (q?: string, limit?: number) => {
      const url = buildListUrl("/api/v1/resources", q, limit);
      return unwrap<{ resources: ResourceSummary[] }>(
        await listResourcesGET(new Request(url)),
      );
    },

    getResource: async (id: string) => {
      const req = new Request(
        `${INTERNAL_BASE}/api/v1/resources/${encodeURIComponent(id)}`,
      );
      return unwrap<{ resource: ResourceSummary }>(
        await getResourceGET(req, { params: Promise.resolve({ id }) }),
      );
    },

    listCompanies: async (q?: string, limit?: number) => {
      const url = buildListUrl("/api/v1/companies", q, limit);
      return unwrap<{ companies: CompanySummary[] }>(
        await listCompaniesGET(new Request(url)),
      );
    },

    getCompany: async (slug: string) => {
      const req = new Request(
        `${INTERNAL_BASE}/api/v1/companies/${encodeURIComponent(slug)}`,
      );
      return unwrap<{ company: Record<string, unknown> }>(
        await getCompanyGET(req, { params: Promise.resolve({ slug }) }),
      );
    },

    // ── Methods the remote MCP surface doesn't expose ──────────────
    // The remote MCP only calls registerReadTools and registerResources;
    // these stubs exist solely to satisfy the AtlasClient shape. If
    // they ever fire it means tool/resource registration changed and
    // we forgot to wire up the corresponding handler import.
    createPassport: () => notImplemented("createPassport"),
    getPlan: () => notImplemented("getPlan"),
    enrich: () => notImplemented("enrich"),
    patchCompany: () => notImplemented("patchCompany"),
    search: () => notImplemented("search"),
  };
}
