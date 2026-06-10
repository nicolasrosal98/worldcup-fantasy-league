-- Already applied to the live project (cxajvygxdeptdsdjomdr) as migration
-- "initial_schema"; kept here as the schema of record.
-- Timestamps are stored as ISO-8601 text (UTC) to match the app's string
-- handling, carried over from the original SQLite schema.

create table public.users (
  id bigint generated always as identity primary key,
  username text not null,
  avatar text not null default '⚽',
  winner_pick text,
  created_at text not null default to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
);
create unique index users_username_lower_idx on public.users (lower(username));

create table public.matches (
  id bigint generated always as identity primary key,
  stage text not null,
  home text not null,
  away text not null,
  kickoff text not null, -- ISO datetime UTC
  venue text,
  home_score integer,    -- null until result entered
  away_score integer,
  scorers text,          -- JSON array of player names
  notes text             -- extra match info (cards, MOTM, etc.)
);

create table public.predictions (
  id bigint generated always as identity primary key,
  user_id bigint not null references public.users(id),
  match_id bigint not null references public.matches(id),
  home_score integer not null,
  away_score integer not null,
  scorers text not null default '[]', -- JSON array, predicted scorers (max 3)
  first_goal_half integer,            -- 1 or 2, bonus bet (null = no bet)
  boost integer not null default 0,   -- daily boost: doubles match points
  points integer,                     -- computed when result entered
  created_at text not null default to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  updated_at text not null default to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  unique (user_id, match_id)
);

-- The app talks to Postgres directly with the database password; PostgREST
-- access stays locked down (RLS on, no policies).
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
