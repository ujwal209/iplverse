const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Native fallback for dotenv
try {
  const envPath = path.resolve(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    if (!line.trim() || line.startsWith('#')) return;
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
} catch (e) {
  console.log("No .env file found or error reading it.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TAVILY_API_KEYS = (process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || "fallback").split(",").map(k => k.trim()).filter(Boolean);

let tavilyIndex = 0;
function getNextTavilyKey() {
  const key = TAVILY_API_KEYS[tavilyIndex];
  tavilyIndex = (tavilyIndex + 1) % TAVILY_API_KEYS.length;
  return key;
}

async function fetchImageFromTavily(name) {
  try {
    const apiKey = getNextTavilyKey();
    const query = `${name} cricketer profile`;
    
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        include_images: true,
        search_depth: "basic"
      })
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data && data.images && data.images.length > 0) {
      // Find a valid image URL (ignore base64 or weird links if any)
      for (let img of data.images) {
        if (typeof img === 'string' && img.startsWith('http')) {
          return img;
        } else if (typeof img === 'object' && img.url) {
          return img.url;
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Tavily image for ${name}:`, error.message);
    return null;
  }
}

async function run() {
  const { data, error } = await supabase.from('matches').select('id, player_of_match').not('player_of_match', 'is', null);
  console.log("Error?", error);
  console.log("Valid POM Count:", data.length);
}

run();
