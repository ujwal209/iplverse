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
  const names = ['Virat Kohli', 'MS Dhoni', 'Rohit Sharma', 'Jasprit Bumrah', 'AB de Villiers', 'Hardik Pandya'];
  for (const name of names) {
    const { data } = await supabase.from('players').select('id, name').ilike('name', `%${name}%`).limit(1);
    if (data && data.length > 0) {
      console.log(`{ name: "${data[0].name}", dbName: "${data[0].id}", role: "..." }`);
    } else {
      console.log(`Not found: ${name}`);
    }
  }
}
run();
