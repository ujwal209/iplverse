"use server"

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { ArenaQuestionEngine } from "@/lib/arena-engine";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function createOrJoinMatch(
  roomCode: string,
  initialSettings?: {
    time_limit?: number;
    game_format?: string;
    difficulty?: string;
    max_rounds?: number;
  },
  guestSessionId?: string
) {
  let clerkId = "";
  let email = "";
  let username = "";

  const user = await currentUser();
  if (user) {
    clerkId = user.id;
    email = user.primaryEmailAddress?.emailAddress || "";
    username = user.username || `${user.firstName} ${user.lastName}`.trim() || "User";
  } else if (guestSessionId) {
    clerkId = guestSessionId;
    email = `${guestSessionId}@example.com`;
    username = `Guest_${guestSessionId.substring(6, 10).toUpperCase()}`;
  } else {
    return { error: "Not authenticated" };
  }

  const supabase = getSupabase();
  if (!supabase) return { error: "DB not configured" };

  let { data: dbUser } = await supabase.from('users').select('id').eq('clerk_id', clerkId).maybeSingle();
  
  if (!dbUser) {
    // Provision profile for guest or first time user in DB
    const { data: newUser, error: insertError } = await supabase.from('users').insert({
      clerk_id: clerkId,
      email: email,
      username: username,
      favorite_team: "Neutral",
      favorite_player: "Neutral",
      experience_level: "Medium"
    }).select('id').single();

    if (insertError) {
      console.error("Failed to insert guest/user profile:", insertError);
      return { error: "Failed to initialize user session: " + insertError.message };
    }
    dbUser = newUser;
  }

  if (!dbUser) return { error: "User profile not found" };

  // Check if room exists
  const { data: existingMatch } = await supabase
    .from('arena_matches')
    .select('*')
    .eq('room_code', roomCode)
    .single();

  if (!existingMatch) {
    // Create new room as host
    const { data: newMatch, error } = await supabase
      .from('arena_matches')
      .insert({
        room_code: roomCode,
        host_id: dbUser.id,
        status: 'waiting',
        round_number: 1,
        max_rounds: initialSettings?.max_rounds ?? 7,
        match_history: [],
        time_limit: initialSettings?.time_limit ?? 30,
        game_format: initialSettings?.game_format ?? 'mixed',
        difficulty: initialSettings?.difficulty ?? 'medium'
      })
      .select()
      .single();
    
    if (error) return { error: error.message };
    return { match: newMatch, isHost: true, serverTime: new Date().toISOString() };
  } else {
    // Join existing room
    if (existingMatch.host_id === dbUser.id) {
      return { match: existingMatch, isHost: true, serverTime: new Date().toISOString() };
    }
    
    if (existingMatch.guest_id && existingMatch.guest_id !== dbUser.id) {
      return { error: "Room is full" };
    }

    // Add guest if empty
    if (!existingMatch.guest_id) {
      const { data: updatedMatch, error } = await supabase
        .from('arena_matches')
        .update({ guest_id: dbUser.id })
        .eq('id', existingMatch.id)
        .select()
        .single();
        
      if (error) return { error: error.message };
      return { match: updatedMatch, isHost: false, serverTime: new Date().toISOString() };
    }

    return { match: existingMatch, isHost: false, serverTime: new Date().toISOString() };
  }
}

export async function updateMatchState(matchId: string, updates: any) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data } = await supabase.from('arena_matches').update(updates).eq('id', matchId).select().single();
  return { match: data, serverTime: new Date().toISOString() };
}

export async function advanceArenaState(matchId: string, newState: string, extraPayload: any = {}) {
  const supabase = getSupabase();
  if (!supabase) return;

  const updates: any = { current_state: newState, ...extraPayload };
  
  if (newState === 'countdown') {
    // 3 second countdown
    updates.countdown_expires_at = new Date(Date.now() + 3000).toISOString();
  }

  const { data } = await supabase.from('arena_matches').update(updates).eq('id', matchId).select().single();
  return { match: data, serverTime: new Date().toISOString() };
}

