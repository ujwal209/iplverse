"use server"

import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function submitDailyGame(gameType: string, score: number, won: boolean) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Not authenticated");

    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, current_streak, longest_streak, last_played_date, games_played, wins, losses, total_points')
      .eq('clerk_id', user.id)
      .single();

    if (userError || !userData) throw new Error("User not found in DB");

    const today = new Date().toISOString().split('T')[0];

    const { data: existingCompletion } = await supabase
      .from('daily_completions')
      .select('id')
      .eq('user_id', userData.id)
      .eq('game_type', gameType)
      .eq('played_date', today)
      .single();

    if (existingCompletion) {
      return { success: true, message: "Already completed today" };
    }

    await supabase.from('daily_completions').insert({
      user_id: userData.id,
      game_type: gameType,
      played_date: today,
      score,
      won
    });

    let newStreak = userData.current_streak;
    let newLongestStreak = userData.longest_streak;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (userData.last_played_date === yesterdayStr) {
      newStreak += 1;
      if (newStreak > newLongestStreak) newLongestStreak = newStreak;
    } else if (userData.last_played_date !== today) {
      newStreak = 1; 
      if (newStreak > newLongestStreak) newLongestStreak = newStreak;
    }

    await supabase.from('users').update({
      games_played: userData.games_played + 1,
      wins: userData.wins + (won ? 1 : 0),
      losses: userData.losses + (won ? 0 : 1),
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_played_date: today,
      total_points: (userData.total_points || 0) + score
    }).eq('id', userData.id);

    checkAchievements(userData.id, supabase).catch(console.error);

    return { success: true };
  } catch (err: any) {
    console.error("Game submission error:", err);
    return { success: false, error: err.message };
  }
}

async function checkAchievements(userId: string, supabase: any) {
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  if (!user) return;

  const earned = [];

  if (user.wins >= 1) earned.push('first_win');
  if (user.wins >= 10) earned.push('10_wins');
  if (user.wins >= 50) earned.push('50_wins');
  if (user.wins >= 100) earned.push('100_wins');
  if (user.current_streak >= 7) earned.push('streak_7');
  if (user.current_streak >= 30) earned.push('streak_30');

  for (const ach of earned) {
    await supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_id: ach
    }).select('id').single().then(() => {
    }).catch(() => {});
  }
}

export async function getArenaQuizQuestions() {
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: dbQuestions, error } = await supabase
      .from('arena_questions')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!dbQuestions || dbQuestions.length === 0) return { success: true, questions: [] };

    const quizQuestions = dbQuestions.filter((q: any) => 
      Array.isArray(q.options) && q.options.length > 0
    );

    const shuffled = [...quizQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const mapped = shuffled.map((q: any) => {
      const shuffledOptions = [...(q.options || [])];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      return {
        id: q.id,
        format: q.format,
        interaction_type: q.interaction_type,
        difficulty: q.difficulty,
        question_text: q.question_text,
        clues: q.clues || [],
        options: shuffledOptions,
        correct_answer: q.correct_answer,
        metadata: q.metadata || {},
        tags: q.tags || [],
        era: q.era || "Modern Era"
      };
    });

    return { success: true, questions: mapped };
  } catch (err: any) {
    console.error("Get arena quiz questions error:", err);
    return { success: false, error: err.message };
  }
}

