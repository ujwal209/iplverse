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
  const tables = ['batting_stats', 'player_vs_player', 'player_career_stats'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) console.error(`Error with ${table}:`, error);
    if (data && data.length > 0) {
      console.log(`\n--- Schema for ${table} ---`);
      console.log(Object.keys(data[0]).join(', '));
    }
  }
}
run();
