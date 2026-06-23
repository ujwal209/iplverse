import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse API keys directly from .env since they might be multiline
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : '';
const supabaseKey = supabaseKeyMatch ? supabaseKeyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function extractNames() {
  console.log("Fetching unique names... This might take a few seconds due to 10k records");
  
  const names = new Set<string>();
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;

  while (hasMore) {
    console.log(`Fetching page ${page + 1}...`);
    const { data, error } = await supabase
      .from('stat_smash_questions')
      .select('left_player_name, right_player_name')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(error);
      break;
    }
    
    if (data && data.length > 0) {
      data.forEach((row: any) => {
        if (row.left_player_name) names.add(row.left_player_name);
        if (row.right_player_name) names.add(row.right_player_name);
      });
      page++;
    } else {
      hasMore = false;
    }
  }

  const uniqueNames = Array.from(names).sort();
  console.log(`Found ${uniqueNames.length} unique names.`);
  
  fs.writeFileSync(path.join(__dirname, 'unique_names.json'), JSON.stringify(uniqueNames, null, 2));
  console.log("Saved to scripts/unique_names.json");
}

extractNames().catch(console.error);
