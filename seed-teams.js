const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const path = require('path');
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split(/\r?\n/).forEach(line => {
  if (!line.trim() || line.startsWith('#')) return;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TAVILY_API_KEYS = (process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || "fallback").split(",").map(k => k.trim()).filter(Boolean);

let tavilyKeyIndex = 0;
function getNextTavilyKey() {
  const key = TAVILY_API_KEYS[tavilyKeyIndex];
  tavilyKeyIndex = (tavilyKeyIndex + 1) % TAVILY_API_KEYS.length;
  return key;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchTeamLogoFromTavily(teamName) {
  try {
    const query = `${teamName} IPL cricket team logo wikipedia`;
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: getNextTavilyKey(),
        query: query,
        search_depth: "basic",
        include_images: true
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        // Find wikipedia or reliable image source
        const wikiImage = data.images.find(img => img.includes('wikipedia') || img.includes('wikimedia'));
        return wikiImage || data.images[0];
      }
    }
  } catch (err) {
    console.error(`Error fetching logo for ${teamName}:`, err.message);
  }
  return null;
}

const baseTeamsData = [
  { name: "Chennai Super Kings", short_name: "CSK", primary_color: "from-yellow-400 to-yellow-600" },
  { name: "Delhi Capitals", short_name: "DC", primary_color: "from-blue-500 to-blue-700" },
  { name: "Delhi Daredevils", short_name: "DD", primary_color: "from-red-500 to-red-700" },
  { name: "Gujarat Titans", short_name: "GT", primary_color: "from-blue-700 to-slate-800" },
  { name: "Kolkata Knight Riders", short_name: "KKR", primary_color: "from-purple-700 to-yellow-500" },
  { name: "Lucknow Super Giants", short_name: "LSG", primary_color: "from-cyan-500 to-blue-600" },
  { name: "Mumbai Indians", short_name: "MI", primary_color: "from-blue-600 to-blue-800" },
  { name: "Punjab Kings", short_name: "PBKS", primary_color: "from-red-500 to-red-700" },
  { name: "Kings XI Punjab", short_name: "KXIP", primary_color: "from-red-400 to-red-600" },
  { name: "Rajasthan Royals", short_name: "RR", primary_color: "from-pink-500 to-blue-600" },
  { name: "Royal Challengers Bangalore", short_name: "RCB", primary_color: "from-red-600 to-black" },
  { name: "Royal Challengers Bengaluru", short_name: "RCB", primary_color: "from-red-600 to-black" },
  { name: "Sunrisers Hyderabad", short_name: "SRH", primary_color: "from-orange-500 to-black" },
  { name: "Deccan Chargers", short_name: "DC", primary_color: "from-blue-200 to-blue-400" },
  { name: "Pune Warriors", short_name: "PWI", primary_color: "from-black to-slate-800" },
  { name: "Rising Pune Supergiant", short_name: "RPS", primary_color: "from-purple-500 to-pink-500" },
  { name: "Rising Pune Supergiants", short_name: "RPS", primary_color: "from-purple-500 to-pink-500" },
  { name: "Gujarat Lions", short_name: "GL", primary_color: "from-orange-400 to-yellow-500" },
  { name: "Kochi Tuskers Kerala", short_name: "KTK", primary_color: "from-purple-500 to-orange-500" }
];

async function seedTeams() {
  console.log("Fetching team logos from Tavily and seeding to Supabase...");
  
  const finalTeamsData = [];

  for (let i = 0; i < baseTeamsData.length; i++) {
    const team = baseTeamsData[i];
    console.log(`[${i+1}/${baseTeamsData.length}] Fetching logo for ${team.name}...`);
    
    const imageUrl = await fetchTeamLogoFromTavily(team.name);
    
    finalTeamsData.push({
      ...team,
      image_url: imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(team.short_name)}&background=random&color=fff&size=128`
    });

    if (imageUrl) {
      console.log(`  -> Found logo: ${imageUrl}`);
    } else {
      console.log(`  -> No logo found, using fallback.`);
    }

    await sleep(250); // Be nice to API
  }

  // Insert into DB
  console.log("\nPushing to Supabase...");
  
  // Clean the table first to avoid duplicates
  await supabase.from('teams').delete().neq('id', 0);
  
  const { data, error } = await supabase.from('teams').insert(finalTeamsData);
  if (error) {
    console.error("Failed to seed teams:", error.message);
  } else {
    console.log("Successfully seeded 19 teams with live logos!");
  }
}

seedTeams();
