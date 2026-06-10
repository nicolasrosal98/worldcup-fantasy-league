# 🏆 Laslo League — World Cup 2026 Fantasy

A private, password-gated fantasy prediction league for the 2026 World Cup,
built with Next.js (App Router) and Supabase Postgres.

## How it works

- **Gate**: friends enter the shared league password, then create (or log back
  into) a profile with a name + avatar. No real accounts or emails.
- **Predictions**: for every match, pick the exact score, up to 3 goalscorers,
  and an optional "first goal half" bonus bet. Editable until kickoff.
- **Side bets 🎰**: per match, optionally bet on both-teams-to-score,
  over/under 2.5 goals, a red card, a penalty, or a hat-trick. Right bets
  pay out, wrong bets cost −1 — just like the bookies.
- **Daily boost ⚡**: once per day you can double one match's points.
- **Champion & Golden Boot picks**: pick the champion (25 pts) and the
  tournament top scorer (15 pts). Both stay open through the whole group
  stage and only lock when the first knockout match kicks off — watch the
  groups, then commit.
- **Points breakdown**: finished match cards show exactly where every point
  came from (and which bets backfired).
- **Daily engagement**: the dashboard nudges you about today's unpredicted
  matches and tracks your prediction streak 🔥.
- **Leaderboard**: live ranking, exact-score tiebreaker, highlights your row.

## Scoring

| Rule | Points |
|---|---|
| Exact score | 5 |
| Correct outcome (win/draw/loss) | 2 |
| Each correct scorer (max 3) | +3 |
| All named scorers correct (2+) | ×1.5 multiplier |
| First-goal-half bet | +2 right / −1 wrong |
| 🎰 Both teams to score (yes/no) | +2 right / −1 wrong |
| 🎰 Over/under 2.5 goals | +2 right / −1 wrong |
| 🎰 Red card shown | +3 right / −1 wrong |
| 🎰 Penalty awarded | +2 right / −1 wrong |
| 🎰 Hat-trick scored | +5 right / −1 wrong |
| Daily boost | ×2 on one match |
| Champion pick (locks at knockouts) | +25 |
| 👟 Golden Boot pick (locks at knockouts) | +15 |

## Updating results

Visit `/admin` (default admin password `laslo2026!&admin`) after each match to
enter the final score, scorers, first-goal half and a highlights note. Saving
recomputes everyone's points instantly. You can also add knockout fixtures
there as the bracket fills in.

> The seeded fixtures are the opening week; verify/adjust them in `/admin`
> against the official schedule.

## Running

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL
npm run dev                   # http://localhost:3000
```

Storage is a persistent Postgres database on Supabase (project
`worldcup-fantasy-league`). Set `DATABASE_URL` to the connection string from
the Supabase dashboard (Connect → use the transaction pooler URI on
serverless hosts like Vercel). The schema lives in `supabase/migrations/`
and is already applied; the opening-week fixtures are seeded in the DB.

Other env vars (optional): `LEAGUE_PASSWORD`, `ADMIN_PASSWORD`,
`SESSION_SECRET`.
