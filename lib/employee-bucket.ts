// Parse + compare the bucket strings stored in companies.employee_count.
// CSV vocabulary observed: "1-10", "2-10", "11-50", "51-200", "201-500",
// "501-1K", "1K-5K", "5K+", and free-text fallback. The filter UI sends
// either a bucket string ("11-50") or a numeric range
// ({min, max}) — both modes intersect against the row's bucket.

export type NumericRange = { min: number; max: number };

const K = 1000;

/**
 * Parse a bucket string (e.g. "11-50", "1K-5K", "501-1K", "5K+") to a
 * numeric `{min, max}` range. `max` is `Infinity` for open-ended buckets
 * like "5K+" or "1K+". Returns null if the string isn't recognizable —
 * caller should treat as "matches everything" (don't filter the row out).
 */
export function parseBucket(bucket: string | null | undefined): NumericRange | null {
  if (!bucket) return null;
  const trimmed = bucket.trim();
  if (!trimmed) return null;

  // Open-ended bucket: "5K+", "1K+", "1000+", etc.
  const openEnded = trimmed.match(/^([\d.]+)(K)?\+$/i);
  if (openEnded) {
    const n = parseFloat(openEnded[1]) * (openEnded[2] ? K : 1);
    return { min: n, max: Number.POSITIVE_INFINITY };
  }

  // Range: "11-50", "201-500", "1K-5K", "501-1K"
  const range = trimmed.match(/^([\d.]+)(K)?\s*[-–]\s*([\d.]+)(K)?$/i);
  if (range) {
    const min = parseFloat(range[1]) * (range[2] ? K : 1);
    const max = parseFloat(range[3]) * (range[4] ? K : 1);
    return { min, max };
  }

  // Single number: "10", "100"
  const single = trimmed.match(/^([\d.]+)(K)?$/i);
  if (single) {
    const n = parseFloat(single[1]) * (single[2] ? K : 1);
    return { min: n, max: n };
  }

  return null;
}

/**
 * Does the row's bucket intersect with the filter range? Used when the
 * filter UI sends `min_employees=11&max_employees=100`. Numeric overlap
 * = `min ≤ rowMax && max ≥ rowMin`.
 */
export function bucketMatchesRange(
  rowBucket: string | null | undefined,
  filterMin: number | null | undefined,
  filterMax: number | null | undefined,
): boolean {
  // No filter = match.
  if (filterMin == null && filterMax == null) return true;
  const row = parseBucket(rowBucket);
  // Unknown bucket = don't filter out (defensive — better to show than
  // hide). Falls back to "include" so partial CSV vocabulary still
  // shows up under range filters.
  if (!row) return true;
  const min = filterMin ?? Number.NEGATIVE_INFINITY;
  const max = filterMax ?? Number.POSITIVE_INFINITY;
  return min <= row.max && max >= row.min;
}

/**
 * Does the row's bucket match the filter bucket? Used when the filter UI
 * sends a bucket directly (e.g. `?employee_bucket=11-50`). Both buckets
 * are parsed and compared as numeric ranges so "11-50" overlaps with
 * "51-200" if a user picks ambiguous neighbouring brackets — though in
 * practice the dropdown will send exact strings.
 */
export function bucketMatchesBucket(
  rowBucket: string | null | undefined,
  filterBucket: string | null | undefined,
): boolean {
  if (!filterBucket) return true;
  const f = parseBucket(filterBucket);
  if (!f) return true;
  return bucketMatchesRange(rowBucket, f.min, f.max);
}

/** Mid-point of the bucket (for heatmap weighting). Open-ended → `min * 1.5`. */
export function bucketMidpoint(bucket: string | null | undefined): number {
  const r = parseBucket(bucket);
  if (!r) return 0;
  if (!Number.isFinite(r.max)) return r.min * 1.5;
  return (r.min + r.max) / 2;
}

/** Stable sort order for filter dropdown (small → large). */
export const BUCKET_PRESETS = [
  "1-10",
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1K",
  "1K-5K",
  "5K+",
] as const;
