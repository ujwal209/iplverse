"use server"

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// 1. Get internal user ID by Clerk user ID
export async function getDbUser() {
  const user = await currentUser();
  if (!user) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', user.id)
    .maybeSingle();

  return dbUser;
}

// 2. Search users fuzzy by username (to add friends)
export async function searchUsers(query: string) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    // Find users match query, excluding self
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, favorite_team')
      .neq('id', dbUser.id)
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return { success: true, users };
  } catch (err: any) {
    console.error("Search users error:", err);
    return { success: false, error: err.message };
  }
}

// 3. Send friend request
export async function sendFriendRequest(targetUsername: string) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    // Resolve target user
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', targetUsername)
      .single();

    if (targetError || !targetUser) {
      return { success: false, error: "User not found" };
    }

    if (targetUser.id === dbUser.id) {
      return { success: false, error: "You cannot add yourself as a friend" };
    }

    // Check if friendship or request already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${dbUser.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${dbUser.id})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return { success: false, error: "You are already friends with this user" };
      }
      return { success: false, error: "A friend request is already pending between you" };
    }

    // Insert friendship row (pending)
    const { error: insertError } = await supabase
      .from('friendships')
      .insert({
        user_id: dbUser.id,
        friend_id: targetUser.id,
        status: 'pending'
      });

    if (insertError) throw insertError;
    return { success: true };
  } catch (err: any) {
    console.error("Send friend request error:", err);
    return { success: false, error: err.message };
  }
}

// 4. Respond to friend request (accept/decline)
export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    if (accept) {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .or(`user_id.eq.${dbUser.id},friend_id.eq.${dbUser.id}`); // Security check

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)
        .or(`user_id.eq.${dbUser.id},friend_id.eq.${dbUser.id}`); // Security check

      if (error) throw error;
    }

    revalidatePath("/dashboard/lobby");
    return { success: true };
  } catch (err: any) {
    console.error("Respond to friend request error:", err);
    return { success: false, error: err.message };
  }
}

