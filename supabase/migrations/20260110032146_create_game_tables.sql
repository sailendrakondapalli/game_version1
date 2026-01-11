/*
  # Battle Royale Game Database Schema

  1. New Tables
    - `player_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `username` (text, unique)
      - `kills` (integer, total kills)
      - `deaths` (integer, total deaths)
      - `wins` (integer, total wins)
      - `matches_played` (integer, total matches)
      - `damage_dealt` (integer, total damage)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `matches`
      - `id` (uuid, primary key)
      - `match_code` (text, unique match identifier)
      - `status` (text, waiting/active/finished)
      - `winner_id` (uuid, references player_stats)
      - `max_players` (integer, default 10)
      - `current_players` (integer, default 0)
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `match_players`
      - `id` (uuid, primary key)
      - `match_id` (uuid, references matches)
      - `player_id` (uuid, references player_stats)
      - `kills` (integer, kills in this match)
      - `damage_dealt` (integer, damage in this match)
      - `placement` (integer, final placement)
      - `survived_time` (integer, seconds survived)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Add policies for users to update their stats
    - Add policies for viewing match history
*/

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  kills integer DEFAULT 0,
  deaths integer DEFAULT 0,
  wins integer DEFAULT 0,
  matches_played integer DEFAULT 0,
  damage_dealt integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_code text UNIQUE NOT NULL,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  winner_id uuid REFERENCES player_stats(id),
  max_players integer DEFAULT 10,
  current_players integer DEFAULT 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create match_players table
CREATE TABLE IF NOT EXISTS match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES player_stats(id) ON DELETE CASCADE NOT NULL,
  kills integer DEFAULT 0,
  damage_dealt integer DEFAULT 0,
  placement integer,
  survived_time integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(match_id, player_id)
);

-- Enable RLS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- Player Stats Policies
CREATE POLICY "Users can view all player stats"
  ON player_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own stats"
  ON player_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON player_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Matches Policies
CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Match Players Policies
CREATE POLICY "Anyone can view match players"
  ON match_players FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players can join matches"
  ON match_players FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Players can update their match data"
  ON match_players FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_username ON player_stats(username);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_code ON matches(match_code);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);

-- Relax insert policy
drop policy if exists "Users can insert their own stats" on public.player_stats;

create policy "Users can insert their own stats"
on public.player_stats
for insert
to authenticated
with check (
  auth.uid() = user_id OR user_id IS NULL
);

-- Auto-fill user_id if missing
create or replace function set_player_stats_user()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_player_stats_user_trigger on public.player_stats;

create trigger set_player_stats_user_trigger
before insert on public.player_stats
for each row
execute function set_player_stats_user();
