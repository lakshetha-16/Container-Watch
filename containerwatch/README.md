# Cloud-Based Container Resource Monitoring and Visualization Dashboard

A web dashboard that shows live CPU, memory and network usage of your Docker containers,
with charts, high-usage alerts and Start / Stop / Restart controls.

## Technology used
| Part | Technology |
|---|---|
| Front end | React 18, Vite, Recharts (charts), plain CSS |
| Back end | Node.js, Express (REST API) |
| Data source | Docker CLI (`docker ps`, `docker stats`) |
| Storage | In memory only (no database, no login) |
| Containers | Docker Desktop |

## How it works
1. Every 3 seconds the Express server runs `docker ps -a` and `docker stats --no-stream`.
2. `docker.js` parses that text into JSON (sizes like `12.5MiB` become bytes).
3. The server keeps the latest values plus the last 60 samples per container in memory.
4. React asks `/api/containers` every 3 seconds and redraws the stat cards, charts and table.
5. A container is flagged **High usage** when CPU or memory reaches 80%.

```
React (port 5173)  --/api-->  Express (port 5001)  --docker CLI-->  Docker Desktop
```

## Requirements
- Node.js 18 or newer (check with `node --version`)
- Docker Desktop installed **and running** (the whale icon must say it is running)

## Run it (VS Code terminal, Windows)
```
npm run install-all
npm run dev
```
Open **http://localhost:5173**

### Add sample containers (second terminal)
```
docker compose -f docker-compose.demo.yml up -d
```
Within a few seconds the dashboard shows 4 containers: nginx and redis running, `demo-cpu-burner`
at about 100% CPU with a **High usage** badge, and `demo-finished-job` stopped.
When you are done, run `docker compose -f docker-compose.demo.yml down` so the burner stops using your CPU.

### No Docker? Try demo mode
```
npm run dev:demo
```
Shows simulated containers with a "Demo data" badge. Use this only to explore the UI,
not for your submission screenshots.

### Single-port build (optional)
```
npm run build
npm start
```
Open http://localhost:5001 (Express serves the built React app).

## Screenshots to submit
1. Dashboard with stat cards, both charts and the container table
2. A container detail page with the usage history chart
3. The High usage badge on `demo-cpu-burner`
4. Terminal showing `docker ps` next to the dashboard (proves it is real data)
5. Your GitHub repository page

## REST API
| Method and path | Purpose |
|---|---|
| `GET /api/health` | server and Docker status |
| `GET /api/containers` | all containers with usage and a summary |
| `GET /api/summary` | totals only |
| `GET /api/containers/:id/history` | last 60 CPU / memory samples |
| `POST /api/containers/:id/start` `stop` `restart` | control a container |

## Tests
`npm test` checks the Docker-output parser and the API in demo mode (no Docker needed).

## Common mistakes
- **Banner says "Docker is installed but not running":** open Docker Desktop and wait until it is ready.
- **Banner says "Cannot reach the backend":** the Express server is not running; use `npm run dev`, not only the frontend.
- **Port in use:** another app uses 5001 or 5173. Set `PORT=5002` for the backend (and update `frontend/vite.config.js`).
- **CPU above 100%:** Docker reports CPU per core, so a container using 2 cores shows about 200%.

## Security notes
- Container ids are checked against a strict pattern and commands run with `execFile`, so input cannot inject shell commands.
- There is no login, so run this on your own computer only. Do not expose it to the internet.

## Limitations and future work
History resets when the server restarts. Possible upgrades: login, saving history to a database,
email alerts, a Dockerfile for the dashboard itself, monitoring remote Docker hosts.
