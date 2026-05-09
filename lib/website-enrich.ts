// Founder-website enrich: fetches the URL directly, strips HTML to text,
// hands the result to Anthropic with a structured-output prompt, and
// returns the partial FounderPassportInput shape.
//
// Originally planned around Parallel.ai's Search/Extract endpoints, but
// Parallel's Search API doesn't return structured data and the Task API
// is async (5–60+s typical) — both blow the form-UX latency budget.
// The fetch+LLM path is cheaper, faster (~5–10s), and stays inside the
// 30s Worker CPU budget.
//
// Failure semantics: NEVER throws. Returns
// `{ degraded: true, fields: {} }` on fetch error, timeout, parse
// failure, or denylist match. The endpoint can pass it straight
// through to the form, which then quietly falls back to manual fill.

import { z } from "zod";
import { ANTHROPIC_MODEL, anthropic, cachedSystem } from "./anthropic";
import type { EnrichResponse } from "@/types/api";

const FETCH_TIMEOUT_MS = 8_000;
const LLM_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 256 * 1024; // truncate at 256KB to keep payloads sane
const MAX_TEXT_CHARS = 12_000; // budget passed to Anthropic

// Strict schema for the LLM's structured output.
const ExtractedFields = z.object({
  industry: z.string().nullable().optional(),
  stage: z
    .enum([
      "idea",
      "pre_seed",
      "mvp",
      "paying_customers",
      "growth",
      "mature",
    ])
    .nullable()
    .optional(),
  city: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  business_type: z.string().nullable().optional(),
  needs: z.array(z.string()).nullable().optional(),
});
type Extracted = z.infer<typeof ExtractedFields>;

const SYSTEM_PROMPT = `You read a Utah-area company's website and extract structured profile fields.
Return ONLY a single JSON object matching this exact shape (no prose, no code fences):
{
  "industry": string | null,         // GOED canonical, e.g. "Software and Information Technology", "Life Sciences and Healthcare", "Financial Services", "Aerospace and Defense", "Manufacturing", "Agriculture", "Energy and Natural Resources", "Outdoor Recreation", "Tourism", "Education"
  "stage": "idea" | "pre_seed" | "mvp" | "paying_customers" | "growth" | "mature" | null,
  "city": string | null,             // e.g. "Lehi"
  "county": string | null,           // Utah county name, e.g. "Utah", "Salt Lake", "Washington"
  "business_type": string | null,    // colloquial, e.g. "B2B SaaS", "FinTech", "Medical Device"
  "needs": string[] | null           // 0–4 short tags, e.g. ["customers", "talent", "funding"]
}
Use null when the website doesn't make a value clear. Do not invent data.`;

function degraded(url: string): EnrichResponse {
  return {
    fields: {},
    source_url: url,
    fetched_at: Date.now(),
    degraded: true,
  };
}

// Crude HTML → text: strip script/style/noscript blocks first (so their
// inner JS/CSS doesn't pollute the prompt), then strip all remaining tags,
// then collapse whitespace. Cap output to MAX_TEXT_CHARS.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; StartupStateAtlasBot/1.0; +https://startup.utah.gov)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml/.test(ct)) return null;

    // Read at most MAX_HTML_BYTES to avoid OOM on huge pages.
    const reader = res.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder();
    let html = "";
    let received = 0;
    while (received < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (html.length > MAX_HTML_BYTES) break;
    }
    return htmlToText(html);
  } catch {
    return null;
  }
}

async function extractWithLLM(
  url: string,
  pageText: string,
): Promise<Extracted | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const client = anthropic();
    const response = await client.messages.create(
      {
        model: ANTHROPIC_MODEL,
        max_tokens: 600,
        system: cachedSystem(SYSTEM_PROMPT),
        messages: [
          {
            role: "user",
            content: [
              `<url>${url}</url>`,
              "<page_text>",
              pageText,
              "</page_text>",
            ].join("\n"),
          },
        ],
      },
      { signal: controller.signal },
    );

    const text = response.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = ExtractedFields.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// LLM-derived fields all carry a single fixed "from-LLM" confidence — we
// don't have per-field signal here. The front-end displays "filled from
// your site" chips uniformly; the founder reviews + edits before submit.
const LLM_CONFIDENCE = 0.7;

export async function enrichWebsite(url: string): Promise<EnrichResponse> {
  const pageText = await fetchPageText(url);
  if (!pageText || pageText.length < 200) {
    // Page didn't fetch cleanly or had effectively no content — degrade.
    return degraded(url);
  }
  const extracted = await extractWithLLM(url, pageText);
  if (!extracted) return degraded(url);

  const fields: EnrichResponse["fields"] = {};
  for (const [k, v] of Object.entries(extracted)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    fields[k] = { value: v, confidence: LLM_CONFIDENCE };
  }

  return {
    fields,
    source_url: url,
    fetched_at: Date.now(),
  };
}
