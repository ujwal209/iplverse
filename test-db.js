const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('matches')
    .select('id, season, team1, team2, winner, player_of_match')
    .order('season', { ascending: false });

  if (error) {
    console.error("DB Error:", error);
    return;
  }

  console.log("Total DB matches:", data.length);
  if (data.length > 0) {
    console.log("Sample match:", data[0]);
  }
  
  const validMatches = data.filter(m => {
    return m.winner && 
           m.player_of_match && 
           typeof m.player_of_match === 'string' &&
           m.player_of_match.toLowerCase() !== "not awarded" && 
           m.player_of_match !== "null";
  });
  
  console.log("Valid Matches length:", validMatches.length);
}

test();
