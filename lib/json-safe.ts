// Tolerant JSON parser used by route handlers reading `text` columns that
// store JSON arrays/objects. Returns the fallback on null/undefined/parse
// error so a corrupt row doesn't blow up the whole response.

export function safeParseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
