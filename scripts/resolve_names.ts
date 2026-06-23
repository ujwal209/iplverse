import * as fs from 'fs';
import * as path from 'path';

// Parse API keys directly from .env since they might be multiline
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
const groqKeysMatch = envContent.match(/gsk_[a-zA-Z0-9]+/g) || [];
const tavilyKeysMatch = envContent.match(/tvly-[a-zA-Z0-9-]+/g) || [];

// Remove duplicates
const groqKeys = Array.from(new Set(groqKeysMatch));
const tavilyKeys = Array.from(new Set(tavilyKeysMatch));

console.log(`Loaded ${groqKeys.length} Groq keys and ${tavilyKeys.length} Tavily keys.`);

const uniqueNamesPath = path.join(__dirname, 'unique_names.json');
const mappingPath = path.join(__dirname, 'player_name_mapping.json');

let uniqueNames: string[] = [];
if (fs.existsSync(uniqueNamesPath)) {
  uniqueNames = JSON.parse(fs.readFileSync(uniqueNamesPath, 'utf-8'));
} else {
  console.error("unique_names.json not found!");
  process.exit(1);
}

let existingMapping: Record<string, string> = {};
if (fs.existsSync(mappingPath)) {
  existingMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
}

// Filter names that already exist in mapping
const namesToProcess = uniqueNames.filter(name => !existingMapping[name]);
console.log(`${uniqueNames.length} total names. ${namesToProcess.length} left to process.`);

let currentGroqKeyIndex = 0;
function getNextGroqKey() {
  const key = groqKeys[currentGroqKeyIndex];
  currentGroqKeyIndex = (currentGroqKeyIndex + 1) % groqKeys.length;
  return key;
}

async function queryGroq(namesBatch: string[]): Promise<Record<string, string>> {
  const prompt = `You are a cricket expert. I have a list of abbreviated Indian Premier League (IPL) and international cricket player names. 
I need you to convert them to their full, formal names (e.g. "v kohli" -> "Virat Kohli", "ms dhoni" -> "MS Dhoni", "sr watson" -> "Shane Watson").
Return ONLY a valid JSON object mapping the exact input string to the full name. No markdown blocks, no other text.

Input list:
${JSON.stringify(namesBatch)}`;

  let retries = groqKeys.length; // Try each key once
  while (retries > 0) {
    const key = getNextGroqKey();
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Valid model
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (response.status === 429) {
        console.log(`Rate limited on key ending in ...${key.slice(-4)}. Retrying with next key.`);
        retries--;
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error: ${response.statusText} - ${errText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (err: any) {
      console.error(`Error with Groq key ...${key.slice(-4)}:`, err.message);
      retries--;
    }
  }
  
  throw new Error("All Groq keys failed or rate limited.");
}

async function run() {
  const batchSize = 30;
  for (let i = 0; i < namesToProcess.length; i += batchSize) {
    const batch = namesToProcess.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1}/${Math.ceil(namesToProcess.length/batchSize)}... (${batch.length} names)`);
    
    try {
      const result = await queryGroq(batch);
      
      // Merge result
      for (const [short, full] of Object.entries(result)) {
        existingMapping[short] = full as string;
      }
      
      // Save progress
      fs.writeFileSync(mappingPath, JSON.stringify(existingMapping, null, 2));
      console.log(`Successfully mapped ${Object.keys(result).length} names.`);
      
      // Delay to be polite to API
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error("Batch failed, stopping to preserve progress.", err);
      break;
    }
  }
  console.log("Done processing names.");
}

run().catch(console.error);
