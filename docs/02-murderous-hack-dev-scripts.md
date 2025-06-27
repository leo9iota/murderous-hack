# Murderous Hack Development Scripts

Simple, concise TypeScript scripts using Bun's shell API for easy development workflow management.

## 🚀 Quick Commands

```bash
# First time setup (dependencies, database, schema)
bun run setup

# Start development servers (backend + frontend)
bun run start

# Stop all services
bun run stop
```

## 📋 Scripts

### `setup.ts` - Complete Environment Setup

- Creates `.env` file from `.env.example` (if needed)
- Installs root dependencies (`bun install`)
- Installs frontend dependencies (`cd frontend && bun install`)
- Starts PostgreSQL database container
- Sets up database schema (`bunx drizzle-kit push`)
- **Run this once when setting up the project**

### `start.ts` - Start Development Environment

- Checks and starts PostgreSQL database (if not running)
- Kills any existing processes on ports 3000/3001
- Starts backend server on `http://localhost:3000` (from root)
- Starts frontend server on `http://localhost:3001` (from frontend/)
- Handles graceful shutdown with Ctrl+C
- **Use this for daily development**

### `stop.ts` - Stop All Services

- Stops frontend and backend servers (ports 3000/3001)
- Stops Docker database container
- **Clean shutdown of all services**

## 🌐 URLs

- **Frontend**: http://localhost:3001 (runs from `frontend/` directory)
- **Backend API**: http://localhost:3000 (runs from root directory)
- **Database**: PostgreSQL on localhost:5432

## 📁 Project Structure

```
murderous-hack/
├── scripts/                 # Development scripts (Simple & Concise)
│   ├── setup.ts            # Complete environment setup
│   ├── start.ts            # Start development servers
│   └── stop.ts             # Stop all services
├── server/                 # Backend code (runs from root)
├── frontend/               # Frontend code (runs from frontend/)
├── compose.yml             # Docker configuration
├── drizzle.config.ts       # Database configuration
└── package.json            # Root package.json
```

## ✨ Features

- **Simple & Concise**: Minimal, focused scripts that do exactly what they need
- **Directory Aware**: Properly handles running backend from root and frontend from frontend/
- **TypeScript**: Full type safety with Bun's shell API
- **Graceful Shutdown**: Proper cleanup on Ctrl+C
- **Port Management**: Automatic port conflict resolution
- **Health Checks**: Waits for PostgreSQL to be ready
- **Error Handling**: Clear error messages and proper exit codes

## 🐛 Troubleshooting

### Port Already in Use

```bash
bun run stop  # Kills processes on ports 3000/3001
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps

# Restart database
docker compose restart postgres-db

# Full restart
bun run stop && bun run start
```

### Docker Issues

- Make sure Docker is running
- Try restarting Docker Desktop
- Check logs: `docker compose logs postgres-db`

## 💡 Tips

1. **First time?** Run `bun run setup` for complete setup
2. **Daily development?** Use `bun run start`
3. **Schema changes?** Use `bun run db:push`
4. **Stuck?** Try `bun run stop` then `bun run start`

## 🔄 Typical Workflow

```bash
# First time setup
bun run setup

# Daily development
bun run start
# ... do your development work ...
# Press Ctrl+C to stop when done

# Next day
bun run start
# ... continue development ...
```

## 🛠️ Technical Details

- **Shell API**: Uses `import { $ } from "bun"` for shell commands
- **Process Management**: Spawns processes with `Bun.spawn()` with proper directory context
- **Directory Handling**: Backend runs from root, frontend runs from `frontend/`
- **Signal Handling**: Proper SIGINT handling for graceful shutdown
- **Port Management**: Uses `npx kill-port` for reliable port cleanup
- **Health Checks**: Simple PostgreSQL readiness checks