// 5. Get friends list (including pending status)
export async function getFriendsList() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    // Fetch all friendship records
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        user_id,
        friend_id,
        created_at,
        users_initiator:user_id (id, username, favorite_team, total_points),
        users_receiver:friend_id (id, username, favorite_team, total_points)
      `)
      .or(`user_id.eq.${dbUser.id},friend_id.eq.${dbUser.id}`);

    if (error) throw error;

    const friends: any[] = [];
    const pendingIncoming: any[] = [];
    const pendingOutgoing: any[] = [];

    friendships?.forEach((f: any) => {
      const isInitiator = f.user_id === dbUser.id;
      const otherUser = isInitiator ? f.users_receiver : f.users_initiator;

      if (!otherUser) return;

      const profile = {
        friendshipId: f.id,
        id: otherUser.id,
        username: otherUser.username,
        favoriteTeam: otherUser.favorite_team,
        points: otherUser.total_points || 0,
        createdAt: f.created_at
      };

      if (f.status === 'accepted') {
        friends.push(profile);
      } else if (f.status === 'pending') {
        if (isInitiator) {
          pendingOutgoing.push(profile);
        } else {
          pendingIncoming.push(profile);
        }
      }
    });

    return { success: true, friends, pendingIncoming, pendingOutgoing, currentUserId: dbUser.id };
  } catch (err: any) {
    console.error("Get friends error:", err);
    return { success: false, error: err.message };
  }
}

// 6. Send direct message
export async function sendDirectMessage(receiverId: string, text: string) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: message, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: dbUser.id,
        receiver_id: receiverId,
        message_text: text,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, message };
  } catch (err: any) {
    console.error("Send DM error:", err);
    return { success: false, error: err.message };
  }
}

// 7. Get message logs between user and a friend
export async function getDirectMessages(friendId: string) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    // Fetch messages between current user and friend
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${dbUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${dbUser.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark incoming messages as read
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', dbUser.id)
      .eq('is_read', false);

    return { success: true, messages };
  } catch (err: any) {
    console.error("Get DMs error:", err);
    return { success: false, error: err.message };
  }
}

// 8. Create a game challenge
export async function createGameChallenge(challengedId: string, gameType: string) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    // Cancel any previous pending challenges between them
    await supabase
      .from('game_challenges')
      .update({ status: 'expired' })
      .eq('challenger_id', dbUser.id)
      .eq('challenged_id', challengedId)
      .eq('status', 'pending');

    const { data: challenge, error } = await supabase
      .from('game_challenges')
      .insert({
        challenger_id: dbUser.id,
        challenged_id: challengedId,
        game_type: gameType,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, challenge };
  } catch (err: any) {
    console.error("Create challenge error:", err);
    return { success: false, error: err.message };
  }
}

// 9. Respond to a challenge (accept/decline)
export async function respondToChallenge(challengeId: string, accept: boolean) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    // Fetch challenge detail
    const { data: challenge, error: fetchErr } = await supabase
      .from('game_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (fetchErr || !challenge) return { success: false, error: "Challenge not found" };

    if (challenge.challenged_id !== dbUser.id) {
      return { success: false, error: "Unauthorized response" };
    }

    if (challenge.status !== 'pending') {
      return { success: false, error: `Challenge is already ${challenge.status}` };
    }

    if (accept) {
      // Create random unique room code
      const roomCode = `match_${Math.floor(100000 + Math.random() * 900000)}`;

      // Create match room
      const { error: matchErr } = await supabase
        .from('arena_matches')
        .insert({
          room_code: roomCode,
          host_id: challenge.challenger_id,
          guest_id: dbUser.id,
          status: 'waiting',
          game_format: challenge.game_type,
          round_number: 1,
          max_rounds: 7,
          match_history: [],
          current_state: 'waiting'
        });

      if (matchErr) throw matchErr;

      // Update challenge status
      const { error: updateErr } = await supabase
        .from('game_challenges')
        .update({
          status: 'accepted',
          room_code: roomCode
        })
        .eq('id', challengeId);

      if (updateErr) throw updateErr;

      return { success: true, roomCode };
    } else {
      // Update challenge status to declined
      const { error } = await supabase
        .from('game_challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      if (error) throw error;
      return { success: true };
    }
  } catch (err: any) {
    console.error("Respond challenge error:", err);
    return { success: false, error: err.message };
  }
}

// 10. Get user profile details by ID
export async function getUserProfile(userId: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('id, username, favorite_team, total_points')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("GetUserProfile error:", err);
    return null;
  }
}

// 11. Update user profile details
export async function updateUserProfile(formData: {
  username: string;
  favorite_team: string;
  favorite_player: string;
  experience_level: string;
}) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    // Basic Validation
    const usernameClean = formData.username.trim();
    if (usernameClean.length < 3) {
      return { success: false, error: "Username must be at least 3 characters long" };
    }

    // Check username uniqueness if it changed
    if (usernameClean.toLowerCase() !== dbUser.username.toLowerCase()) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('username', usernameClean)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: "Username is already taken" };
      }
    }

    // Update public.users
    const { error: updateError } = await supabase
      .from('users')
      .update({
        username: usernameClean,
        favorite_team: formData.favorite_team,
        favorite_player: formData.favorite_player,
        experience_level: formData.experience_level,
      })
      .eq('id', dbUser.id);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err: any) {
    console.error("Update profile error:", err);
    return { success: false, error: err.message };
  }
}

// ==========================================
// Community XIs
// ==========================================

export async function createCommunityXi(title: string, players: any[]) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    if (!title || players.length !== 11) {
      return { success: false, error: "Must provide a title and exactly 11 players." };
    }

    const { data: xi, error } = await supabase
      .from('community_xis')
      .insert({
        user_id: dbUser.id,
        title: title,
        players: players, // jsonb array of player data
        upvotes: 0,
        downvotes: 0
      })
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath("/dashboard/community");
    return { success: true, xi };
  } catch (err: any) {
    console.error("Create Community XI error:", err);
    return { success: false, error: err.message };
  }
}

export async function getCommunityXis(sortBy: "top" | "new" = "top") {
  try {
    const dbUser = await getDbUser();
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    let query = supabase
      .from('community_xis')
      .select(`
        *,
        users (id, username, favorite_team)
      `);

    if (sortBy === "top") {
      query = query.order('upvotes', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: xis, error } = await query.limit(50);
    if (error) throw error;

    // Check current user's votes
    let userVotes: Record<string, string> = {};
    if (dbUser) {
      const xiIds = xis.map((x: any) => x.id);
      if (xiIds.length > 0) {
        const { data: votes } = await supabase
          .from('xi_votes')
          .select('xi_id, vote_type')
          .eq('user_id', dbUser.id)
          .in('xi_id', xiIds);
        
        if (votes) {
          votes.forEach((v: any) => {
            userVotes[v.xi_id] = v.vote_type;
          });
        }
      }
    }

    return { success: true, xis, userVotes };
  } catch (err: any) {
    console.error("Get Community XIs error:", err);
    return { success: false, error: err.message };
  }
}

export async function voteOnXi(xiId: string, voteType: 'upvote' | 'downvote') {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return { success: false, error: "Not authenticated" };

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    // Check existing vote
    const { data: existingVote } = await supabase
      .from('xi_votes')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('xi_id', xiId)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Toggle off
        await supabase.from('xi_votes').delete().eq('id', existingVote.id);
        
        // Update counts
        const increment = voteType === 'upvote' ? -1 : 0;
        const downIncrement = voteType === 'downvote' ? -1 : 0;
        
        const { error: rpcErr } = await supabase.rpc('update_xi_votes', { 
          p_xi_id: xiId, 
          p_up_change: increment, 
          p_down_change: downIncrement 
        });
        
        if (rpcErr) {
          // If RPC is not available, we have to do it manually (race condition possible but ok for MVP)
          const { data: currentXi } = await supabase.from('community_xis').select('upvotes, downvotes').eq('id', xiId).single();
          if (currentXi) {
            await supabase.from('community_xis').update({
              upvotes: currentXi.upvotes + increment,
              downvotes: currentXi.downvotes + downIncrement
            }).eq('id', xiId);
          }
        }
      } else {
        // Switch vote
        await supabase.from('xi_votes').update({ vote_type: voteType }).eq('id', existingVote.id);
        
        const upChange = voteType === 'upvote' ? 1 : -1;
        const downChange = voteType === 'downvote' ? 1 : -1;
        
        const { data: currentXi } = await supabase.from('community_xis').select('upvotes, downvotes').eq('id', xiId).single();
        if (currentXi) {
          await supabase.from('community_xis').update({
            upvotes: currentXi.upvotes + upChange,
            downvotes: currentXi.downvotes + downChange
          }).eq('id', xiId);
        }
      }
    } else {
      // New vote
      await supabase.from('xi_votes').insert({ user_id: dbUser.id, xi_id: xiId, vote_type: voteType });
      
      const upChange = voteType === 'upvote' ? 1 : 0;
      const downChange = voteType === 'downvote' ? 1 : 0;
      
      const { data: currentXi } = await supabase.from('community_xis').select('upvotes, downvotes').eq('id', xiId).single();
      if (currentXi) {
        await supabase.from('community_xis').update({
          upvotes: currentXi.upvotes + upChange,
          downvotes: currentXi.downvotes + downChange
        }).eq('id', xiId);
      }
    }

    revalidatePath("/dashboard/community");
    return { success: true };
  } catch (err: any) {
    console.error("Vote error:", err);
    return { success: false, error: err.message };
  }
}

