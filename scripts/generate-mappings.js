const fs = require('fs');
const path = require('path');

const playersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/data/players.json'), 'utf-8'));

// Hardcoded knowledge base for top players
const KNOWN_PLAYERS = {
  "V Kohli": { first: "Virat", last: "Kohli", team: "RCB", tags: ["king kohli", "chiku", "vk"] },
  "RG Sharma": { first: "Rohit", last: "Sharma", team: "MI", tags: ["hitman", "rohit", "rs"] },
  "S Dhawan": { first: "Shikhar", last: "Dhawan", team: "PBKS", tags: ["gabbar", "sd"] },
  "DA Warner": { first: "David", last: "Warner", team: "DC", tags: ["bull", "dw"] },
  "KL Rahul": { first: "KL", last: "Rahul", team: "LSG", tags: ["klr"] },
  "SK Raina": { first: "Suresh", last: "Raina", team: "CSK", tags: ["mr ipl", "chinna thala", "skr"] },
  "MS Dhoni": { first: "MS", last: "Dhoni", team: "CSK", tags: ["mahi", "thala", "captain cool", "msd"] },
  "AM Rahane": { first: "Ajinkya", last: "Rahane", team: "CSK", tags: ["jinks"] },
  "AB de Villiers": { first: "AB", last: "de Villiers", team: "RCB", tags: ["abd", "mrv360", "alien", "ab", "de vill"] },
  "SV Samson": { first: "Sanju", last: "Samson", team: "RR", tags: ["sanju"] },
  "CH Gayle": { first: "Chris", last: "Gayle", team: "PBKS", tags: ["universe boss", "gayle storm", "cg"] },
  "RV Uthappa": { first: "Robin", last: "Uthappa", team: "CSK", tags: ["robbie"] },
  "KD Karthik": { first: "Dinesh", last: "Karthik", team: "RCB", tags: ["dk"] },
  "F du Plessis": { first: "Faf", last: "du Plessis", team: "RCB", tags: ["faf"] },
  "JC Buttler": { first: "Jos", last: "Buttler", team: "RR", tags: ["jos the boss"] },
  "Shubman Gill": { first: "Shubman", last: "Gill", team: "GT", tags: ["prince"] },
  "SA Yadav": { first: "Suryakumar", last: "Yadav", team: "MI", tags: ["sky", "surya"] },
  "AT Rayudu": { first: "Ambati", last: "Rayudu", team: "CSK", tags: [] },
  "SS Iyer": { first: "Shreyas", last: "Iyer", team: "KKR", tags: ["shreyas"] },
  "G Gambhir": { first: "Gautam", last: "Gambhir", team: "KKR", tags: ["gauti"] },
  "MK Pandey": { first: "Manish", last: "Pandey", team: "KKR", tags: [] },
  "SR Watson": { first: "Shane", last: "Watson", team: "CSK", tags: ["watto"] },
  "RR Pant": { first: "Rishabh", last: "Pant", team: "DC", tags: ["rp", "spiderman"] },
  "Ishan Kishan": { first: "Ishan", last: "Kishan", team: "MI", tags: ["ishan"] },
  "RA Jadeja": { first: "Ravindra", last: "Jadeja", team: "CSK", tags: ["jaddu", "sir", "rj"] },
  "Q de Kock": { first: "Quinton", last: "de Kock", team: "LSG", tags: ["qdk"] },
  "KA Pollard": { first: "Kieron", last: "Pollard", team: "MI", tags: ["polly", "kp"] },
  "DA Miller": { first: "David", last: "Miller", team: "GT", tags: ["killer miller"] },
  "YK Pathan": { first: "Yusuf", last: "Pathan", team: "KKR", tags: [] },
  "N Rana": { first: "Nitish", last: "Rana", team: "KKR", tags: [] },
  "HH Pandya": { first: "Hardik", last: "Pandya", team: "MI", tags: ["kung fu pandya", "hp"] },
  "WP Saha": { first: "Wriddhiman", last: "Saha", team: "GT", tags: ["superman"] },
  "BB McCullum": { first: "Brendon", last: "McCullum", team: "KKR", tags: ["baz"] },
  "PA Patel": { first: "Parthiv", last: "Patel", team: "RCB", tags: [] },
  "MA Agarwal": { first: "Mayank", last: "Agarwal", team: "SRH", tags: [] },
  "Yuvraj Singh": { first: "Yuvraj", last: "Singh", team: "PBKS", tags: ["yuvi"] },
  "V Sehwag": { first: "Virender", last: "Sehwag", team: "DC", tags: ["viru"] },
  "SPD Smith": { first: "Steve", last: "Smith", team: "RPS", tags: ["smudge"] },
  "M Vijay": { first: "Murali", last: "Vijay", team: "CSK", tags: ["monk"] },
  "RD Gaikwad": { first: "Ruturaj", last: "Gaikwad", team: "CSK", tags: ["rutu"] },
  "KS Williamson": { first: "Kane", last: "Williamson", team: "GT", tags: ["kane mama"] },
  "SE Marsh": { first: "Shaun", last: "Marsh", team: "PBKS", tags: [] },
  "JH Kallis": { first: "Jacques", last: "Kallis", team: "KKR", tags: [] },
  "DR Smith": { first: "Dwayne", last: "Smith", team: "CSK", tags: [] },
  "SR Tendulkar": { first: "Sachin", last: "Tendulkar", team: "MI", tags: ["master blaster", "god"] },
  "R Dravid": { first: "Rahul", last: "Dravid", team: "RR", tags: ["the wall"] },
  "JJ Bumrah": { first: "Jasprit", last: "Bumrah", team: "MI", tags: ["boom", "jb", "bum", "jas"] },
  "B Kumar": { first: "Bhuvneshwar", last: "Kumar", team: "SRH", tags: ["bhuvi"] },
  "YS Chahal": { first: "Yuzvendra", last: "Chahal", team: "RR", tags: ["yuzi"] },
  "Rashid Khan": { first: "Rashid", last: "Khan", team: "GT", tags: ["rashid"] },
  "A Mishra": { first: "Amit", last: "Mishra", team: "LSG", tags: ["mishy"] },
  "R Ashwin": { first: "Ravichandran", last: "Ashwin", team: "RR", tags: ["ash", "anna"] },
  "PP Chawla": { first: "Piyush", last: "Chawla", team: "MI", tags: [] },
  "SL Malinga": { first: "Lasith", last: "Malinga", team: "MI", tags: ["slinga"] },
  "Harbhajan Singh": { first: "Harbhajan", last: "Singh", team: "MI", tags: ["bhajji"] },
  "AR Patel": { first: "Axar", last: "Patel", team: "DC", tags: ["bapu"] },
  "AD Russell": { first: "Andre", last: "Russell", team: "KKR", tags: ["dre russ"] },
  "SP Narine": { first: "Sunil", last: "Narine", team: "KKR", tags: ["sunny"] },
  "DJ Bravo": { first: "Dwayne", last: "Bravo", team: "CSK", tags: ["champion", "djb"] },
  "CH Morris": { first: "Chris", last: "Morris", team: "RR", tags: [] },
  "KH Pandya": { first: "Krunal", last: "Pandya", team: "LSG", tags: [] },
  "UT Yadav": { first: "Umesh", last: "Yadav", team: "KKR", tags: [] },
  "TA Boult": { first: "Trent", last: "Boult", team: "RR", tags: ["boulty"] },
  "Mohammed Shami": { first: "Mohammed", last: "Shami", team: "GT", tags: ["lala"] },
  "K Rabada": { first: "Kagiso", last: "Rabada", team: "PBKS", tags: ["kg"] },
  "SN Thakur": { first: "Shardul", last: "Thakur", team: "CSK", tags: ["lord"] },
  "HV Patel": { first: "Harshal", last: "Patel", team: "PBKS", tags: ["purple patel"] },
  "I Sharma": { first: "Ishant", last: "Sharma", team: "DC", tags: [] },
  "Z Khan": { first: "Zaheer", last: "Khan", team: "MI", tags: ["zak"] },
  "P Kumar": { first: "Praveen", last: "Kumar", team: "PBKS", tags: [] },
  "A Nehra": { first: "Ashish", last: "Nehra", team: "CSK", tags: ["nehra ji"] },
  "MM Sharma": { first: "Mohit", last: "Sharma", team: "GT", tags: [] },
  "Sandeep Sharma": { first: "Sandeep", last: "Sharma", team: "RR", tags: ["sandy"] },
  "JD Unadkat": { first: "Jaydev", last: "Unadkat", team: "SRH", tags: [] },
  "Mohammed Siraj": { first: "Mohammed", last: "Siraj", team: "RCB", tags: ["miyan"] },
  "Arshdeep Singh": { first: "Arshdeep", last: "Singh", team: "PBKS", tags: [] },
  "S Dube": { first: "Shivam", last: "Dube", team: "CSK", tags: [] },
  "Rinku Singh": { first: "Rinku", last: "Singh", team: "KKR", tags: ["lord rinku"] },
  "YBK Jaiswal": { first: "Yashasvi", last: "Jaiswal", team: "RR", tags: ["yashasvi"] },
  "DP Conway": { first: "Devon", last: "Conway", team: "CSK", tags: [] },
  "GJ Maxwell": { first: "Glenn", last: "Maxwell", team: "RCB", tags: ["maxi", "big show"] },
  "MP Stoinis": { first: "Marcus", last: "Stoinis", team: "LSG", tags: ["hulk"] },
  "TH David": { first: "Tim", last: "David", team: "MI", tags: [] },
  "C Green": { first: "Cameron", last: "Green", team: "RCB", tags: [] },
  "Tilak Varma": { first: "Tilak", last: "Varma", team: "MI", tags: [] },
  "J Bairstow": { first: "Jonny", last: "Bairstow", team: "PBKS", tags: [] },
  "LS Livingstone": { first: "Liam", last: "Livingstone", team: "PBKS", tags: ["livo"] },
  "SM Curran": { first: "Sam", last: "Curran", team: "PBKS", tags: [] },
  "B Sai Sudharsan": { first: "Sai", last: "Sudharsan", team: "GT", tags: [] },
  "MM Ali": { first: "Moeen", last: "Ali", team: "CSK", tags: ["mo"] },
  "F Allen": { first: "Fabian", last: "Allen", team: "MI", tags: [] }
};

