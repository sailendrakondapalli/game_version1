# Quick Start Guide

Get your battle royale game running in 5 minutes!

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Supabase (Already Done!)
Your Supabase is already configured in the `.env` file.

## Step 3: Start the Game Server
Open a terminal and run:
```bash
npm run server
```

You should see:
```
Game server running on port 3001
Tick rate: 30 Hz
```

## Step 4: Start the Frontend
Open another terminal and run:
```bash
npm run dev
```

Press `w` to open in your web browser.

## Step 5: Create an Account
1. Click "Sign Up"
2. Enter email, username, and password
3. Click "Sign Up"

## Step 6: Play!
1. Click "Quick Match" on the home screen
2. Wait for 10 players (or open 10 browser tabs to test locally)
3. Game starts automatically!

## Controls
- **WASD** - Move
- **Mouse** - Aim & Click to shoot
- **R** - Reload
- **1-4** - Switch weapons

## Testing Multiplayer Locally
Open multiple browser windows/tabs:
1. Sign up different accounts in each tab
2. Click "Quick Match" in all tabs
3. Once 10 players join, the game starts!

## Troubleshooting

### Can't connect to server?
- Make sure the server is running (`npm run server`)
- Check that nothing else is using port 3001

### Game not starting?
- Need exactly 10 players for a match
- Open more browser tabs to reach 10 players

### Authentication error?
- The database migrations are already applied
- Try refreshing the page

## What's Next?
Check out the full README.md for:
- Detailed game mechanics
- Production deployment
- Contributing guidelines
- Architecture details

Happy gaming! 🎮
