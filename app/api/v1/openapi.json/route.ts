import { NextResponse } from "next/server";
import spec from "../_openapi-spec.json";

// Static spec — no D1 / env access needed. Runs on the edge, same
// runtime as the rest of /api/v1/.

export function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
