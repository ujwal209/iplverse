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

// ---- Leaderboard ----

export async function getGlobalLeaderboard() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("users")
    .select("username, total_points, current_streak")
    .order("total_points", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Leaderboard Error:", error);
    return [];
  }

  return data;
}

// ---- Community XIs ----

export async function getCommunityXIs() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("community_xis")
    .select(`
      id,
      title,
      players,
      upvotes,
      users ( username )
    `)
    .order("upvotes", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Fetch XIs Error:", error);
    return [];
  }

  return data;
}

export async function getTopCreators() {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Get users who have created XIs, we can approximate by joining
  // Or just query community_xis and group by user_id
  const { data, error } = await supabase
    .from("community_xis")
    .select("users ( username ), upvotes");

  if (error) {
    console.error("Top Creators Error:", error);
    return [];
  }

  const creatorMap: Record<string, { username: string, total_upvotes: number, xi_count: number }> = {};
  
  data?.forEach(xi => {
    const uname = (xi.users as any)?.username || "Unknown";
    if (!creatorMap[uname]) {
      creatorMap[uname] = { username: uname, total_upvotes: 0, xi_count: 0 };
    }
    creatorMap[uname].total_upvotes += (xi.upvotes || 0);
    creatorMap[uname].xi_count += 1;
  });

  const creators = Object.values(creatorMap)
    .sort((a, b) => b.total_upvotes - a.total_upvotes)
    .slice(0, 10);

  return creators;
}

export async function createCommunityXI(title: string, players: any[]) {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = getSupabase();
  if (!supabase) return { error: "DB not configured" };

  const { data: dbUser } = await supabase.from('users').select('id').eq('clerk_id', user.id).single();
  if (!dbUser) return { error: "User not found" };

  const { data, error } = await supabase
    .from("community_xis")
    .insert({
      user_id: dbUser.id,
      title,
      players,
      upvotes: 0
    })
    .select()
    .single();

  if (error) return { error: error.message };
  
  revalidatePath('/dashboard/community');
  return { success: true, xi: data };
}

export async function toggleVoteXI(xiId: string) {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = getSupabase();
  if (!supabase) return { error: "DB not configured" };

  const { data: dbUser } = await supabase.from('users').select('id').eq('clerk_id', user.id).single();
  if (!dbUser) return { error: "User not found" };

  // Check if voted
  const { data: existingVote } = await supabase
    .from("xi_votes")
    .select("*")
    .eq("xi_id", xiId)
    .eq("user_id", dbUser.id)
    .single();

  if (existingVote) {
    // Remove vote
    await supabase.from("xi_votes").delete().eq("id", existingVote.id);
    // Decrement upvotes (atomic via RPC or simple read-write)
    const { data: xi } = await supabase.from("community_xis").select("upvotes").eq("id", xiId).single();
    if (xi) {
      await supabase.from("community_xis").update({ upvotes: Math.max(0, xi.upvotes - 1) }).eq("id", xiId);
    }
  } else {
    // Add vote
    await supabase.from("xi_votes").insert({
      xi_id: xiId,
      user_id: dbUser.id,
      vote_type: 1
    });
    // Increment upvotes
    const { data: xi } = await supabase.from("community_xis").select("upvotes").eq("id", xiId).single();
    if (xi) {
      await supabase.from("community_xis").update({ upvotes: xi.upvotes + 1 }).eq("id", xiId);
    }
  }

  revalidatePath('/dashboard/community');
  return { success: true };
}
