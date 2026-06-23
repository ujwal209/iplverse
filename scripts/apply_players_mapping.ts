import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : '';
const supabaseKey = supabaseKeyMatch ? supabaseKeyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMapping() {
  const mappingPath = path.join(__dirname, 'all_players_mapping.json');
  if (!fs.existsSync(mappingPath)) {
    console.error("No mapping found!");
    return;
  }

  const mapping: Record<string, string> = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  const entries = Object.entries(mapping);
  console.log(`Loaded ${entries.length} name mappings.`);

  let count = 0;
  for (const [shortName, fullName] of entries) {
    if (shortName === fullName) continue;
    
    // Update public.players name
    await supabase
      .from('players')
      .update({ name: fullName })
      .eq('name', shortName); // name is currently the short name.
      
    count++;
    if (count % 20 === 0) console.log(`Processed ${count}/${entries.length} mappings...`);
  }
  
  console.log("Finished updating all names in players table!");
}

applyMapping().catch(console.error);
