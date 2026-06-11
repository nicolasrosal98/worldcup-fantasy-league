# 🏆 Laslo League — World Cup 2026 Fantasy

A private, password-gated fantasy prediction league for the 2026 World Cup,
built with Next.js (App Router) and Supabase (`supabase-js` from the browser).

## How it works

- **Gate**: friends enter the shared league password, then sign in with their
  email — Supabase emails a 6-digit one-time code (new emails sign up
  automatically). First-timers pick a name + avatar; returning players land
  straight on their profile.
- **Predictions**: for every match, pick the exact score, up to 3 goalscorers,
  and an optional "first goal half" bonus bet. Editable until kickoff.
- **Side bets 🎰**: per match, optionally bet on both-teams-to-score,
  over/under 2.5 goals, a red card, a penalty, or a hat-trick. Right bets
  pay out, wrong bets cost −1 — just like the bookies.
- **Daily boost ⚡**: once per day you can double one match's points.
- **Daily duel ⚔️**: every matchday you're paired against another player
  (rotating round-robin) — most points from that day's matches wins +3.
- **Perfect day 🌟**: call the outcome of every match on a 2+ match day
  for +5.
- **Against the crowd 🦄**: +3 when you call an outcome right and the
  league majority picked differently.
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
| 🦄 Against the crowd (correct outcome vs league majority) | +3 |
| 🌟 Perfect day (all outcomes right, 2+ match day) | +5 |
| ⚔️ Daily duel win | +3 |
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
npm run dev   # http://localhost:3000
```

Create `.env.local` with the two Supabase keys (dashboard → Settings → API):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The app talks to Supabase straight from the browser with `@supabase/supabase-js`
and the publishable key — no server-side database connection. Players sign in
with an email OTP code (Supabase Auth); Row Level Security policies (see
`supabase/migrations/`) open the league tables to authenticated users only,
and you can only edit your own profile and predictions. The schema and
policies are already applied to the live project (`worldcup-fantasy-league`),
and the opening-week fixtures are seeded.

### Auth setup (one-time, Supabase dashboard)

The email "Magic Link" template must include the OTP code. In
**Auth → Email Templates → Magic Link**, make sure the body contains
`{{ .Token }}`, e.g.:

```html
<h2>Your Laslo League code</h2>
<p>Enter this code to sign in: <strong>{{ .Token }}</strong></p>
```

Supabase's built-in email service is heavily rate-limited (a few emails per
hour) — fine for testing, but configure a custom SMTP provider
(**Auth → SMTP Settings**) before the league goes live.

Other env vars (optional): `NEXT_PUBLIC_LEAGUE_PASSWORD`,
`NEXT_PUBLIC_ADMIN_PASSWORD`.
