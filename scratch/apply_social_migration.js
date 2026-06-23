const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env file if it exists
const loadEnv = (fileName) => {
  const envPath = path.join(__dirname, '..', fileName);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        const val = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    });
  }
};

loadEnv('.env.local');
loadEnv('.env');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/0005_social_multiplayer.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Applying migration via exec_sql RPC...');
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('Migration failed:', error);
  } else {
    console.log('Migration applied successfully!');
    console.log('Result:', data);
  }
}

run();
