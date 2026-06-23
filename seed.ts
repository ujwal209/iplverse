import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/['"]/g, '').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

const questions = [
  {
    category: 'Batting',
    stat_type: 'runs',
    stat_display: 'Career Runs',
    stat_format: 'number',
    left_player_name: 'Virat Kohli',
    left_player_value: 7263,
    right_player_name: 'Rohit Sharma',
    right_player_value: 6211,
    correct_answer: 'Virat Kohli',
    difficulty: 'Medium'
  },
  {
    category: 'Batting',
    stat_type: 'strike_rate',
    stat_display: 'Strike Rate',
    stat_format: 'number',
    left_player_name: 'Andre Russell',
    left_player_value: 174.0,
    right_player_name: 'MS Dhoni',
    right_player_value: 135.9,
    correct_answer: 'Andre Russell',
    difficulty: 'Easy'
  },
  {
    category: 'Bowling',
    stat_type: 'wickets',
    stat_display: 'Career Wickets',
    stat_format: 'number',
    left_player_name: 'Yuzvendra Chahal',
    left_player_value: 187,
    right_player_name: 'Rashid Khan',
    right_player_value: 139,
    correct_answer: 'Yuzvendra Chahal',
    difficulty: 'Hard'
  },
  {
    category: 'Batting',
    stat_type: 'sixes',
    stat_display: 'Career Sixes',
    stat_format: 'number',
    left_player_name: 'Chris Gayle',
    left_player_value: 357,
    right_player_name: 'AB de Villiers',
    right_player_value: 251,
    correct_answer: 'Chris Gayle',
    difficulty: 'Easy'
  }
];

async function seed() {
  console.log("Seeding...");
  const { data, error } = await supabase.from('stat_smash_questions').insert(questions).select();
  if (error) console.error(error);
  else console.log('Successfully inserted', data.length, 'records');
}

seed();
