"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// baseURL omitted → resolves to current origin in browser. Per-worktree
// PORTs (3000 + N) are handled automatically because the client uses
// `window.location.origin`.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  emailOtp,
  forgetPassword,
  resetPassword,
} = authClient;
