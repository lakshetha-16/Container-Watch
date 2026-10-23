"use strict";
/**
 * demo.js - fake containers for when Docker is not installed (start with DEMO_MODE=true).
 * Only for trying the dashboard. The dashboard shows a clear "Demo data" badge in this mode.
 */
const MB = 1024 * 1024;

const containers = [
  { id: "a1b2c3d4e501", name: "demo-web-nginx", image: "nginx:alpine", state: "running", ports: "0.0.0.0:8081->80/tcp", baseCpu: 3, baseMem: 38 * MB, limit: 512 * MB },
  { id: "a1b2c3d4e502", name: "demo-cache-redis", image: "redis:alpine", state: "running", ports: "6379/tcp", baseCpu: 1.5, baseMem: 22 * MB, limit: 512 * MB },
  { id: "a1b2c3d4e503", name: "demo-api-node", image: "node:20-alpine", state: "running", ports: "0.0.0.0:3000->3000/tcp", baseCpu: 22, baseMem: 140 * MB, limit: 512 * MB },
  { id: "a1b2c3d4e504", name: "demo-cpu-burner", image: "alpine", state: "running", ports: "", baseCpu: 92, baseMem: 6 * MB, limit: 512 * MB },
  { id: "a1b2c3d4e505", name: "demo-db-postgres", image: "postgres:16", state: "running", ports: "5432/tcp", baseCpu: 8, baseMem: 410 * MB, limit: 512 * MB },
  { id: "a1b2c3d4e506", name: "demo-finished-job", image: "alpine", state: "exited", ports: "", baseCpu: 0, baseMem: 0, limit: 512 * MB },
];
const netTotals = new Map();

function jitter(base, spread) {
  return Math.max(0, base + (Math.random() - 0.5) * spread);
}

function snapshot() {
  return containers.map((c) => {
    const running = c.state === "running";
    const cpu = running ? jitter(c.baseCpu, Math.max(2, c.baseCpu * 0.3)) : 0;
    const mem = running ? jitter(c.baseMem, c.baseMem * 0.05) : 0;
    const t = netTotals.get(c.id) || { rx: 5000, tx: 3000 };
    if (running) { t.rx += Math.random() * 4000; t.tx += Math.random() * 2500; }
    netTotals.set(c.id, t);
    return {
      id: c.id, name: c.name, image: c.image, state: c.state,
      status: running ? "Up 2 hours" : "Exited (0) 5 minutes ago",
      ports: c.ports, created: "2026-10-22 10:00:00 +0530 IST",
      cpuPercent: +cpu.toFixed(2), memUsed: Math.round(mem), memLimit: c.limit,
      memPercent: +((mem / c.limit) * 100).toFixed(2),
      netRx: Math.round(t.rx), netTx: Math.round(t.tx),
      blockRead: running ? 4 * MB : 0, blockWrite: running ? 1 * MB : 0,
      pids: running ? 4 : 0,
    };
  });
}

function control(id, action) {
  if (!["start", "stop", "restart"].includes(action)) throw new Error("Invalid action. Use start, stop or restart.");
  const c = containers.find((x) => x.id === id || x.name === id);
  if (!c) throw new Error("No such container.");
  c.state = action === "stop" ? "exited" : "running";
}

module.exports = { snapshot, control };