export async function getRandomStatSmashQuestion() {
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data, error } = await supabase
      .from('stat_smash_questions')
      .select('*');

    if (error) throw error;
    if (!data || data.length === 0) return { success: false, error: "No questions found" };

    const randomIndex = Math.floor(Math.random() * data.length);
    const question = data[randomIndex];

    if (question.left_player_id) {
      const { data: pLeft } = await supabase.from('players').select('name, image_url').eq('id', question.left_player_id).single();
      if (pLeft) {
        question.left_player_name = pLeft.name;
        question.left_player_image = pLeft.image_url;
      }
    } else {
      const { data: pLeft } = await supabase.from('players').select('name, image_url').or(`name.ilike.${question.left_player_name},short_name.ilike.${question.left_player_name}`).limit(1);
      if (pLeft && pLeft.length > 0) {
        question.left_player_name = pLeft[0].name;
        question.left_player_image = pLeft[0].image_url;
      }
    }

    if (question.right_player_id) {
      const { data: pRight } = await supabase.from('players').select('name, image_url').eq('id', question.right_player_id).single();
      if (pRight) {
        question.right_player_name = pRight.name;
        question.right_player_image = pRight.image_url;
      }
    } else {
      const { data: pRight } = await supabase.from('players').select('name, image_url').or(`name.ilike.${question.right_player_name},short_name.ilike.${question.right_player_name}`).limit(1);
      if (pRight && pRight.length > 0) {
        question.right_player_name = pRight[0].name;
        question.right_player_image = pRight[0].image_url;
      }
    }

    return { success: true, question };
  } catch (err: any) {
    console.error("Get random stat smash question error:", err);
    return { success: false, error: err.message };
  }
}

export async function getAllSearchableMatches() {
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data, error } = await supabase
      .from('matches')
      .select('id, season, team1, team2, winner, player_of_match')
      .order('season', { ascending: false });

    if (error) throw error;

    const validMatches = data.filter((m: any) => m.winner);
    return { success: true, matches: validMatches };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAllTeams() {
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data, error } = await supabase
      .from('teams')
      .select('*');

    if (error) throw error;
    return { success: true, teams: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

const TAVILY_API_KEYS = (process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || "fallback").split(",").map(k => k.trim()).filter(Boolean);
let tavilyIndex = 0;

const GROQ_API_KEYS = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "fallback").split(",").map(k => k.trim()).filter(Boolean);
let groqIndex = 0;

