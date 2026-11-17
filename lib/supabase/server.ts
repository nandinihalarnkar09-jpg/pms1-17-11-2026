import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * The client used for almost every query.
 *
 * It sends the signed-in user's Clerk session token to Supabase. Supabase
 * verifies the token (Clerk is set up as a "third-party auth" provider) and
 * then applies the Row Level Security policies in supabase/02_security.sql.
 * So this client can only ever see and change what the current user is
 * allowed to, even if our own code has a bug.
 */
export function createUserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
}
