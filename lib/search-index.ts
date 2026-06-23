import Fuse from "fuse.js";
import playerMappings from "./data/player-mappings.json";

export interface PlayerEntry {
  cricsheet_name: string;
  display_name: string;
  team: string;
  photo: string;
  aliases: string[];
}

export const playerIndex: PlayerEntry[] = playerMappings as PlayerEntry[];

export function searchPlayerFuzzy(query: string, limit: number = 5): PlayerEntry[] {
  if (!query) return [];
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/gi, '').trim();
  
  if (!cleanQuery) return [];

  // 1. Exact or strict prefix match on aliases
  const exactMatches: PlayerEntry[] = [];
  const prefixMatches: PlayerEntry[] = [];
  const substringMatches: PlayerEntry[] = [];
  const matchedIds = new Set<string>();

  for (const p of playerIndex) {
    let isExact = false;
    let isPrefix = false;
    let isSubstring = false;

    if (p.display_name.toLowerCase() === cleanQuery || p.cricsheet_name.toLowerCase() === cleanQuery || p.aliases.includes(cleanQuery)) {
      isExact = true;
    } else {
      for (const alias of p.aliases) {
        if (alias.startsWith(cleanQuery)) {
          isPrefix = true;
          break; // Stop checking aliases for this player if prefix matched
        }
        if (alias.includes(cleanQuery)) {
          isSubstring = true;
        }
      }
    }

    if (isExact) {
      exactMatches.push(p);
      matchedIds.add(p.cricsheet_name);
    } else if (isPrefix && !matchedIds.has(p.cricsheet_name)) {
      prefixMatches.push(p);
      matchedIds.add(p.cricsheet_name);
    } else if (isSubstring && !matchedIds.has(p.cricsheet_name)) {
      substringMatches.push(p);
      matchedIds.add(p.cricsheet_name);
    }
  }

  const combined = [...exactMatches, ...prefixMatches, ...substringMatches];
  
  if (combined.length >= limit) {
    return combined.slice(0, limit);
  }

  // 2. Fallback to Fuse.js for typos
  const fuse = new Fuse(playerIndex, {
    keys: [
      { name: "display_name", weight: 3 },
      { name: "aliases", weight: 2 },
      { name: "cricsheet_name", weight: 1 }
    ],
    threshold: 0.3, // strict threshold to prevent weird fuzzy matches like "virat" matching something completely off
    ignoreLocation: true,
  });

  const fuseResults = fuse.search(cleanQuery).map(r => r.item);
  
  for (const item of fuseResults) {
    if (!matchedIds.has(item.cricsheet_name)) {
      combined.push(item);
      matchedIds.add(item.cricsheet_name);
    }
  }

  return combined.slice(0, limit);
}
