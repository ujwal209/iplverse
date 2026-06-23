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
  const mappingPath = path.join(__dirname, 'player_name_mapping.json');
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
    
    // We update left_player_name where it matches shortName
    await supabase
      .from('stat_smash_questions')
      .update({ left_player_name: fullName })
      .eq('left_player_name', shortName);
      
    // Update right_player_name
    await supabase
      .from('stat_smash_questions')
      .update({ right_player_name: fullName })
      .eq('right_player_name', shortName);
      
    count++;
    if (count % 10 === 0) console.log(`Processed ${count}/${entries.length} mappings...`);
  }
  
  console.log("Finished updating all names!");
}

applyMapping().catch(console.error);
