// Shared helpers for hand-rolled SQL fragments around Drizzle's
// query builder.

// `%` and `_` are LIKE wildcards in SQLite/D1; `\` is the escape
// character we use to treat them literally. Combine this helper
// with an `ESCAPE '\\'` clause on the LIKE expression so that a
// search for `100%` matches the literal "100%", not everything
// containing "100".
//
// Drizzle's `like()` doesn't expose ESCAPE — for routes that need
// it, build the fragment with `sql\`${col} LIKE ${term} ESCAPE
// '\\\\'\`` directly.
export function escapeLikeWildcards(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}