export async function generateNextArenaRound(matchId: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return { error: "DB not configured" };

    const { data: match } = await supabase.from('arena_matches').select('*').eq('id', matchId).single();
    if (!match) return { error: "Match not found" };

    const format = match.game_format || 'mixed';
    const difficulty = match.difficulty || 'medium';
    const historyTypes = match.match_history?.map((h: any) => h.type) || [];
    
    const round = await ArenaQuestionEngine.generateRoundForFormat(format, difficulty, historyTypes);

    const timeLimit = match.time_limit !== undefined ? match.time_limit : 30;
    const expiresAt = new Date(Date.now() + timeLimit * 1000).toISOString();

    const updates = {
      current_state: "question",
      current_question: round.questionData,
      current_round_data: round.answerData,
      round_type: round.type,
      host_answer: null,
      guest_answer: null,
      round_number: (match.round_number || 0) + 1,
      round_expires_at: expiresAt
    };

    const { data: updatedMatch, error } = await supabase
      .from('arena_matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    if (error) return { error: error.message };
    return { match: updatedMatch, round, serverTime: new Date().toISOString() };
  } catch (err: any) {
    console.error("Generate round error:", err);
    return { error: err.message || "Failed to generate round due to server error." };
  }
}

export async function saveMatchHistory(matchId: string, roundResult: any) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: match } = await supabase.from('arena_matches').select('match_history').eq('id', matchId).single();
  if (!match) return;

  const history = match.match_history || [];
  history.push(roundResult);

  await supabase.from('arena_matches').update({ match_history: history }).eq('id', matchId);
}

// Chat Server Actions
export async function sendArenaChatMessage(matchId: string, text: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();
    if (!dbUser) return { success: false, error: "User profile not found" };

    const { data: message, error } = await supabase
      .from('arena_chat_messages')
      .insert({
        match_id: matchId,
        sender_id: dbUser.id,
        message_text: text
      })
      .select(`
        id,
        match_id,
        sender_id,
        message_text,
        created_at,
        sender:sender_id (username, favorite_team)
      `)
      .single();

    if (error) throw error;
    return { success: true, message };
  } catch (err: any) {
    console.error("Send arena chat error:", err);
    return { success: false, error: err.message };
  }
}

export async function getArenaChatHistory(matchId: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: messages, error } = await supabase
      .from('arena_chat_messages')
      .select(`
        id,
        match_id,
        sender_id,
        message_text,
        created_at,
        sender:sender_id (username, favorite_team)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, messages };
  } catch (err: any) {
    console.error("Get arena chat history error:", err);
    return { success: false, error: err.message };
  }
}

export async function getMatchHistory() {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();
    if (!dbUser) return { success: false, error: "User profile not found" };

    const { data: matches, error } = await supabase
      .from('arena_matches')
      .select(`
        id,
        room_code,
        host_id,
        guest_id,
        winner_id,
        host_score,
        guest_score,
        status,
        created_at,
        time_limit,
        game_format,
        difficulty,
        max_rounds,
        match_history,
        host:host_id (username),
        guest:guest_id (username)
      `)
      .or(`host_id.eq.${dbUser.id},guest_id.eq.${dbUser.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, matches, currentUserId: dbUser.id };
  } catch (err: any) {
    console.error("Get match history error:", err);
    return { success: false, error: err.message };
  }
}

export async function requestRematch(matchId: string, isHost: boolean) {
  try {
    const supabase = getSupabase();
    if (!supabase) return { error: "DB not configured" };

    const { data: match, error: fetchErr } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (fetchErr || !match) return { error: "Match not found" };

    const updates: any = {};
    if (isHost) {
      updates.host_answer = "REMATCH";
    } else {
      updates.guest_answer = "REMATCH";
    }

    const { data: updatedMatch, error: updateErr } = await supabase
      .from('arena_matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    if (updateErr || !updatedMatch) return { error: "Failed to update rematch status" };

    if (updatedMatch.host_answer === "REMATCH" && updatedMatch.guest_answer === "REMATCH") {
      const resetUpdates = {
        current_state: "ready",
        host_score: 0,
        guest_score: 0,
        round_number: 1,
        match_history: [],
        host_answer: null,
        guest_answer: null,
        current_question: null,
        current_round_data: null,
        round_type: null,
        round_expires_at: null
      };

      const { data: finalMatch, error: resetErr } = await supabase
        .from('arena_matches')
        .update(resetUpdates)
        .eq('id', matchId)
        .select()
        .single();

      if (resetErr) return { error: resetErr.message };
      return { match: finalMatch, reset: true, serverTime: new Date().toISOString() };
    }

    return { match: updatedMatch, reset: false, serverTime: new Date().toISOString() };
  } catch (err: any) {
    console.error("requestRematch error:", err);
    return { error: err.message || "Failed to request rematch" };
  }
}

