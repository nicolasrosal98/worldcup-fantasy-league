-- Already applied to the live project as migration "add_side_bets".
-- Betting-style side bets per prediction, stored as a JSON object:
-- { btts: bool|null, goals: 'over'|'under'|null,
--   red_card: bool|null, penalty: bool|null, hat_trick: bool|null }
alter table public.predictions add column side_bets text not null default '{}';
