export const TEAM_ASSETS: Record<string, { logo: string, color: string, abbr: string }> = {
  "Chennai Super Kings": { logo: "/logos/csk.png", color: "#FFFF3C", abbr: "CSK" },
  "Mumbai Indians": { logo: "/logos/mi.png", color: "#004BA0", abbr: "MI" },
  "Royal Challengers Bangalore": { logo: "/logos/rcb.png", color: "#EC1C24", abbr: "RCB" },
  "Royal Challengers Bengaluru": { logo: "/logos/rcb.png", color: "#EC1C24", abbr: "RCB" },
  "Kolkata Knight Riders": { logo: "/logos/kkr.png", color: "#2E0854", abbr: "KKR" },
  "Rajasthan Royals": { logo: "/logos/rr.png", color: "#EA1A85", abbr: "RR" },
  "Sunrisers Hyderabad": { logo: "/logos/srh.png", color: "#FF822A", abbr: "SRH" },
  "Delhi Capitals": { logo: "/logos/dc.png", color: "#00008B", abbr: "DC" },
  "Delhi Daredevils": { logo: "/logos/dd.png", color: "#00008B", abbr: "DD" },
  "Punjab Kings": { logo: "/logos/pbks.png", color: "#ED1B24", abbr: "PBKS" },
  "Kings XI Punjab": { logo: "/logos/pbks.png", color: "#ED1B24", abbr: "KXIP" },
  "Gujarat Titans": { logo: "/logos/gt.png", color: "#1B2133", abbr: "GT" },
  "Lucknow Super Giants": { logo: "/logos/lsg.png", color: "#A855F7", abbr: "LSG" },
  "Deccan Chargers": { logo: "/logos/dc.png", color: "#003366", abbr: "DEC" },
  "Pune Warriors": { logo: "/logos/pwi.png", color: "#2E0854", abbr: "PWI" },
  "Pune Warriors India": { logo: "/logos/pwi.png", color: "#2E0854", abbr: "PWI" },
  "Gujarat Lions": { logo: "/logos/gl.png", color: "#FF822A", abbr: "GL" },
  "Rising Pune Supergiant": { logo: "/logos/rps.png", color: "#D11D70", abbr: "RPS" },
  "Kochi Tuskers Kerala": { logo: "/logos/ktk.png", color: "#F86E14", abbr: "KTK" }
};

export function getTeamAssets(teamName: string) {
  const normalized = teamName.trim();
  if (TEAM_ASSETS[normalized]) return TEAM_ASSETS[normalized];
  
  for (const [key, value] of Object.entries(TEAM_ASSETS)) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return { logo: "/logos/default.png", color: "#6b7280", abbr: teamName.substring(0, 3).toUpperCase() };
}
