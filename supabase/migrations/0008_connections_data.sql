-- Insert user-provided connection data
INSERT INTO connections_puzzles (puzzle_date, puzzle_type, categories)
VALUES 
(
  CURRENT_DATE, 
  'all_time',
  '[
    { "id": "at1", "title": "IPL MVPS OF LAST 4 SEASONS", "items": ["JOS BUTTLER", "SHUBMAN GILL", "SUNIL NARINE", "SURYAKUMAR YADAV"], "difficulty": 1, "color": "bg-yellow-400" },
    { "id": "at2", "title": "FASTEST IPL FIFTIES", "items": ["YASHASVI JAISWAL", "URVIL PATEL", "KL RAHUL", "PAT CUMMINS"], "difficulty": 2, "color": "bg-green-400" },
    { "id": "at3", "title": "MULTIPLE TIME CHAMPIONS", "items": ["RCB", "MI", "CSK", "KKR"], "difficulty": 3, "color": "bg-blue-400" },
    { "id": "at4", "title": "DEBUT CAPTAINCY TROPHY", "items": ["SHANE WARNE", "HARDIK PANDYA", "ROHIT SHARMA", "RAJAT PATIDAR"], "difficulty": 4, "color": "bg-purple-400" }
  ]'::jsonb
),
(
  CURRENT_DATE, 
  'season_26',
  '[
    { "id": "s26_1", "title": "SUPER STRIKERS", "items": ["SOORYAVANSHI", "FINN ALLEN", "PRIYANSH ARYA", "ABHISHEK SHARMA"], "difficulty": 1, "color": "bg-yellow-400" },
    { "id": "s26_2", "title": "QUALIFIED TEAM CAPTAINS", "items": ["RAJAT PATIDAR", "RIYAN PARAG", "GILL", "CUMMINS"], "difficulty": 2, "color": "bg-green-400" },
    { "id": "s26_3", "title": "MOST GREEN DOT BALLS", "items": ["SIRAJ", "RABADA", "BHUVI", "ARCHER"], "difficulty": 3, "color": "bg-blue-400" },
    { "id": "s26_4", "title": "FOREIGN SPINNERS", "items": ["RASHID KHAN", "AKEAL HOSEIN", "SUNIL NARINE", "NOOR AHMED"], "difficulty": 4, "color": "bg-purple-400" }
  ]'::jsonb
)
ON CONFLICT (puzzle_date, puzzle_type) 
DO UPDATE SET categories = EXCLUDED.categories;
