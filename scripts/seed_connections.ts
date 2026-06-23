import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  const today = new Date().toISOString().split("T")[0];

  const allTimeData = [
    { id: "at1", title: "IPL MVPS OF LAST 4 SEASONS", items: ["JOS BUTTLER", "SHUBMAN GILL", "SUNIL NARINE", "SURYAKUMAR YADAV"], difficulty: 1, color: "bg-yellow-400" },
    { id: "at2", title: "FASTEST IPL FIFTIES", items: ["YASHASVI JAISWAL", "URVIL PATEL", "KL RAHUL", "PAT CUMMINS"], difficulty: 2, color: "bg-green-400" },
    { id: "at3", title: "MULTIPLE TIME CHAMPIONS", items: ["RCB", "MI", "CSK", "KKR"], difficulty: 3, color: "bg-blue-400" },
    { id: "at4", title: "DEBUT CAPTAINCY TROPHY", items: ["SHANE WARNE", "HARDIK PANDYA", "ROHIT SHARMA", "RAJAT PATIDAR"], difficulty: 4, color: "bg-purple-400" }
  ];

  const season26Data = [
    { id: "s26_1", title: "SUPER STRIKERS", items: ["SOORYAVANSHI", "FINN ALLEN", "PRIYANSH ARYA", "ABHISHEK SHARMA"], difficulty: 1, color: "bg-yellow-400" },
    { id: "s26_2", title: "QUALIFIED TEAM CAPTAINS", items: ["RAJAT PATIDAR", "RIYAN PARAG", "GILL", "CUMMINS"], difficulty: 2, color: "bg-green-400" },
    { id: "s26_3", title: "MOST GREEN DOT BALLS", items: ["SIRAJ", "RABADA", "BHUVI", "ARCHER"], difficulty: 3, color: "bg-blue-400" },
    { id: "s26_4", title: "FOREIGN SPINNERS", items: ["RASHID KHAN", "AKEAL HOSEIN", "SUNIL NARINE", "NOOR AHMED"], difficulty: 4, color: "bg-purple-400" }
  ];

  console.log("Upserting all_time...");
  const { error: err1 } = await supabase.from("connections_puzzles").upsert(
    { puzzle_date: today, puzzle_type: "all_time", categories: allTimeData },
    { onConflict: 'puzzle_date,puzzle_type' }
  );
  if (err1) console.error("Error all_time:", err1);

  console.log("Upserting season_26...");
  const { error: err2 } = await supabase.from("connections_puzzles").upsert(
    { puzzle_date: today, puzzle_type: "season_26", categories: season26Data },
    { onConflict: 'puzzle_date,puzzle_type' }
  );
  if (err2) console.error("Error season_26:", err2);

  console.log("Seed complete.");
}

seed();
