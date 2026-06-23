import { createClient } from "@supabase/supabase-js";

// Ensure you set these in your .env.local
// We use fallback placeholders here so the Next.js dev server doesn't crash 
// if you haven't added your keys to .env.local yet.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";

// A utility to create a Supabase client.
export const supabase = createClient(supabaseUrl, supabaseKey);

export function createClerkSupabaseClient(clerkToken: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  });
}
