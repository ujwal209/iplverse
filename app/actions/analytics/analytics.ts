"use server"

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";

const supabase = createClient(supabaseUrl, supabaseKey);

export interface AutocompletePlayer {
  fullName: string;
  dbName: string; // We will use this to store the ID
  shortName: string;
}

export async function searchPlayers(name: string) {
  if (!name) return { success: true, data: [] };
  
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .or(`name.ilike.%${name}%,short_name.ilike.%${name}%`)
      .limit(10);
      
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function searchPlayersWithWebSearch(query: string): Promise<{ success: boolean; data: AutocompletePlayer[]; error?: string }> {
  if (!query || query.trim().length < 2) return { success: true, data: [] };
  
  try {
    const { data, error } = await supabase
      .from("players")
      .select("id, name, short_name")
      .or(`name.ilike.%${query}%,short_name.ilike.%${query}%`)
      .limit(10);
      
    if (error) throw error;
    
    const results: AutocompletePlayer[] = data.map((p) => ({
      fullName: p.name,
      dbName: p.id, // Store ID here for routing!
      shortName: p.short_name
    }));
    
    return { success: true, data: results };
  } catch (error: any) {
    console.error("searchPlayers Error:", error);
    return { success: false, data: [], error: error.message };
  }
}

export async function getPlayerCareer(playerId: string) {
  try {
    const { data, error } = await supabase
      .from("player_career_stats")
      .select("*")
      .eq("player_id", playerId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
    return { success: true, data: { data: data || null } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdvancedBatting(playerId: string) {
  try {
    const { data, error } = await supabase
      .from("batter_advanced")
      .select("*")
      .eq("batter_id", playerId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: { data: data || null } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdvancedBowling(playerId: string) {
  try {
    const { data, error } = await supabase
      .from("bowler_advanced")
      .select("*")
      .eq("bowler_id", playerId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: { data: data || null } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHeadToHead(batterId: string, bowlerId: string) {
  try {
    const { data, error } = await supabase
      .from("player_vs_player")
      .select("*")
      .eq("batter_id", batterId)
      .eq("bowler_id", bowlerId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: { data: data || null } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPlayerVsTeam(playerId: string, team: string) {
  try {
    const { data, error } = await supabase
      .from("player_vs_team")
      .select("*")
      .eq("player_id", playerId)
      .ilike("opponent", team)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: { data: data || null } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVenueAnalytics(venueName: string) {
  return { success: false, error: "Not implemented locally yet" };
}

export async function getTeamAnalytics(teamName: string) {
  return { success: false, error: "Not implemented locally yet" };
}

export async function getBattingLeaders(metric: string = "runs", limit: number = 10, offset: number = 0) {
  try {
    const { data, count, error } = await supabase
      .from("batting_stats")
      .select("*, players!inner(name)", { count: 'exact' })
      .order(metric, { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit);
      
    if (error) throw error;
    return { success: true, data: { data: data, total: count } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBowlingLeaders(metric: string = "wickets", limit: number = 10, offset: number = 0) {
  try {
    const { data, count, error } = await supabase
      .from("bowling_stats")
      .select("*, players!inner(name)", { count: 'exact' })
      .order(metric, { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit);
      
    if (error) throw error;
    return { success: true, data: { data: data, total: count } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchPlayerImage(playerIdOrName: string) {
  try {
    // Determine if the argument is an ID (e.g. 8 chars long) or a Name
    let queryColumn = "name";
    if (playerIdOrName.length === 8 || !playerIdOrName.includes(" ")) {
      queryColumn = "id";
    }

    const { data, error } = await supabase
      .from('players')
      .select('image_url')
      .eq(queryColumn, playerIdOrName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data?.image_url || null;
  } catch (error: any) {
    console.error(`Error fetching image for ${playerIdOrName}:`, error.message);
    return null;
  }
}


export async function getPlayerPhaseStats(playerId: string) {
  try {
    const [ppRes, moRes, doRes] = await Promise.all([
      supabase.from("powerplay_stats_batting").select("*").eq("batter_id", playerId).single(),
      supabase.from("middle_overs_stats_batting").select("*").eq("batter_id", playerId).single(),
      supabase.from("death_overs_stats_batting").select("*").eq("batter_id", playerId).single(),
    ]);
    return {
      success: true,
      data: {
        powerplay: ppRes.data,
        middleOvers: moRes.data,
        deathOvers: doRes.data,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPlayerMatchImpact(playerId: string) {
  try {
    const { data, error } = await supabase
      .from("player_match_impact")
      .select("*")
      .eq("batter_id", playerId);
    if (error) throw error;
    return { success: true, data: { data } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPlayerContextStats(playerId: string) {
  try {
    const { data, error } = await supabase
      .from("player_context_stats")
      .select("*")
      .eq("batter_id", playerId);
    if (error) throw error;
    return { success: true, data: { data } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchPlayerCareerJourney(playerId: string): Promise<{ success: boolean; data?: { year: string, team: string }[], error?: string }> {
   return { success: false, error: "Not implemented locally yet" };
}

export async function fetchBestVsTeams(playerId: string) {
   return { success: false, error: "Not implemented locally yet" };
}

export async function fetchTopRivalries(playerId: string) {
   return { success: false, error: "Not implemented locally yet" };
}

export async function getTopPartnerships(limit: number = 50, offset: number = 0) {
  try {
    const { data, count, error } = await supabase
      .from("partnerships_database")
      .select("*", { count: 'exact' })
      .order("partnership_runs", { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit);
    if (error) throw error;
    
    // Resolve player names
    if (data && data.length > 0) {
      const playerIds = new Set<string>();
      data.forEach((p: any) => {
        if (p.partner_a) playerIds.add(p.partner_a);
        if (p.partner_b) playerIds.add(p.partner_b);
      });
      
      const { data: playersData } = await supabase
        .from("players")
        .select("id, name")
        .in("id", Array.from(playerIds));
        
      const playerMap = new Map();
      if (playersData) {
        playersData.forEach((p: any) => playerMap.set(p.id, p.name));
      }
      
      data.forEach((p: any) => {
        p.partner_a_name = playerMap.get(p.partner_a) || p.partner_a;
        p.partner_b_name = playerMap.get(p.partner_b) || p.partner_b;
      });
    }

    return { success: true, data: { data, total: count } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMatches(limit: number = 50, offset: number = 0) {
  try {
    const { data, count, error } = await supabase
      .from("matches")
      .select("*", { count: 'exact' })
      .order("match_date", { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit);
      
    if (error) throw error;

    if (data && data.length > 0) {
      const playerNames = new Set<string>();
      data.forEach((m: any) => {
        if (m.player_of_match) playerNames.add(m.player_of_match);
      });

      const { data: playersData } = await supabase
        .from("players")
        .select("id, name, image_url")
        .in("name", Array.from(playerNames));

      const nameToDataMap = new Map();
      if (playersData) {
        playersData.forEach((p: any) => nameToDataMap.set(p.name, p));
      }

      data.forEach((m: any) => {
        if (m.player_of_match) {
          const p = nameToDataMap.get(m.player_of_match);
          if (p) {
            m.player_of_match_id = p.id;
            m.player_of_match_image = p.image_url;
          }
        }
      });
    }

    return { success: true, data: { data, total: count } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPlayerTopPartnership(playerId: string) {
  try {
    const { data, error } = await supabase
      .from("partnerships_database")
      .select("*")
      .or(`partner_a.eq."${playerId}",partner_b.eq."${playerId}"`)
      .order("partnership_runs", { ascending: false })
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0) {
      const p = data[0];
      const otherPartnerId = p.partner_a === playerId ? p.partner_b : p.partner_a;
      
      const { data: partnerData } = await supabase
        .from("players")
        .select("name")
        .eq("id", otherPartnerId)
        .single();
        
      return {
        success: true,
        data: {
          partner_name: partnerData ? partnerData.name : otherPartnerId,
          runs: p.partnership_runs,
          balls: p.balls,
          highest: p.highest_partnership,
          avg: p.average_partnership
        }
      };
    }
    return { success: true, data: null };
  } catch (error: any) {
    console.error("Error in getPlayerTopPartnership:", error);
    return { success: false, error: error.message };
  }
}
