-- Already applied to the live project as migration "add_top_scorer_pick".
-- Golden Boot pick: tournament top scorer, locks with the champion pick
alter table public.users add column top_scorer_pick text;
