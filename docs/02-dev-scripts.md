# BetterNews Development Scripts

This directory contains TypeScript scripts using Bun's shell API to easily manage the BetterNews development environment.

## 🚀 Quick Start

### One Command Setup & Start

```bash
# Setup everything and start development environment
bun run dev:all
```

### First Time Setup Only

```bash
# Run this once to set up everything (without starting servers)
bun run dev:setup
```

### Daily Development

```bash
# Start all services (database, backend, frontend)
bun run dev:start

# Stop all services
bun run dev:stop

# Reset database and restart (⚠️ deletes all data)
bun run dev:reset
```

## 📋 Available Scripts

### `main.ts` - Complete Setup & Start (RECOMMENDED)

-   Checks for required tools (Bun, Docker)
-   Creates `.env` file from `.env.example`
-   Installs all dependencies (root + frontend)
-   Starts PostgreSQL database
-   Sets up database schema
-   Starts development servers
-   **One command to rule them all!**

### `setup.ts` - Initial Environment Setup Only

-   Checks for required tools (Bun, Docker)
-   Creates `.env` file from `.env.example`
-   Installs all dependencies (root + frontend)
-   Starts PostgreSQL database
-   Sets up database schema
-   **Run this once when setting up the project**

### `start.ts` - Start Development Environment

-   Starts PostgreSQL database (if not running)
-   Starts backend server on `http://localhost:3000`
-   Starts frontend server on `http://localhost:3001`
-   Handles graceful shutdown with Ctrl+C
-   **Use this for daily development**

### `stop.ts` - Stop All Services

-   Stops frontend and backend servers
-   Stops Docker services
-   Cleans up processes on ports 3000 and 3001

### `reset.ts` - Reset Database and Restart

-   ⚠️ **WARNING: Deletes all data!**
-   Interactive confirmation (or use `--yes` flag)
-   Stops all services
-   Removes database container and volumes
-   Creates fresh database with clean schema
-   Restarts all services

## 🔧 Manual Database Commands

```bash
# Push schema changes to database
bun run db:push

# Generate migration files
bun run db:generate

# Apply migrations
bun run db:migrate
```

## 🌐 Service URLs

-   **Frontend**: http://localhost:3001
-   **Backend API**: http://localhost:3000
-   **Database**: PostgreSQL on localhost:5432

## 📁 Project Structure

```
murderous-hack/
├── dev/                    # Development scripts (TypeScript + Bun Shell API)
│   ├── main.ts            # Complete setup & start
│   ├── setup.ts           # Initial setup only
│   ├── start.ts           # Start services
│   ├── stop.ts            # Stop services
│   ├── reset.ts           # Reset database
│   ├── utils.ts           # Shared utilities
│   └── README.md          # This file
├── server/                # Backend code
├── frontend/              # Frontend code
├── compose.yml            # Docker configuration
├── drizzle.config.ts      # Database configuration
└── package.json           # Root package.json
```

## ✨ Features

-   **TypeScript**: All scripts written in TypeScript with full type safety
-   **Bun Shell API**: Uses Bun's native shell API for better performance
-   **IIFE Pattern**: Each script uses Immediately Invoked Function Expression
-   **Error Handling**: Comprehensive error handling with colored output
-   **Graceful Shutdown**: Proper cleanup on Ctrl+C
-   **Port Management**: Automatic port conflict resolution
-   **Health Checks**: Waits for services to be ready before proceeding
-   **Interactive Confirmations**: Safe reset operations with user confirmation

## 🐛 Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
bun run dev:stop  # This will kill processes on ports 3000/3001
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps

# Restart database
docker compose restart db

# Reset everything
bun run dev:reset
```

### Permission Issues (Linux/macOS)

Make scripts executable:

```bash
chmod +x dev/*.sh
```

### Docker Issues

-   Make sure Docker is running
-   Try restarting Docker Desktop
-   Check Docker logs: `docker compose logs db`

## 💡 Tips

1. **First time?** Run `bun run dev:all` for complete setup and start
2. **Daily development?** Use `bun run dev:start`
3. **Need fresh data?** Use `bun run dev:reset` (with confirmation)
4. **Schema changes?** Use `bun run db:push`
5. **Stuck?** Try `bun run dev:stop` then `bun run dev:start`
6. **Automated reset?** Use `bun run dev:reset --yes` to skip confirmation

## 🔄 Typical Workflow

```bash
# First time setup and start (recommended)
bun run dev:all

# OR step by step:
# First time setup only (once)
bun run dev:setup

# Daily development
bun run dev:start
# ... do your development work ...
# Press Ctrl+C to stop when done

# Next day
bun run dev:start
# ... continue development ...

# Reset database when needed
bun run dev:reset
```

## 🛠️ Technical Details

-   **Shell API**: Uses `import { $ } from "bun"` for shell commands
-   **Process Management**: Spawns processes with `Bun.spawn()`
-   **Type Safety**: Full TypeScript support with proper error types
-   **Async/Await**: Modern async patterns throughout
-   **Signal Handling**: Proper SIGINT/SIGTERM handling for graceful shutdown
-   **Port Detection**: Uses `lsof` to detect and manage port usage
-   **Health Checks**: Polls services until ready with configurable timeouts
