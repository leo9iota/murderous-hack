# Murderous Hack Development Scripts

Simple, concise TypeScript scripts for easy development workflow management.

## 🚀 Quick Commands

```bash
# Complete setup and start (recommended for first time)
bun run dev:all

# Setup only (first time)
bun run dev:setup

# Start development servers (daily use)
bun run dev:start

# Stop all services
bun run dev:stop
```

## 📋 Scripts

### `simple-all.ts` - Complete Setup & Start

-   Creates `.env` from `.env.example` (if needed)
-   Installs dependencies (root + frontend)
-   Starts PostgreSQL database
-   Sets up database schema
-   Starts backend (from root) and frontend (from frontend/)

### `simple-setup.ts` - Setup Only

-   Creates `.env` from `.env.example` (if needed)
-   Installs dependencies (root + frontend)
-   Starts PostgreSQL database
-   Sets up database schema

### `simple-start.ts` - Start Development

-   Starts PostgreSQL (if not running)
-   Starts backend server on port 3000 (from root)
-   Starts frontend server on port 3001 (from frontend/)
-   Graceful shutdown with Ctrl+C

### `simple-stop.ts` - Stop All Services

-   Kills processes on ports 3000/3001
-   Stops Docker services

## 🌐 URLs

-   **Frontend**: http://localhost:3001
-   **Backend**: http://localhost:3000
-   **Database**: PostgreSQL on localhost:5432

## 🔧 Directory Structure

-   **Backend**: Runs from project root (`bun run dev`)
-   **Frontend**: Runs from `frontend/` directory (`cd frontend && bun run dev`)
-   **Database**: Docker container named `postgres-db`

## 💡 Key Features

-   **Directory Aware**: Properly handles running servers from correct directories
-   **Simple & Fast**: Minimal code, maximum efficiency
-   **Error Handling**: Clear error messages
-   **Graceful Shutdown**: Proper cleanup on Ctrl+C
-   **Port Management**: Automatic port conflict resolution

## 🐛 Troubleshooting

```bash
# Port conflicts
bun run dev:stop

# Database issues
docker compose restart postgres-db

# Full restart
bun run dev:stop && bun run dev:start
```

## 🛠️ Technical Details

-   Uses Bun's shell API (`import { $ } from "bun"`)
-   Spawns processes with proper directory context
-   Uses `npx kill-port` for reliable port cleanup
-   Simple PostgreSQL health checks
-   TypeScript with full type safety
