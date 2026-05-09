// Shared helpers for hand-rolled SQL fragments around Drizzle's
// query builder.

// `%` and `_` are LIKE wildcards in SQLite/D1; `\` is the escape
// character we'd need to introduce to handle them. Easiest defense
// for free-text search inputs is to strip these characters so the
// search behaves as a substring match, not a glob. Drizzle still
// parameterises the bound value (no SQL injection); this is a
// correctness defense — a search for `100%` should match the literal
// "100%", not everything containing "100".
export function stripLikeWildcards(s: string): string {
  return s.replace(/[%_\\]/g, "");
}