export async function getMatchClues(matchId: number) {
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error) throw error;
    if (!match) return { success: false, error: "Match not found" };

    const pomStr = match.player_of_match ? match.player_of_match : "Not Awarded";
    
    let funFact = "No fun fact available for this match.";
    let aiPom = pomStr;
    try {
      const tavilyKey = TAVILY_API_KEYS[tavilyIndex];
      tavilyIndex = (tavilyIndex + 1) % TAVILY_API_KEYS.length;

      const groqKey = GROQ_API_KEYS[groqIndex];
      groqIndex = (groqIndex + 1) % GROQ_API_KEYS.length;

      const query = `IPL match ${match.season} ${match.team1} vs ${match.team2} at ${match.venue} Player of the Match and significant moments highlights`;
      
      const tavRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: tavilyKey, query: query, search_depth: "basic" })
      });
      
      if (tavRes.ok) {
        const tavData = await tavRes.json();
        const context = tavData.results?.map((r: any) => r.content).join(" ") || "No context found.";
        
        const groqPrompt = `You are a strict JSON generator. Based on the context of this IPL match, extract two things:
1. The "Player of the Match" (or "Man of the Match"). If you cannot find it, return "Not Found".
2. ONE highly significant and specific event that happened in this IPL match (e.g., a massive over, a game-changing wicket, a hat-trick, a crazy catch, or a player's milestone). Make it a detailed descriptive clue for a trivia game. CRITICAL RULE: DO NOT mention the year (${match.season}), "${match.team1}", or "${match.team2}" in your fun fact (use "the batting team" or "the chasing team").

Respond ONLY with a raw JSON object (no markdown, no backticks) in exactly this format:
{
  "playerOfMatch": "Player Name",
  "funFact": "Your fun fact here"
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
              { role: "system", content: "You are a cricket trivia generator." },
              { role: "user", content: `Context:\n${context}\n\nPrompt:\n${groqPrompt}` }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content || "{}";
          const parsed = JSON.parse(content);
          if (parsed.playerOfMatch && parsed.playerOfMatch !== "Not Found") aiPom = parsed.playerOfMatch;
          if (parsed.funFact) funFact = parsed.funFact;
        }
      }
    } catch (apiErr) {
      console.error("AI Clue generation error:", apiErr);
    }
    
    return { 
      success: true, 
      match: {
        id: match.id,
        team1: match.team1,
        team2: match.team2,
        season: match.season,
        venue: match.venue,
        clues: [
          { type: 'venue', text: `Played at ${match.venue || 'Unknown Venue'}` },
          { type: 'pom', text: `Player of the Match: ${aiPom}` },
          { type: 'fact', text: funFact }
        ]
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getPlayerAIHints(playerName: string) {
  try {
    const tavilyKey = TAVILY_API_KEYS[tavilyIndex];
    tavilyIndex = (tavilyIndex + 1) % TAVILY_API_KEYS.length;

    const groqKey = GROQ_API_KEYS[groqIndex];
    groqIndex = (groqIndex + 1) % GROQ_API_KEYS.length;

    const query = `IPL cricketer ${playerName} career trivia, fun facts, milestones, unique records`;
    
    const tavRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: tavilyKey, query: query, search_depth: "basic" })
    });
    
    if (tavRes.ok) {
      const tavData = await tavRes.json();
      const context = tavData.results?.map((r: any) => r.content).join(" ") || "No context found.";
      
      const groqPrompt = `You are a strict JSON generator for a "Guess the IPL Player" trivia game.
Based on the context, extract exactly THREE highly unique, engaging, and difficult fun facts/milestones/trivia about this player.
CRITICAL RULES:
1. DO NOT mention the player's name, nickname, or obvious initials anywhere in the clues. Use "This player", "He", or "The batter/bowler".
2. The clues should be factual based on the context.
3. Make them sound like exciting game show hints.

Respond ONLY with a raw JSON object (no markdown, no backticks) in exactly this format:
{
  "hints": [
    "Clue 1...",
    "Clue 2...",
    "Clue 3..."
  ]
}`;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a cricket trivia generator." },
            { role: "user", content: `Context:\n${context}\n\nPrompt:\n${groqPrompt}` }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        if (parsed.hints && Array.isArray(parsed.hints)) {
          return { success: true, hints: parsed.hints };
        }
      }
    }
    
    return { success: true, hints: ["This player has played in the IPL.", "This player has represented at least one franchise.", "This player is a well-known cricketer."] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function searchPlayersFromDB(query: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: "Database not configured" };

    const { data, error } = await supabase
      .from('players')
      .select('id, name, image_url')
      .ilike('name', `%${query}%`)
      .limit(5);

    if (error) throw error;

    return { success: true, players: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCareerPathClues() {
  try {
    const mappings = require("@/lib/data/player-mappings.json");
    if (!mappings || mappings.length === 0) return { success: false, error: "No players found" };
    
    const mapped = mappings[Math.floor(Math.random() * mappings.length)];
    const targetName = mapped.display_name;
    const aliases = mapped.aliases || [mapped.cricsheet_name];
    
    let journey: any[] = [];
    try {
      const groqKey = GROQ_API_KEYS[groqIndex];
      groqIndex = (groqIndex + 1) % GROQ_API_KEYS.length;

      const groqPrompt = `You are a cricket historian. Build a chronological career journey for the cricketer "${targetName}". 
all their IPL franchises in chronological order. only ipl frnchise
Ensure there are at least 4 entries if possible. Make it detailed.
prefer the onse who have chnaged teams man not in one team only
Respond ONLY with a raw JSON object containing a "journey" array.
Format:
{
  "journey": [
    { "year": "YYYY", "team": "Team Name" }
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
          temperature: 0.6,
          response_format: { type: "json_object" }
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content || '{"journey":[]}';
        const parsed = JSON.parse(content);
        if (parsed.journey && Array.isArray(parsed.journey) && parsed.journey.length > 0) {
          journey = parsed.journey;
        }
      }
    } catch (apiErr) {
      console.error("AI Journey generation error:", apiErr);
    }
    
    if (journey.length === 0) {
      const journeys = require("@/lib/data/career-journeys.json");
      const fallbackData = journeys[mapped.cricsheet_name];
      journey = fallbackData ? fallbackData.journey : [{ year: "Career", team: "Unknown" }];
    }
    
    return { 
      success: true, 
      targetPlayer: {
        name: targetName,
        aliases: aliases,
        journey: journey
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
