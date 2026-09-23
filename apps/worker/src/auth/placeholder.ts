import type { Context } from "hono";

import type { AppBindings } from "../types";

export interface AuthedUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Auth is deferred for v1. Every request resolves to the seeded `dev-user`.
 * The seam is here: swap this implementation for Google OIDC session
 * verification and callers keep working unchanged.
 */
export const DEV_USER_ID = "dev-user";

const DEV_USER: AuthedUser = {
  id: DEV_USER_ID,
  email: "dev@shila.local",
  displayName: "Dev User",
};

export async function resolveUser(_c: Context<AppBindings>): Promise<AuthedUser> {
  return DEV_USER;
}
