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

const GROQ_API_KEYS = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "fallback").split(",").map(k => k.trim()).filter(Boolean);
let groqIndex = 0;

export async function getConnectionsPuzzle(type: "season_26" | "all_time" = "season_26") {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  if (supabase) {
    const { data, error } = await supabase
      .from("connections_puzzles")
      .select("*")
      .eq("puzzle_date", today)
      .eq("puzzle_type", type)
      .single();

    if (data && !error) {
      return { data };
    }
  }

  // No puzzle in DB today, generate via Groq
  let categories: any[] = [];
  const maxAttempts = GROQ_API_KEYS.length;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const groqKey = GROQ_API_KEYS[groqIndex];
      groqIndex = (groqIndex + 1) % GROQ_API_KEYS.length;

      const focusText = type === "season_26"
        ? "recent IPL seasons (IPL 2024-2026 squads, transfers, records, and players)"
        : "all-time IPL history (2008 to present, legendary players, iconic records)";

      const groqPrompt = `You are a cricket trivia master. Generate an IPL Connections Puzzle.
The puzzle consists of 4 categories of different difficulty levels: 1 (yellow, easiest), 2 (green, medium), 3 (blue, hard), 4 (purple, trickiest/wordplay).
Each category must have a distinct connection title and exactly 4 related IPL cricketers, venues, teams, or terms as items.
CRITICAL RULES:
1. All 16 items across all categories MUST be completely unique and distinct. There must be no duplicate items.
2. Focus on: ${focusText}.
3. Items must be short (usually 1-3 words, e.g. player names, team names, or venues).
4. Do not include duplicate names in different formats (e.g. don't have both "MS Dhoni" and "Mahendra Singh Dhoni").

Respond ONLY with a raw JSON object in this format:
{
  "categories": [
    {
      "id": "cat_1",
      "title": "Category Title",
      "difficulty": 1,
      "items": ["Item1", "Item2", "Item3", "Item4"]
    },
    {
      "id": "cat_2",
      "title": "Category Title",
      "difficulty": 2,
      "items": ["Item5", "Item6", "Item7", "Item8"]
    },
    {
      "id": "cat_3",
      "title": "Category Title",
      "difficulty": 3,
      "items": ["Item9", "Item10", "Item11", "Item12"]
    },
    {
      "id": "cat_4",
      "title": "Category Title",
      "difficulty": 4,
      "items": ["Item13", "Item14", "Item15", "Item16"]
    }
  ]
}`;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a strict JSON generator." },
            { role: "user", content: groqPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content || '{"categories":[]}';
        const parsed = JSON.parse(content);
        if (parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length === 4) {
          categories = parsed.categories;
          break;
        }
      }
    } catch (apiErr) {
      console.error("AI Connections generation error on attempt:", apiErr);
    }
  }

  if (categories.length === 4) {
    if (supabase) {
      try {
        const { data: insertedData } = await supabase
          .from("connections_puzzles")
          .upsert({
            puzzle_date: today,
            puzzle_type: type,
            categories
          }, { onConflict: 'puzzle_date,puzzle_type' })
          .select()
          .single();

        if (insertedData) {
          return { data: insertedData };
        }
      } catch (dbErr) {
        console.error("Failed to seed newly generated connections puzzle:", dbErr);
      }
    }
    return {
      data: {
        id: `groq-${today}-${type}`,
        puzzle_date: today,
        puzzle_type: type,
        categories
      }
    };
  }

  return { data: null, error: "Failed to load or generate connections puzzle today." };
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
