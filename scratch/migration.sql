-- migration.sql
-- This script safely migrates stats tables to use player_id instead of string names.

-- 1. batting_stats
ALTER TABLE public.batting_stats ADD COLUMN player_id character varying REFERENCES public.players(id);
UPDATE public.batting_stats SET player_id = p.id FROM public.players p WHERE public.batting_stats.player_name = p.short_name;
ALTER TABLE public.batting_stats DROP COLUMN player_name;

-- 2. bowling_stats
ALTER TABLE public.bowling_stats ADD COLUMN player_id character varying REFERENCES public.players(id);
UPDATE public.bowling_stats SET player_id = p.id FROM public.players p WHERE public.bowling_stats.player_name = p.short_name;
ALTER TABLE public.bowling_stats DROP COLUMN player_name;

-- 3. player_career_stats
ALTER TABLE public.player_career_stats ADD COLUMN player_id character varying REFERENCES public.players(id);
UPDATE public.player_career_stats SET player_id = p.id FROM public.players p WHERE public.player_career_stats.player_name = p.short_name;
ALTER TABLE public.player_career_stats DROP COLUMN player_name;

-- 4. batter_advanced
ALTER TABLE public.batter_advanced ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.batter_advanced SET batter_id = p.id FROM public.players p WHERE public.batter_advanced.batter = p.short_name;
ALTER TABLE public.batter_advanced DROP COLUMN batter;

-- 5. bowler_advanced
ALTER TABLE public.bowler_advanced ADD COLUMN bowler_id character varying REFERENCES public.players(id);
UPDATE public.bowler_advanced SET bowler_id = p.id FROM public.players p WHERE public.bowler_advanced.bowler = p.short_name;
ALTER TABLE public.bowler_advanced DROP COLUMN bowler;

-- 6. player_vs_player
ALTER TABLE public.player_vs_player ADD COLUMN batter_id character varying REFERENCES public.players(id);
ALTER TABLE public.player_vs_player ADD COLUMN bowler_id character varying REFERENCES public.players(id);
UPDATE public.player_vs_player SET batter_id = p.id FROM public.players p WHERE public.player_vs_player.batter = p.short_name;
UPDATE public.player_vs_player SET bowler_id = p.id FROM public.players p WHERE public.player_vs_player.bowler = p.short_name;
ALTER TABLE public.player_vs_player DROP COLUMN batter;
ALTER TABLE public.player_vs_player DROP COLUMN bowler;

-- 7. death_overs_stats_batting
ALTER TABLE public.death_overs_stats_batting ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.death_overs_stats_batting SET batter_id = p.id FROM public.players p WHERE public.death_overs_stats_batting.batter = p.short_name;
ALTER TABLE public.death_overs_stats_batting DROP COLUMN batter;

-- 8. middle_overs_stats_batting
ALTER TABLE public.middle_overs_stats_batting ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.middle_overs_stats_batting SET batter_id = p.id FROM public.players p WHERE public.middle_overs_stats_batting.batter = p.short_name;
ALTER TABLE public.middle_overs_stats_batting DROP COLUMN batter;

-- 9. powerplay_stats_batting
ALTER TABLE public.powerplay_stats_batting ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.powerplay_stats_batting SET batter_id = p.id FROM public.players p WHERE public.powerplay_stats_batting.batter = p.short_name;
ALTER TABLE public.powerplay_stats_batting DROP COLUMN batter;

-- 10. powerplay_stats_bowling
ALTER TABLE public.powerplay_stats_bowling ADD COLUMN bowler_id character varying REFERENCES public.players(id);
UPDATE public.powerplay_stats_bowling SET bowler_id = p.id FROM public.players p WHERE public.powerplay_stats_bowling.bowler = p.short_name;
ALTER TABLE public.powerplay_stats_bowling DROP COLUMN bowler;

-- 11. player_vs_team
ALTER TABLE public.player_vs_team ADD COLUMN player_id character varying REFERENCES public.players(id);
UPDATE public.player_vs_team SET player_id = p.id FROM public.players p WHERE public.player_vs_team.player_name = p.short_name;
ALTER TABLE public.player_vs_team DROP COLUMN player_name;

-- 12. player_vs_venue
ALTER TABLE public.player_vs_venue ADD COLUMN player_id character varying REFERENCES public.players(id);
UPDATE public.player_vs_venue SET player_id = p.id FROM public.players p WHERE public.player_vs_venue.player_name = p.short_name;
ALTER TABLE public.player_vs_venue DROP COLUMN player_name;

-- 13. match_impact_log
ALTER TABLE public.match_impact_log ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.match_impact_log SET batter_id = p.id FROM public.players p WHERE public.match_impact_log.batter = p.short_name;
ALTER TABLE public.match_impact_log DROP COLUMN batter;

-- 14. player_context_stats
ALTER TABLE public.player_context_stats ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.player_context_stats SET batter_id = p.id FROM public.players p WHERE public.player_context_stats.batter = p.short_name;
ALTER TABLE public.player_context_stats DROP COLUMN batter;

-- 15. player_match_impact
ALTER TABLE public.player_match_impact ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.player_match_impact SET batter_id = p.id FROM public.players p WHERE public.player_match_impact.batter = p.short_name;
ALTER TABLE public.player_match_impact DROP COLUMN batter;

-- 16. player_over_stats
ALTER TABLE public.player_over_stats ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.player_over_stats SET batter_id = p.id FROM public.players p WHERE public.player_over_stats.batter = p.short_name;
ALTER TABLE public.player_over_stats DROP COLUMN batter;

-- 17. player_phase_stats
ALTER TABLE public.player_phase_stats ADD COLUMN batter_id character varying REFERENCES public.players(id);
UPDATE public.player_phase_stats SET batter_id = p.id FROM public.players p WHERE public.player_phase_stats.batter = p.short_name;
ALTER TABLE public.player_phase_stats DROP COLUMN batter;
