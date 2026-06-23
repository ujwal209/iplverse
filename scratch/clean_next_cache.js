const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '../.next');

console.log('Cleaning Next.js build cache...');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('Successfully deleted the .next directory!');
  } catch (err) {
    console.error('Failed to delete .next directory:', err.message);
    console.log('Please stop your dev server (npm run dev) first, then run this script again.');
  }
} else {
  console.log('.next directory does not exist or has already been deleted.');
}
