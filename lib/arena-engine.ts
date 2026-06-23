import { generateArenaClues } from "./groq-arena";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { getRandomStatSmashQuestion } from "@/app/actions/games";

export type RoundType = 
  | "WHO_AM_I"
  | "MATCH_MEMORY"
  | "CAREER_PATH_DUEL"
  | "CONNECTIONS_RACE"
  | "STAT_SMASH"
  | "PLAYER_VS_PLAYER"
  | "MYSTERY_PLAYER"
  | "ARENA_QUIZ";

export interface ArenaRound {
  type: RoundType;
  questionData: any;
  answerData: any;
  points: number;
}

// Helper to read JSON data
async function readDataFile(filename: string) {
  const filePath = path.join(process.cwd(), "lib", "data", filename);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

// Selects a random element from an array
function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class ArenaQuestionEngine {
  
  static async generateRound(type: RoundType): Promise<ArenaRound> {
    switch (type) {
      case "WHO_AM_I":
        return this.generateWhoAmI();
      case "MATCH_MEMORY":
        return this.generateMatchMemory();
      case "CAREER_PATH_DUEL":
        return this.generateCareerPathDuel();
      case "CONNECTIONS_RACE":
        return this.generateConnectionsRace();
      case "STAT_SMASH":
        return this.generateStatSmash();
      case "PLAYER_VS_PLAYER":
        return this.generatePlayerVsPlayer();
      case "MYSTERY_PLAYER":
        return this.generateMysteryPlayer();
      case "ARENA_QUIZ":
        return this.generateArenaQuiz();
      default:
        throw new Error(`Unknown round type: ${type}`);
    }
  }

  static async generateWhoAmI(): Promise<ArenaRound> {
    const milestones = await readDataFile("milestones.json");
    const players = Object.keys(milestones);
    const targetPlayer = getRandom(players);
    const facts = milestones[targetPlayer];
    
    // Groq transforms facts into dramatic clues
    const clues = await generateArenaClues("WHO_AM_I", facts);

    return {
      type: "WHO_AM_I",
      points: 100,
      questionData: { clues },
      answerData: { answer: targetPlayer }
    };
  }

  static async generateMysteryPlayer(): Promise<ArenaRound> {
    const milestones = await readDataFile("milestones.json");
    const players = Object.keys(milestones);
    const targetPlayer = getRandom(players);
    const facts = milestones[targetPlayer];
    
    const clues = await generateArenaClues("MYSTERY_PLAYER", facts);

    return {
      type: "MYSTERY_PLAYER",
      points: 100, // Speed bonus handled by frontend state machine
      questionData: { clues },
      answerData: { answer: targetPlayer }
    };
  }

  static async generateMatchMemory(): Promise<ArenaRound> {
    const matches: any[] = await readDataFile("matches.json");
    const targetMatch = getRandom(matches);
    
    // Pass raw match facts to Groq for dramatic reconstruction
    const clues = await generateArenaClues("MATCH_MEMORY", targetMatch);

    return {
      type: "MATCH_MEMORY",
      points: 100,
      questionData: { clues },
      answerData: { answer: targetMatch.searchKey }
    };
  }

  static async generateCareerPathDuel(): Promise<ArenaRound> {
    const journeys = await readDataFile("career-journeys.json");
    const players = Object.keys(journeys);
    // Find a player with at least 3 teams for a good path
    let targetPlayer = "";
    let path = [];
    while (path.length < 2) {
      targetPlayer = getRandom(players);
      path = journeys[targetPlayer];
    }

    return {
      type: "CAREER_PATH_DUEL",
      points: 100,
      questionData: { 
        teams: path.map((p: any) => p.team)
      },
      answerData: { answer: targetPlayer }
    };
  }

  static async generatePlayerVsPlayer(): Promise<ArenaRound> {
    const partnerships: any[] = await readDataFile("partnerships.json");
    
    // Pick two random distinct partnerships
    const p1 = getRandom(partnerships);
    let p2 = getRandom(partnerships);
    while (p2.id === p1.id) {
      p2 = getRandom(partnerships);
    }

    const isP1Higher = p1.runs > p2.runs;

    return {
      type: "PLAYER_VS_PLAYER",
      points: 100,
      questionData: {
        question: "Which partnership scored more runs together?",
        optionA: `${p1.player1} & ${p1.player2}`,
        optionB: `${p2.player1} & ${p2.player2}`,
      },
      answerData: { 
        answer: isP1Higher ? "A" : "B",
        stats: {
          A: p1.runs,
          B: p2.runs
        }
      }
    };
  }

  static async generateStatSmash(): Promise<ArenaRound> {
    const res = await getRandomStatSmashQuestion();
    
    // If Supabase fetch fails for some reason, fallback to local milestones to prevent game crash
    if (!res.success || !res.question) {
      const milestones = await readDataFile("milestones.json");
      const batters = Object.entries(milestones).filter(([k, v]: any) => v.total_runs !== undefined);
      const [p1Name, p1Stats]: any = getRandom(batters);
      let p2Name, p2Stats: any;
      do {
        [p2Name, p2Stats] = getRandom(batters);
      } while (p2Name === p1Name);
      const isP1Higher = p1Stats.total_runs > p2Stats.total_runs;
      return {
        type: "STAT_SMASH",
        points: 100,
        questionData: {
          question: "Who has more total IPL runs?",
          player1: p1Name,
          player2: p2Name,
          category: "Total Runs",
          format: "number"
        },
        answerData: { 
          answer: isP1Higher ? p1Name : p2Name,
          stats: {
            [p1Name]: p1Stats.total_runs,
            [p2Name]: p2Stats.total_runs
          }
        }
      };
    }

    // Map Supabase `stat_smash_questions` format to ArenaRound
    const q = res.question;
    const isRightHigher = Number(q.right_player_value) > Number(q.left_player_value);
    
    return {
      type: "STAT_SMASH",
      points: 100,
      questionData: {
        question: `Who has a higher ${q.stat_display}?`,
        player1: q.left_player_name,
        player2: q.right_player_name,
        category: q.stat_display,
        format: q.stat_format
      },
      answerData: { 
        answer: isRightHigher ? q.right_player_name : q.left_player_name,
        stats: {
          [q.left_player_name]: q.left_player_value,
          [q.right_player_name]: q.right_player_value
        }
      }
    };
  }

  static async generateConnectionsRace(): Promise<ArenaRound> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Try to fetch from arena_questions first
        const { data: dbQuestions } = await supabase
          .from('arena_questions')
          .select('*')
          .in('format', ['connections', 'connections_race'])
          .eq('is_active', true);

        if (dbQuestions && dbQuestions.length > 0) {
          const q = dbQuestions[Math.floor(Math.random() * dbQuestions.length)];
          const categories = q.metadata?.categories || [];
          if (categories.length >= 2) {
            const selectedCats = categories.slice(0, 2);
            const tiles = [...selectedCats[0].items, ...selectedCats[1].items];
            for (let i = tiles.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
            }

            return {
              type: "CONNECTIONS_RACE",
              points: 100,
              questionData: {
                question: q.question_text || "Create two groups of four connections!",
                tiles,
                categories: selectedCats,
                difficulty: q.difficulty || "Medium",
                era: q.era || "Modern Era",
                tags: q.tags || []
              },
              answerData: {
                answer: "2",
                categories: selectedCats
              }
            };
          }
        }

        // 2. Fallback: Fetch a random puzzle from connections_puzzles
        const { data: puzzles } = await supabase
          .from('connections_puzzles')
          .select('*');
        
        if (puzzles && puzzles.length > 0) {
          const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
          const categories = puzzle.categories || [];
          if (categories.length >= 2) {
            const shuffledCats = [...categories].sort(() => Math.random() - 0.5);
            const selectedCats = shuffledCats.slice(0, 2);
            // Capitalize items to keep UI uniform
            const formattedCats = selectedCats.map(c => ({
              ...c,
              items: c.items.map((it: string) => it.toUpperCase())
            }));
            
            const tiles = [...formattedCats[0].items, ...formattedCats[1].items];
            for (let i = tiles.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
            }

            return {
              type: "CONNECTIONS_RACE",
              points: 100,
              questionData: {
                question: "Create two groups of four connections!",
                tiles,
                categories: formattedCats,
                difficulty: "Medium",
                era: "Modern Era",
                tags: ["connections"]
              },
              answerData: {
                answer: "2",
                categories: formattedCats
              }
            };
          }
        }
      }
    } catch (err) {
      console.error("Failed to generate Connections Race from DB:", err);
    }

    // Static fallback if all else fails
    const seedBoards = [
      {
        categories: [
          { title: "MI CAPTAINS", items: ["ROHIT", "SACHIN", "HARBHAJAN", "POLLARD"], difficulty: 1 },
          { title: "RCB CENTURIONS", items: ["KOHLI", "GAYLE", "DE VILLIERS", "PADIKKAL"], difficulty: 2 }
        ]
      },
      {
        categories: [
          { title: "CSK LEGENDS", items: ["DHONI", "RAINA", "JADEJA", "BRAVO"], difficulty: 1 },
          { title: "PURPLE CAP WINNERS", items: ["BUMRAH", "CHAHAL", "MALINGA", "HARSHAL"], difficulty: 2 }
        ]
      }
    ];

    const board = getRandom(seedBoards);
    const tiles = [...board.categories[0].items, ...board.categories[1].items];
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    return {
      type: "CONNECTIONS_RACE",
      points: 100,
      questionData: {
        question: "Create two groups of four connections!",
        tiles,
        categories: board.categories,
        difficulty: "Medium",
        era: "Modern Era",
        tags: ["connections"]
      },
      answerData: {
        answer: "2",
        categories: board.categories
      }
    };
  }

  static async generateArenaQuiz(): Promise<ArenaRound> {
    const questions = [
      {
        question: "Which captain holds the record for the most IPL wins with a single franchise, leading them to 5 titles and over 120 match victories?",
        options: ["Gautam Gambhir", "MS Dhoni", "Rohit Sharma", "Virat Kohli"],
        clues: [
          "He has played in 10 IPL finals, the most by any player.",
          "His trademark helicopter shot is famous worldwide.",
          "He retired from international cricket on August 15, 2020."
        ],
        answer: "MS Dhoni",
        difficulty: "Medium",
        era: "Dhoni Era",
        tags: ["CSK", "Captain", "Legend", "Finisher"],
        explanation: "MS Dhoni captained Chennai Super Kings (CSK) to 5 IPL titles and has recorded the highest number of wins (133 wins) as an IPL captain."
      },
      {
        question: "Who was the first batsman to score a century in the history of the Indian Premier League during the opening match in 2008?",
        options: ["Brendon McCullum", "Chris Gayle", "Adam Gilchrist", "Matthew Hayden"],
        clues: [
          "He achieved this feat playing for Kolkata Knight Riders against Royal Challengers Bangalore.",
          "He scored an unbeaten 158 runs, hit 13 sixes and 10 fours.",
          "He is a former New Zealand captain known for his aggressive batting."
        ],
        answer: "Brendon McCullum",
        difficulty: "Hard",
        era: "Pre-IPL Era",
        tags: ["KKR", "Opener", "Century", "2008"],
        explanation: "Brendon McCullum scored 158* off 73 balls in the very first match of IPL in 2008, setting a blistering tone for the league."
      },
      {
        question: "Which bowler holds the unique distinction of taking three hat-tricks in the Indian Premier League history, playing for different franchises?",
        options: ["Yuzvendra Chahal", "Amit Mishra", "Piyush Chawla", "Harbhajan Singh"],
        clues: [
          "He is a leg-spinner who played for Deccan Chargers, Delhi Capitals, and Sunrisers Hyderabad.",
          "He is the first bowler to take 3 hat-tricks in the league.",
          "He has taken over 160 wickets in his IPL career."
        ],
        answer: "Amit Mishra",
        difficulty: "Expert",
        era: "2010s Era",
        tags: ["Hat-trick", "Spinner", "Record", "Deccan Chargers"],
        explanation: "Amit Mishra has taken three hat-tricks in the IPL: in 2008 (for Delhi Daredevils), in 2011 (for Deccan Chargers), and in 2013 (for Sunrisers Hyderabad)."
      },
      {
        question: "Who has recorded the fastest century in IPL history, reaching the milestone in just 30 balls?",
        options: ["Yusuf Pathan", "Chris Gayle", "AB de Villiers", "David Miller"],
        clues: [
          "He achieved this in 2013 playing against Pune Warriors India.",
          "He finished with an unbeaten 175 runs in that innings.",
          "He is affectionately nicknamed the 'Universe Boss'."
        ],
        answer: "Chris Gayle",
        difficulty: "Medium",
        era: "2010s Era",
        tags: ["RCB", "Opener", "Century", "Record"],
        explanation: "Chris Gayle scored 175* off 66 balls against Pune Warriors India in 2013, reaching his hundred in just 30 balls."
      },
      {
        question: "Which bowler has taken the most wickets in IPL history?",
        options: ["Lasith Malinga", "Dwayne Bravo", "Yuzvendra Chahal", "Amit Mishra"],
        clues: [
          "He is a leg-spinner who plays for Rajasthan Royals.",
          "He won the Purple Cap in IPL 2022 with 27 wickets.",
          "He was previously a key bowler for Royal Challengers Bangalore."
        ],
        answer: "Yuzvendra Chahal",
        difficulty: "Medium",
        era: "Modern Era",
        tags: ["Rajasthan Royals", "Spinner", "Purple Cap", "Record"],
        explanation: "Yuzvendra Chahal is the leading wicket-taker in IPL history, passing Dwayne Bravo's record of 183 wickets."
      }
    ];

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: dbQuestions, error } = await supabase
          .from('arena_questions')
          .select('*')
          .eq('is_active', true);

        if (!error && dbQuestions && dbQuestions.length > 0) {
          const quizQuestions = dbQuestions.filter((q: any) => 
            Array.isArray(q.options) && q.options.length > 0
          );

          if (quizQuestions.length > 0) {
            const q = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
            const shuffledOptions = [...(q.options || [])];
            for (let i = shuffledOptions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
            }

            return {
              type: "ARENA_QUIZ",
              points: 100,
              questionData: {
                question: q.question_text,
                options: shuffledOptions,
                clues: q.clues || [],
                difficulty: q.difficulty || "Medium",
                era: q.era || "Modern Era",
                tags: q.tags || []
              },
              answerData: {
                answer: q.correct_answer,
                explanation: q.metadata?.explanation || ""
              }
            };
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch arena quiz questions from DB:", err);
    }

    // Fallback static questions (with shuffled options)
    const q = getRandom(questions);
    const shuffledOptions = [...q.options];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    return {
      type: "ARENA_QUIZ",
      points: 100,
      questionData: {
        question: q.question,
        options: shuffledOptions,
        clues: q.clues,
        difficulty: q.difficulty,
        era: q.era,
        tags: q.tags
      },
      answerData: {
        answer: q.answer,
        explanation: q.explanation
      }
    };
  }

  static async generateRoundForFormat(format: string, difficulty: string, historyTypes: RoundType[] = []): Promise<ArenaRound> {
    let type: RoundType;
    if (format === 'mixed' || !format) {
      const availableTypes: RoundType[] = [
        "WHO_AM_I",
        "MATCH_MEMORY",
        "CAREER_PATH_DUEL",
        "CONNECTIONS_RACE",
        "PLAYER_VS_PLAYER",
        "MYSTERY_PLAYER",
        "ARENA_QUIZ",
        "STAT_SMASH"
      ];
      
      const cycleNumber = Math.floor(historyTypes.length / availableTypes.length);
      const typesInCurrentCycle = historyTypes.slice(cycleNumber * availableTypes.length);
      
      const remainingTypes = availableTypes.filter(t => !typesInCurrentCycle.includes(t));
      
      if (remainingTypes.length > 0) {
        type = remainingTypes[Math.floor(Math.random() * remainingTypes.length)];
      } else {
        type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      }
    } else {
      switch (format) {
        case 'guess_who':
          type = Math.random() < 0.5 ? "WHO_AM_I" : "MYSTERY_PLAYER";
          break;
        case 'stat_smash':
          type = "STAT_SMASH";
          break;
        case 'guess_match':
          type = "MATCH_MEMORY";
          break;
        case 'career_path':
          type = "CAREER_PATH_DUEL";
          break;
        case 'connections':
          type = "CONNECTIONS_RACE";
          break;
        case 'arena_quiz':
          type = "ARENA_QUIZ";
          break;
        default:
          type = "WHO_AM_I";
      }
    }
    return this.generateRound(type);
  }

  /**
   * Generates a full 7-round match schema
   */
  static async generateMatch(): Promise<ArenaRound[]> {
    const availableTypes: RoundType[] = [
      "WHO_AM_I",
      "MATCH_MEMORY",
      "CAREER_PATH_DUEL",
      "CONNECTIONS_RACE",
      "PLAYER_VS_PLAYER",
      "MYSTERY_PLAYER"
    ];
    
    // 10% chance to include STAT_SMASH instead of a second WHO_AM_I
    if (Math.random() < 0.1) {
      availableTypes.push("STAT_SMASH");
    } else {
      availableTypes.push("WHO_AM_I"); // duplicate round type to make 7
    }

    // Shuffle the 7 round types
    for (let i = availableTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableTypes[i], availableTypes[j]] = [availableTypes[j], availableTypes[i]];
    }

    const rounds = await Promise.all(
      availableTypes.map(type => this.generateRound(type))
    );

    return rounds;
  }
}
