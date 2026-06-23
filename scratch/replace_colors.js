const fs = require('fs');
const path = require('path');

const targetDirectories = ['app', 'components'];
const oldColorPattern = /#124[bB]7[eE]/g;
const newColor = '#0B2A96';

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(fullPath);
      if (['.ts', '.tsx', '.css', '.js'].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (oldColorPattern.test(content)) {
            const updatedContent = content.replace(oldColorPattern, newColor);
            fs.writeFileSync(fullPath, updatedContent, 'utf8');
            console.log(`Updated color in: ${fullPath}`);
          }
        } catch (err) {
          console.error(`Error processing ${fullPath}:`, err);
        }
      }
    }
  }
}

targetDirectories.forEach(dir => {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Processing directory: ${fullPath}`);
    processDirectory(fullPath);
  } else {
    console.log(`Directory not found: ${fullPath}`);
  }
});
console.log('Theme color replacement completed.');
