import Groq from "groq-sdk";

export interface ClueGenerationResponse {
  clues: string[];
}

let apiKeyIndex = 0;

function getApiKeys(): string[] {
  const keys: string[] = [];
  
  // Try GROQ_API_KEYS list
  if (process.env.GROQ_API_KEYS) {
    keys.push(...process.env.GROQ_API_KEYS.split(",").map(k => k.trim()).filter(Boolean));
  }
  
  // Try single GROQ_API_KEY
  if (process.env.GROQ_API_KEY) {
    keys.push(process.env.GROQ_API_KEY.trim());
  }
  
  // Return unique keys list
  return Array.from(new Set(keys)).filter(Boolean);
}

/**
 * Transforms absolute facts into a 4-clue progressive sequence using Groq.
 * Uses JSON mode to ensure a strict structured output.
 */
export async function generateArenaClues(
  roundType: "WHO_AM_I" | "MATCH_MEMORY" | "MYSTERY_PLAYER",
  facts: any
): Promise<string[]> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    console.warn("No GROQ API key found. Returning fallback clues.");
    return fallbackClues(roundType, facts);
  }

  // Get active key in round robin format
  const activeKey = keys[apiKeyIndex % keys.length];
  apiKeyIndex++;

  let systemPrompt = "";
  if (roundType === "WHO_AM_I" || roundType === "MYSTERY_PLAYER") {
    systemPrompt = `
      You are a dramatic IPL game show host.
      You are given absolute facts about a player. 
      You must NOT invent facts. 
      Transform these facts into exactly 4 escalating clues (from hardest to easiest).
      Clue 4 should make it obvious to a cricket fan.
      Write in first person ("I have played for...", "My highest score is...").
      Return ONLY a JSON object with a "clues" array containing exactly 4 strings.
    `;
  } else if (roundType === "MATCH_MEMORY") {
    systemPrompt = `
      You are a dramatic IPL game show host.
      You are given absolute facts about a famous historic IPL match. 
      You must NOT invent facts. 
      Transform these facts into exactly 4 escalating clues (from hardest to easiest).
      Clue 4 should make the match obvious to a fan.
      Return ONLY a JSON object with a "clues" array containing exactly 4 strings.
    `;
  }

  try {
    const groq = new Groq({
      apiKey: activeKey,
    });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Facts:\n${JSON.stringify(facts, null, 2)}`,
        },
      ],
      model: "llama3-70b-8192", // Fast and capable of JSON mode
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Empty response from Groq");

    const parsed = JSON.parse(responseContent) as ClueGenerationResponse;
    if (!parsed.clues || parsed.clues.length !== 4) {
      throw new Error("Groq returned invalid clues format");
    }

    return parsed.clues;
  } catch (error) {
    console.error("Groq Clue Generation Error:", error);
    return fallbackClues(roundType, facts);
  }
}

// Fallbacks to keep the game running if Groq fails or API key is missing
function fallbackClues(roundType: string, facts: any): string[] {
  if (roundType === "WHO_AM_I" || roundType === "MYSTERY_PLAYER") {
    return [
      `I have played for ${facts.teams_played_for?.join(" and ") || "various teams"}.`,
      `My highest IPL score is ${facts.highest_score || "N/A"}.`,
      `I have hit ${facts.sixes || 0} sixes.`,
      `I have ${facts.orange_caps || 0} orange caps.`
    ];
  }
  return [
    `This match was in ${facts.year || "N/A"}.`,
    `It was played at ${facts.venue || "N/A"}.`,
    `The winning team was ${facts.winner || "N/A"}.`,
    `It was between ${facts.team1 || "N/A"} and ${facts.team2 || "N/A"}.`
  ];
}
