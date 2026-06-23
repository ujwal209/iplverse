const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const dotenvContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
const env = {};
dotenvContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY
);

async function check() {
  const { data: formats, error } = await supabase
    .from('arena_questions')
    .select('format');
  
  if (error) {
    console.error('Error fetching formats:', error);
    return;
  }

  const counts = {};
  formats.forEach(f => {
    counts[f.format] = (counts[f.format] || 0) + 1;
  });
  console.log('Format counts:', counts);

  // Fetch one sample for each format
  const uniqueFormats = Object.keys(counts);
  for (const format of uniqueFormats) {
    const { data: sample } = await supabase
      .from('arena_questions')
      .select('*')
      .eq('format', format)
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log(`\n--- Sample for format: ${format} ---`);
      console.log(JSON.stringify(sample[0], null, 2));
    }
  }
}

check();
