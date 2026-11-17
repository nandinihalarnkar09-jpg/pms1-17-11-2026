import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * A client with the SECRET (service role) key. It BYPASSES Row Level Security.
 *
 * It is used for exactly one job: on someone's first sign-in, find their
 * employee row by email and save their Clerk user id on it. Before that link
 * exists, RLS cannot recognise them, so the normal client would see nothing.
 *
 * "server-only" makes the build fail if this file is ever imported into code
 * that runs in the browser, so the secret key can never leak there.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
