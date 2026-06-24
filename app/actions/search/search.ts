"use server";

import { searchPlayerFuzzy } from "@/lib/search-index";

export async function searchLocalPlayers(query: string) {
  return searchPlayerFuzzy(query);
}
