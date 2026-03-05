import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Returns the authenticated user's ID, or null if not signed in. */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Returns the authenticated user object, or null if not signed in. */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
