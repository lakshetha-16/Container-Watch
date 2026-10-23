"use strict";
/**
 * server.js - Express API for the Container Resource Monitoring Dashboard.
 *
 * Every POLL_MS milliseconds the server asks Docker for container stats, keeps the latest
 * values plus a short history (in memory, no database), and serves them as JSON to React.
 */
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const docker = require("./docker");
const demo = require("./demo");

const PORT = Number(process.env.PORT) || 5001;
const POLL_MS = Number(process.env.POLL_MS) || 3000;
const HISTORY_LIMIT = 60; // samples kept per container (about 3 minutes at 3 s)
const HIGH_USAGE = Number(process.env.HIGH_USAGE_PERCENT) || 80;
const DEMO = String(process.env.DEMO_MODE).toLowerCase() === "true";

const state = {
  mode: DEMO ? "demo" : "docker",
  dockerAvailable: DEMO,
  error: null,
  updatedAt: null,
  containers: [],
};
const history = new Map(); // container id -> array of samples

const decorate = (c) => ({
  ...c,
  highUsage: c.state === "running" && (c.cpuPercent >= HIGH_USAGE || c.memPercent >= HIGH_USAGE),
});

function friendlyError(err) {
  if (err.code === "ENOENT") return "Docker was not found. Install Docker Desktop and restart this server.";
  const msg = String(err.message || "");
  if (/daemon|pipe|connect|permission/i.test(msg)) return "Docker is installed but not running. Start Docker Desktop and wait until it says 'running'.";
  return msg || "Could not read from Docker.";
}

function record(containers) {
  const now = Date.now();
  const alive = new Set(containers.map((c) => c.id));
  for (const id of history.keys()) if (!alive.has(id)) history.delete(id);
  for (const c of containers) {
    if (c.state !== "running") continue;
    const arr = history.get(c.id) || [];
    arr.push({ t: now, cpu: c.cpuPercent, mem: c.memPercent, memUsed: c.memUsed });
    if (arr.length > HISTORY_LIMIT) arr.shift();
    history.set(c.id, arr);
  }
}

async function poll() {
  try {
    const raw = DEMO ? demo.snapshot() : await docker.listContainers();
    state.containers = raw.map(decorate);
    state.dockerAvailable = true;
    state.error = null;
    record(state.containers);
  } catch (err) {
    state.dockerAvailable = false;
    state.error = friendlyError(err);
    state.containers = [];
  }
  state.updatedAt = new Date().toISOString();
}

function summary() {
  const cs = state.containers;
  const running = cs.filter((c) => c.state === "running");
  return {
    total: cs.length,
    running: running.length,
    stopped: cs.filter((c) => c.state !== "running").length,
    highUsage: cs.filter((c) => c.highUsage).length,
    totalCpuPercent: +running.reduce((a, c) => a + c.cpuPercent, 0).toFixed(2),
    totalMemUsed: running.reduce((a, c) => a + c.memUsed, 0),
  };
}

const app = express();
app.use(cors());

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, mode: state.mode, dockerAvailable: state.dockerAvailable, error: state.error, updatedAt: state.updatedAt, pollMs: POLL_MS })
);

app.get("/api/containers", (_req, res) =>
  res.json({
    mode: state.mode, dockerAvailable: state.dockerAvailable, error: state.error,
    updatedAt: state.updatedAt, highUsageThreshold: HIGH_USAGE,
    summary: summary(), containers: state.containers,
  })
);

app.get("/api/summary", (_req, res) => res.json(summary()));

app.get("/api/containers/:id/history", (req, res) => res.json(history.get(req.params.id) || []));

app.post("/api/containers/:id/:action", async (req, res) => {
  const { id, action } = req.params;
  try {
    if (DEMO) demo.control(id, action);
    else await docker.controlContainer(id, action);
    await poll(); // refresh straight away so the dashboard updates
    res.json({ ok: true, message: `Container ${action} successful.` });
  } catch (err) {
    res.status(400).json({ ok: false, error: friendlyError(err) });
  }
});

// After `npm run build`, the same server also serves the React app (one port, no proxy).
const dist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(dist)) app.use(express.static(dist));

async function loop() {
  await poll();
  setTimeout(loop, POLL_MS); // setTimeout (not setInterval) so two polls never overlap
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ContainerWatch API running on http://localhost:${PORT}  (mode: ${state.mode})`);
    loop();
  });
}

module.exports = { app, poll, summary };