function generateMapping(cricsheetName) {
  let display_name = cricsheetName;
  let aliases = [cricsheetName.toLowerCase().replace(/[^\w\s]/g, '')];
  let team = "Free Agent";

  if (KNOWN_PLAYERS[cricsheetName]) {
    const p = KNOWN_PLAYERS[cricsheetName];
    display_name = `${p.first} ${p.last}`;
    team = p.team;
    aliases.push(p.first.toLowerCase());
    aliases.push(p.last.toLowerCase());
    aliases.push(`${p.first} ${p.last}`.toLowerCase());
    aliases.push(`${p.first[0]} ${p.last}`.toLowerCase());
    aliases.push(`${p.first[0]}${p.last}`.toLowerCase());
    aliases.push(`${p.first[0]}${p.last[0]}`.toLowerCase());
    
    p.tags.forEach(t => aliases.push(t.toLowerCase()));
  } else {
    // Basic heuristic for unknown players
    const parts = cricsheetName.split(' ');
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      const initials = parts[0];
      
      // Assume parts[0] is initials if it's all caps and length <= 3
      if (initials === initials.toUpperCase() && initials.length <= 3) {
        display_name = `${initials} ${last}`;
        aliases.push(last.toLowerCase());
        aliases.push(`${initials[0]} ${last}`.toLowerCase());
        aliases.push(`${initials[0]}${last}`.toLowerCase());
      } else {
        aliases.push(parts[0].toLowerCase());
        aliases.push(last.toLowerCase());
      }
    }
  }

  // We use ui-avatars as a fast, reliable photo placeholder strategy
  const photo = `https://ui-avatars.com/api/?name=${encodeURIComponent(display_name)}&background=random&color=fff&size=128`;

  return {
    cricsheet_name: cricsheetName,
    display_name,
    team,
    photo,
    aliases: Array.from(new Set(aliases))
  };
}

const mappings = playersData.map(p => generateMapping(p.name));

fs.writeFileSync(path.join(__dirname, '../lib/data/player-mappings.json'), JSON.stringify(mappings, null, 2));

console.log(`Generated ${mappings.length} mappings`);
