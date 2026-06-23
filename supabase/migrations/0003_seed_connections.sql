-- Insert seed data for today
INSERT INTO connections_puzzles (puzzle_date, puzzle_type, categories)
VALUES 
(
  CURRENT_DATE, 
  'season_26',
  '[
    { "id": "c1", "title": "CSK PLAYERS", "items": ["DHONI", "JADEJA", "RUTURAJ", "DUBAE"], "difficulty": 1 },
    { "id": "c2", "title": "FAST BOWLERS", "items": ["BUMRAH", "SHAMI", "ARCHER", "NORTJE"], "difficulty": 2 },
    { "id": "c3", "title": "OPENERS", "items": ["KOHLI", "WARNER", "GILL", "JAISWAL"], "difficulty": 3 },
    { "id": "c4", "title": "LEFT ARM SPINNERS", "items": ["AXAR", "KULDEEP", "CHAHAR", "SANTNER"], "difficulty": 4 }
  ]'::jsonb
),
(
  CURRENT_DATE, 
  'all_time',
  '[
    { "id": "a1", "title": "PURPLE CAP WINNERS", "items": ["BRAVO", "KUMAR", "PATEL", "CHAHAL"], "difficulty": 1 },
    { "id": "a2", "title": "ORANGE CAP WINNERS", "items": ["KOHLI", "WARNER", "RAHUL", "GAYLE"], "difficulty": 2 },
    { "id": "a3", "title": "PLAYED FOR CSK & MI", "items": ["HARBHAJAN", "RAYUDU", "PARTHIV", "TIWARY"], "difficulty": 3 },
    { "id": "a4", "title": "IPL HAT-TRICK BOWLERS", "items": ["MISHRA", "RASHID", "NARINE", "YUVRAJ"], "difficulty": 4 }
  ]'::jsonb
)
ON CONFLICT (puzzle_date, puzzle_type) DO NOTHING;
