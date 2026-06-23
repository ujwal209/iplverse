import { searchPlayersWithWebSearch } from '../app/actions/analytics';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const res = await searchPlayersWithWebSearch("virat");
  console.log("Response:", JSON.stringify(res, null, 2));
}

run();
