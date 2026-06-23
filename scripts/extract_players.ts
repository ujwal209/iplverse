import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : '';
const supabaseKey = supabaseKeyMatch ? supabaseKeyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching all players...");
  const { data, error } = await supabase.from('players').select('name').order('name');
  if (error) {
    console.error("Error fetching players:", error);
    return;
  }
  
  const names = data.map(d => d.name);
  console.log(`Found ${names.length} players.`);
  
  fs.writeFileSync(path.join(__dirname, 'unique_players.json'), JSON.stringify(names, null, 2));
  console.log("Saved to scripts/unique_players.json");
}

run();
