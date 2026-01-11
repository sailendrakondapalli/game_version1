# Battle Royale Game - Free Fire Inspired

A real-time multiplayer battle royale game built with React, Phaser 3, Socket.io, and Supabase. Inspired by Garena Free Fire with fast-paced arcade shooter mechanics.

## Features

### Authentication
- Email/password signup and login
- JWT-based authentication with Supabase
- Player profiles with persistent statistics

### Matchmaking & Lobby
- Quick match (automatic matchmaking)
- Private room creation with match codes
- Lobby chat system
- Auto-start when 10 players join

### Core Gameplay
- Real-time multiplayer (20-30 tick rate)
- Third-person top-down view
- WASD movement controls
- Mouse aim and shooting
- 4 weapon types: Pistol, AR, Sniper, Shotgun
- Health and armor system
- Safe zone shrinking mechanic
- Player death and spectate mode
- Kill feed and live stats

### UI Screens
- Login/Signup
- Home dashboard with quick match
- Lobby system for private matches
- In-game HUD (health, ammo, minimap)
- Game over results screen
- Leaderboard

### Technical Features
- Server-authoritative gameplay (anti-cheat)
- Real-time WebSocket communication
- Supabase database for persistence
- Responsive web design
- Performance optimized

## Tech Stack

### Frontend
- **React** - UI framework
- **Expo** - Development platform (web target)
- **Phaser 3** - Game engine
- **Socket.io-client** - Real-time communication
- **TypeScript** - Type safety

### Backend
- **Node.js** - Runtime
- **Express** - HTTP server
- **Socket.io** - WebSocket server
- **Supabase** - Database and authentication

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Modern web browser

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Copy your project URL and anon key from Settings > API
3. The database tables are already created via migrations

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_GAME_SERVER_URL=http://localhost:3001
```

### 4. Start the Game Server

In one terminal:

```bash
npm run server
```

The game server will start on port 3001.

### 5. Start the Frontend

In another terminal:

```bash
npm run dev
```

Then press `w` to open in web browser.

### 6. Create an Account and Play

1. Sign up with email and password
2. Choose a username
3. Click "Quick Match" to join a game
4. Wait for 10 players to join (or test with multiple browser windows)
5. Play!

## How to Play

### Controls
- **WASD** - Move your character
- **Mouse** - Aim
- **Left Click** - Shoot
- **R** - Reload
- **1-4** - Switch weapons (1: Pistol, 2: AR, 3: Sniper, 4: Shotgun)

### Objective
- Be the last player standing
- Stay inside the safe zone (blue circle)
- Collect weapons scattered on the map
- Eliminate other players
- The safe zone shrinks over time

### Weapons

| Weapon   | Damage | Fire Rate | Magazine | Range | Special        |
|----------|--------|-----------|----------|-------|----------------|
| Pistol   | 15     | Fast      | 12       | 300m  | Starter weapon |
| AR       | 25     | Very Fast | 30       | 500m  | Balanced       |
| Sniper   | 80     | Slow      | 5        | 800m  | High damage    |
| Shotgun  | 60     | Medium    | 6        | 150m  | 5 pellets      |

## Game Modes

### Quick Match
- Automatic matchmaking
- 10 players per match
- Fast-paced gameplay

### Private Match
1. Click "Lobby" tab
2. Create a private match
3. Share the match code with friends
4. Wait for players to join
5. Game starts automatically at 10 players

## Architecture

### Server-Authoritative Design
All critical game logic runs on the server:
- Movement validation
- Damage calculation
- Hit detection
- Safe zone mechanics
- Anti-cheat validation

### Real-Time Sync
- Server tick rate: 30 Hz
- Client interpolation for smooth movement
- Delta compression for bandwidth optimization
- Lag compensation for fair gameplay

### Database Schema

**player_stats**
- User statistics (kills, deaths, wins, matches)
- Persistent across sessions

**matches**
- Match history
- Win tracking

**match_players**
- Per-match statistics
- Performance tracking

## Development

### Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   ├── auth/              # Auth screens
│   └── game.tsx           # Game screen
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication
│   └── SocketContext.tsx  # WebSocket
├── game/                  # Phaser game
│   ├── scenes/            # Game scenes
│   ├── config.ts          # Game config
│   └── PhaserGame.tsx     # React wrapper
├── server/                # Game server
│   ├── index.js           # Main server
│   ├── gameManager.js     # Game logic
│   ├── matchManager.js    # Match logic
│   └── config.js          # Server config
└── lib/                   # Utilities
    └── supabase.ts        # Supabase client
```

### Adding New Features

#### New Weapon
1. Add weapon config to `server/config.js`
2. Update weapon switching in `game/scenes/GameScene.ts`
3. Add UI controls if needed

#### New Game Mode
1. Extend `MatchManager` in `server/matchManager.js`
2. Add UI in `app/(tabs)/lobby.tsx`
3. Create socket event handlers

## Performance Tips

### For Smooth Gameplay
- Use a stable internet connection
- Close unnecessary browser tabs
- Use Chrome or Firefox for best performance
- Lower graphics quality if experiencing lag

### Server Optimization
- Run server on dedicated machine
- Use PM2 for production: `pm2 start server/index.js`
- Monitor server load and scale horizontally

## Troubleshooting

### Connection Issues
- Ensure game server is running on port 3001
- Check EXPO_PUBLIC_GAME_SERVER_URL in .env
- Verify firewall allows WebSocket connections

### Game Not Starting
- Need exactly 10 players for match start
- Open multiple browser windows to test locally
- Check browser console for errors

### Authentication Errors
- Verify Supabase credentials in .env
- Check Supabase dashboard for user creation
- Ensure RLS policies are enabled

## Production Deployment

### Frontend (Expo Web)
```bash
npm run build:web
# Deploy dist folder to Vercel, Netlify, etc.
```

### Backend (Game Server)
```bash
# Use PM2 or Docker
pm2 start server/index.js --name "battle-royale-server"
```

### Environment Variables (Production)
```env
EXPO_PUBLIC_SUPABASE_URL=your_production_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_key
EXPO_PUBLIC_GAME_SERVER_URL=https://your-server-domain.com
```

## Future Enhancements

- [ ] Mobile touch controls
- [ ] Voice chat
- [ ] Ranked matchmaking
- [ ] Cosmetic skins
- [ ] Multiple maps
- [ ] Team modes (duo, squad)
- [ ] Replay system
- [ ] Tournament mode
- [ ] Inventory system
- [ ] Loot drops

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this project for learning or building your own games!

## Credits

Inspired by Garena Free Fire and other battle royale games.

Built with ❤️ using modern web technologies.

## Support

For issues, questions, or suggestions:
- Open a GitHub issue
- Check existing documentation
- Review console logs for errors

Happy Gaming! 🎮
