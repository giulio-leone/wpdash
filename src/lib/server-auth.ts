import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

/** Shared discriminated union for server action results. */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

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
