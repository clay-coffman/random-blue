"use client";

import type { auth } from "@/auth";
import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";

// baseURL omitted → resolves to current origin in browser. Per-worktree
// PORTs (3000 + N) are handled automatically because the client uses
// `window.location.origin`.
//
// `inferAdditionalFields<typeof auth>()` is a type-only plugin —
// `import type { auth }` doesn't drag server code into the bundle. It
// surfaces our `additionalFields.role` on the user shape returned by
// signIn / session helpers so callers don't need a `@ts-expect-error`.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), emailOTPClient()],
});

export const {
  signIn,
  signOut,
  useSession,
  getSession,
  emailOtp,
} = authClient;
