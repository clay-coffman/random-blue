// Plain-Node HTTP client for the Startup State Atlas API. Shared
// between the CLI (`startup-state`) and the stdio MCP server
// (`startup-state-mcp`).
//
// IMPORTANT: this module must NOT import from `@/lib/*` — that path
// pulls in `lib/cf.ts` which transitively imports
// `@opennextjs/cloudflare`, which doesn't run outside the Worker.
// Keep this client free of Cloudflare-specific dependencies.

export type AtlasClientOptions = {
  baseUrl?: string;
  adminToken?: string;
  fetchImpl?: typeof fetch;
};

export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown };
};

export class AtlasError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(opts: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
  }) {
    super(opts.message);
    this.name = "AtlasError";
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
  }
}

export type RecommendBody = {
  passport_id?: string;
  county?: string;
  city?: string;
  stage?: string;
  industry?: string;
  goal?: string;
  urgency?: string;
  business_size?: string;
  business_type?: string;
  communities?: string[];
  needs?: string[];
  constraints?: string[];
  website_url?: string;
};

export type RecommendedResource = {
  resource_id: string;
  title: string;
  score: number;
  bucket: "now" | "next" | "ignore";
  reasons: string[];
  because: string;
  action_text: string;
  kind?: string;
  source_url?: string;
  contact_email?: string;
};

export type RecommendResponse = {
  passport_id: string;
  recommendations: RecommendedResource[];
  generated_at: string;
};

export type ResourceSummary = {
  id: string;
  title: string;
  description?: string | null;
  kind?: string | null;
  source_url?: string | null;
  contact_email?: string | null;
};

export type CompanySummary = {
  id: string;
  slug: string;
  name: string;
  website?: string | null;
  sector?: string | null;
  stage?: string | null;
  employee_count?: string | null;
  city?: string | null;
  county?: string | null;
  status: "claimed" | "pending" | "unclaimed";
};

export type SearchResult = {
  kind: "resource" | "company";
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  score: number;
};

export type EnrichField = {
  name: string;
  value: unknown;
  confidence: number;
};

export type EnrichResponse = {
  fields: EnrichField[];
  degraded?: boolean;
};

export function createAtlasClient(opts: AtlasClientOptions = {}) {
  const baseUrl = (
    opts.baseUrl ??
    process.env.STARTUP_STATE_API_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const adminToken = opts.adminToken ?? process.env.ATLAS_ADMIN_TOKEN ?? "";
  const fetchImpl = opts.fetchImpl ?? fetch;

  async function request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      requireAdmin?: boolean;
    } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (options.requireAdmin) {
      if (!adminToken) {
        throw new AtlasError({
          code: "missing_admin_token",
          message:
            "Set ATLAS_ADMIN_TOKEN in your environment to call write endpoints.",
          status: 0,
        });
      }
      headers["X-Atlas-Admin-Token"] = adminToken;
    } else if (adminToken) {
      // Send the token on read calls too — harmless and lets reviewers
      // see the same headers across the surface.
      headers["X-Atlas-Admin-Token"] = adminToken;
    }

    const url = new URL(baseUrl + path);
    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined && v !== "") {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const res = await fetchImpl(url.toString(), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : null,
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (res.status === 204) {
      return undefined as T;
    }
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      if (isJson) {
        const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
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

    if (isJson) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  }

  return {
    baseUrl,
    hasAdminToken: () => Boolean(adminToken),

    // Founder passports + recommendations
    createPassport: (body: RecommendBody) =>
      request<{ passport_id: string }>("POST", "/api/v1/founder-passports", {
        body,
      }),
    getPlan: (id: string) =>
      request<RecommendResponse>(
        "GET",
        `/api/v1/founder-passports/${encodeURIComponent(id)}/plan`,
      ),
    recommend: (body: RecommendBody) =>
      request<RecommendResponse>("POST", "/api/v1/resources/recommend", {
        body,
      }),
    enrich: (websiteUrl: string) =>
      request<EnrichResponse>("POST", "/api/v1/founder-passports/enrich", {
        body: { website_url: websiteUrl },
      }),

    // Resources
    listResources: (q?: string, limit?: number) =>
      request<{ resources: ResourceSummary[] }>("GET", "/api/v1/resources", {
        query: { q, limit },
      }),
    getResource: (id: string) =>
      request<{ resource: ResourceSummary }>(
        "GET",
        `/api/v1/resources/${encodeURIComponent(id)}`,
      ),

    // Companies
    listCompanies: (q?: string, limit?: number) =>
      request<{ companies: CompanySummary[] }>("GET", "/api/v1/companies", {
        query: { q, limit },
      }),
    getCompany: (slug: string) =>
      request<{ company: Record<string, unknown> }>(
        "GET",
        `/api/v1/companies/${encodeURIComponent(slug)}`,
      ),
    patchCompany: (slug: string, patch: Record<string, unknown>) =>
      request<{ company: Record<string, unknown> }>(
        "PATCH",
        `/api/v1/companies/${encodeURIComponent(slug)}`,
        { body: patch, requireAdmin: true },
      ),

    // Generic search
    search: (q: string, type: "all" | "resources" | "companies" = "all", limit?: number) =>
      request<{ results: SearchResult[] }>("GET", "/api/v1/search", {
        query: { q, type, limit },
      }),
  };
}

export type AtlasClient = ReturnType<typeof createAtlasClient>;
