"use server";

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Ensure the user exists in the `users` table
async function ensureUser(supabase: any, clerkId: string, email?: string, username?: string) {
  const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkId).single();
  if (user) return user;

  // Create user
  const { data: newUser } = await supabase.from('users').insert({
    clerk_id: clerkId,
    email: email || '',
    username: username || `user_${Math.random().toString(36).substring(2, 8)}`,
  }).select('id').single();
  return newUser;
}

export async function getConnectionsPuzzle(type: "season_26" | "all_time" = "season_26") {
  const supabase = getSupabase();
  if (!supabase) return { error: "DB not configured" };

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("connections_puzzles")
    .select("*")
    .eq("puzzle_date", today)
    .eq("puzzle_type", type)
    .single();

  if (error || !data) {
    return { data: null, error: "No puzzle found" };
  }

  return { data };
}

export async function submitConnectionsResult(puzzleId: string, mistakes: number, won: boolean, timeTaken: number, history: string[][]) {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = getSupabase();
  if (!supabase) return { error: "DB not configured" };

  const dbUser = await ensureUser(supabase, user.id, user.primaryEmailAddress?.emailAddress, user.username || user.firstName || "");
  if (!dbUser) return { error: "User not found" };

  const { data, error } = await supabase
    .from("connections_results")
    .insert({
      user_id: dbUser.id,
      puzzle_id: puzzleId,
      mistakes,
      won,
      time_taken: timeTaken,
      history
    })
    .select()
    .single();

  if (error) {
    // If unique constraint violated, it means they already played
    if (error.code === '23505') {
      return { error: "Already played today" };
    }
    return { error: error.message };
  }
  
  revalidatePath('/dashboard/games/connections');
  return { success: true, result: data };
}

export async function seedConnectionsPuzzle(type: "season_26" | "all_time", categories: any[]) {
  const supabase = getSupabase();
  if (!supabase) return { error: "DB not configured" };

  const today = new Date().toISOString().split("T")[0];

  // Upsert
  const { data, error } = await supabase
    .from("connections_puzzles")
    .upsert({
      puzzle_date: today,
      puzzle_type: type,
      categories
    }, { onConflict: 'puzzle_date,puzzle_type' })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, puzzle: data };
}
