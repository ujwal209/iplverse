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

    // Standard database fields
    const dbPom = match.player_of_match && 
                  match.player_of_match.toLowerCase() !== "not awarded" && 
                  match.player_of_match !== "null"
                  ? match.player_of_match 
                  : null;

    let aiPom = dbPom || "Not Awarded";
    
    // DB Fallback Result text (non-repetitive, logical)
    const marginText = match.win_by_runs && match.win_by_runs > 0 
      ? `${match.win_by_runs} runs` 
      : (match.win_by_wickets && match.win_by_wickets > 0 ? `${match.win_by_wickets} wickets` : 'a close margin');
    
    const resultText = match.win_by_runs && match.win_by_runs > 0
      ? `The team batting first won the match by ${match.win_by_runs} runs.`
      : (match.win_by_wickets && match.win_by_wickets > 0 
          ? `The team batting second won the match by ${match.win_by_wickets} wickets.` 
          : `The match ended in a tie and was decided by a Super Over.`);
    
    let funFact = "No fun fact available for this match.";
    try {
      const tavilyKey = TAVILY_API_KEYS[tavilyIndex];
      tavilyIndex = (tavilyIndex + 1) % TAVILY_API_KEYS.length;

      const groqKey = GROQ_API_KEYS[groqIndex];
      groqIndex = (groqIndex + 1) % GROQ_API_KEYS.length;

      // Format the match date for search
      const matchDateStr = match.match_date 
        ? new Date(match.match_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';

      const query = `IPL match on ${matchDateStr} ${match.team1} vs ${match.team2} at ${match.venue} scorecard player of the match highlights`;
      
      const tavRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: tavilyKey, query: query, search_depth: "basic" })
      });
      
      if (tavRes.ok) {
        const tavData = await tavRes.json();
        const context = tavData.results?.map((r: any) => r.content).join(" ") || "No context found.";
        
        const groqPrompt = `You are a strict JSON generator. Based on the context of this IPL match on ${matchDateStr} during the ${match.season} season, extract:
1. The "Player of the Match" (or "Man of the Match"). If you cannot find it or if it is not mentioned, identify who it was from your own knowledge for this match.
CRITICAL PLAYER OF THE MATCH RULES:
- The Player of the Match MUST be a player from the winning team (in this case, the team that won). Verify who won the match and ensure the player you choose is from that team.
- For example, if the chasing team won by 10 wickets, the player of the match must be one of the chasing team's openers/bowlers, not a player from the losing team.
2. ONE highly significant, specific, and memorable scenario or event that happened in this match (e.g., a critical last-over finish, a player's milestone, a specific batting/bowling performance, a game-changing moment). Make it a detailed descriptive clue for a trivia game.
CRITICAL SCENARIO RULES:
- The description MUST be about this exact match played on ${matchDateStr}. Do NOT mention details from matches in other years.
- DO NOT mention the year (${match.season}), "${match.team1}", "${match.team2}", or the Player of the Match's name in your fun fact/scenario description (use "the batting team", "the chasing team", "the team's captain", "the overseas opener", "the left-arm spinner", etc.).
- Keep it concise (1-2 sentences) but highly informative and scenario-based.

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
    
    // Assemble exactly 4 non-repetitive progressive clues
    const finalClues = [
      { type: 'venue', text: `Played at ${match.venue || 'Unknown Venue'}${match.city ? ` in ${match.city}` : ''}` },
      { type: 'toss', text: `Toss won by the team choosing to ${match.toss_decision || 'field'}.` },
      { type: 'fact', text: funFact !== "No fun fact available for this match." ? funFact : resultText },
      { type: 'pom', text: `Player of the Match: ${aiPom} (Won by the team batting ${match.win_by_runs ? 'first' : 'second'} by ${marginText}).` }
    ];
    
    return { 
      success: true, 
      match: {
        id: match.id,
        team1: match.team1,
        team2: match.team2,
        season: match.season,
        venue: match.venue,
        clues: finalClues
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function getFallbackPlayerHints(playerName: string): Promise<string[]> {
  try {
    const mappings = require("@/lib/data/player-mappings.json");
    const milestones = require("@/lib/data/milestones.json");
    const careerJourneys = require("@/lib/data/career-journeys.json");

    const mapping = mappings.find((p: any) => 
      p.display_name?.toLowerCase() === playerName.toLowerCase() || 
      p.cricsheet_name?.toLowerCase() === playerName.toLowerCase()
    );
    const cricsheetName = mapping ? mapping.cricsheet_name : playerName;
    const displayName = mapping ? mapping.display_name : playerName;

    const supabase = getSupabase();
    let career: any = null;
    let batting: any = null;
    let bowling: any = null;

    if (supabase && mapping) {
      try {
        const [cRes, batRes, bowlRes] = await Promise.all([
          supabase.from("player_career_stats").select("*").eq("player_id", cricsheetName).maybeSingle(),
          supabase.from("batter_advanced").select("*").eq("batter_id", cricsheetName).maybeSingle(),
          supabase.from("bowler_advanced").select("*").eq("bowler_id", cricsheetName).maybeSingle()
        ]);
        if (cRes.data) career = cRes.data;
        if (batRes.data) batting = batRes.data;
        if (bowlRes.data) bowling = bowlRes.data;
      } catch (e) {
        console.error("Error fetching stats for fallback hints:", e);
      }
    }

    const milestoneData = milestones[displayName] || null;

    if (!career && milestoneData) {
      career = {
        matches: milestoneData.matches || 0,
        runs: milestoneData.total_runs || 0,
        wickets: milestoneData.total_wickets || 0
      };
    }

    // Calculate teams count
    const careerTimeline = careerJourneys[displayName] || [];
    const teams = new Set<string>();
    if (mapping?.team) teams.add(mapping.team);
    if (milestoneData?.teams_played_for) {
      milestoneData.teams_played_for.forEach((t: string) => teams.add(t));
    }
    if (careerTimeline) {
      careerTimeline.forEach((item: any) => teams.add(item.team));
    }
    const teamsCount = teams.size || 1;

    const hints: string[] = [];
    const runs = career?.runs || 0;
    const wickets = career?.wickets || 0;
    const matches = career?.matches || 0;
    const isBatter = runs > wickets * 15;

    // Clue 1: Matches and primary stat (Runs or Wickets)
    if (isBatter) {
      hints.push(`This player has played ${matches || 'many'} IPL matches and scored over ${Math.floor(runs / 100) * 100 || runs} runs.`);
    } else {
      hints.push(`This player has played ${matches || 'many'} IPL matches and taken over ${Math.floor(wickets / 10) * 10 || wickets} wickets.`);
    }

    // Clue 2: Franchise representation and efficiency (Strike Rate or Economy)
    if (isBatter) {
      const sr = batting?.strike_rate || (batting?.runs_per_ball ? batting.runs_per_ball * 100 : 0);
      const srText = sr ? `with a career strike rate of ${sr.toFixed(1)}` : `with a strong strike rate`;
      hints.push(`He has represented ${teamsCount} different IPL franchises, ${srText} in his career.`);
    } else {
      const econ = bowling?.economy;
      const econText = econ ? `with an economy rate of ${econ.toFixed(2)}` : `with a solid economy rate`;
      hints.push(`He has represented ${teamsCount} different IPL franchises, bowling ${econText}.`);
    }

    // Clue 3: Milestones (High scores, centuries, best bowling figures, caps)
    if (milestoneData?.orange_caps && milestoneData.orange_caps > 0) {
      hints.push(`He is a highly celebrated player, having won ${milestoneData.orange_caps} Orange Cap(s) in his IPL career.`);
    } else if (milestoneData?.purple_caps && milestoneData.purple_caps > 0) {
      hints.push(`He is a highly celebrated bowler, having won ${milestoneData.purple_caps} Purple Cap(s) in his IPL career.`);
    } else if (isBatter) {
      const centuries = career?.hundreds || milestoneData?.centuries || 0;
      const fifties = career?.fifties || milestoneData?.fifties || 0;
      const hs = career?.highest_score || milestoneData?.highest_score || "";
      if (centuries > 0) {
        hints.push(`In his IPL milestones, he has registered ${centuries} century/centuries and has a highest score of ${hs || 'over 100'}.`);
      } else if (fifties > 0) {
        hints.push(`He has recorded ${fifties} half-centuries in his IPL career, with a highest score of ${hs || 'over 50'}.`);
      } else {
        hints.push(`He has been a key batter for his teams, with a highest score of ${hs || 'several runs'} in the IPL.`);
      }
    } else {
      const bestBowling = career?.best_bowling_figures || "";
      const fiveW = career?.five_w || 0;
      if (fiveW > 0) {
        hints.push(`He has registered ${fiveW} five-wicket haul(s) in the IPL, with a best bowling figure of ${bestBowling || 'great figures'}.`);
      } else if (bestBowling) {
        hints.push(`He has key bowling spells to his name, with best bowling figures of ${bestBowling} in the IPL.`);
      } else {
        hints.push(`He is a notable bowler, known for key wicket-taking spells across seasons in the IPL.`);
      }
    }

    if (hints.length === 3) return hints;
  } catch (e) {
    console.error("Error in getFallbackPlayerHints:", e);
  }

  // Absolute hard fallback if even mapping file / code crashes
  return [
    `This cricketer has played in the IPL.`,
    `This player has represented at least one franchise.`,
    `He is a well-known name in the league.`
  ];
}

export async function getPlayerAIHints(playerName: string) {
  try {
    const tavilyKey = TAVILY_API_KEYS[tavilyIndex];
    tavilyIndex = (tavilyIndex + 1) % TAVILY_API_KEYS.length;

    const groqKey = GROQ_API_KEYS[groqIndex];
    groqIndex = (groqIndex + 1) % GROQ_API_KEYS.length;

    const query = `IPL cricketer ${playerName} career milestones, unique records, best match performances, trivia, fun facts`;
    
    const tavRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: tavilyKey, query: query, search_depth: "basic" })
    });
    
    if (tavRes.ok) {
      const tavData = await tavRes.json();
      const context = tavData.results?.map((r: any) => r.content).join(" ") || "No context found.";
      
      const groqPrompt = `You are a strict JSON generator for an IPL "Guess the Player" trivia game.
Based on the context and your own database of cricket knowledge, extract exactly THREE highly unique, engaging, and progressive clues about this player.
CLUE DESIGN RULES:
- Clue 1 (Hard/Niche): A lesser-known record, a unique match scenario/performance, or an interesting personal milestone (e.g. "He was the first player of his country to...").
- Clue 2 (Medium): A notable achievement, franchise journey detail, or famous partnership (e.g. "He played a pivotal role in his team's championship run in...").
- Clue 3 (Easy): A highly famous record, nickname description, or landmark (e.g. "He is one of the most economical spinners in tournament history and holds the record for...").

CRITICAL EXCLUSION RULES:
- DO NOT mention the player's name (${playerName}), nicknames, initials, or obvious spelling variants anywhere in the clues.
- Refer to them as "This cricketer", "He", "This bowler", "The wicketkeeper-batsman", etc.
- Keep each clue concise (1-2 sentences) but extremely descriptive and scenario/record-based.

Respond ONLY with a raw JSON object (no markdown, no backticks) in exactly this format:
{
  "hints": [
    "Clue 1 content...",
    "Clue 2 content...",
    "Clue 3 content..."
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
    
    const fallbackHints = await getFallbackPlayerHints(playerName);
    return { success: true, hints: fallbackHints };
  } catch (err: any) {
    const fallbackHints = await getFallbackPlayerHints(playerName);
    return { success: true, hints: fallbackHints };
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

export async function getArenaConnections() {
  try {
    const groqKey = GROQ_API_KEYS[groqIndex];
    groqIndex = (groqIndex + 1) % GROQ_API_KEYS.length;

    const groqPrompt = `You are a strict JSON generator. Create a "Connections" style puzzle for IPL cricket.
Generate exactly 4 categories. Each category must have exactly 4 items (cricketers or team names).
The 4 categories should have increasing difficulty (1 to 4).
Make the categories interesting: e.g., "Left Arm Spinners", "Captained PBKS", "Orange Cap Winners", "Hit 6 sixes in an over".
Respond ONLY with a raw JSON object in this format:
{
  "categories": [
    { "id": "cat1", "title": "Category 1 Title", "difficulty": 1, "items": ["Item1", "Item2", "Item3", "Item4"] },
    { "id": "cat2", "title": "Category 2 Title", "difficulty": 2, "items": ["Item1", "Item2", "Item3", "Item4"] },
    { "id": "cat3", "title": "Category 3 Title", "difficulty": 3, "items": ["Item1", "Item2", "Item3", "Item4"] },
    { "id": "cat4", "title": "Category 4 Title", "difficulty": 4, "items": ["Item1", "Item2", "Item3", "Item4"] }
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
          { role: "system", content: "You are a cricket trivia generator." },
          { role: "user", content: groqPrompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (groqRes.ok) {
      const groqData = await groqRes.json();
      const content = groqData.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      if (parsed.categories && parsed.categories.length === 4) {
        return { success: true, categories: parsed.categories };
      }
    }
    
    throw new Error("Failed to generate AI Connections");
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

