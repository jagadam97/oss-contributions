import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client — uses anon key + session from localStorage.
// Auth actions (signIn, signOut) and authenticated writes use this client.
let client: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Supabase env vars not set");

  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}
