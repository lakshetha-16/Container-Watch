"use strict";
/**
 * docker.js - talks to Docker by running the normal `docker` command-line tool.
 *
 * Why the CLI and not a library?  If `docker ps` works in your terminal, this works too.
 * We use execFile (not exec) with an argument array, so user input is never glued into a
 * shell string. That blocks command-injection attacks.
 */
const { execFile } = require("child_process");

const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/; // container ids/names are plain characters only
const ACTIONS = new Set(["start", "stop", "restart"]);

function run(args, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    execFile(
      "docker",
      args,
      { timeout: timeoutMs, windowsHide: true, maxBuffer: 5 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const e = new Error((stderr || err.message || "docker command failed").trim());
          e.code = err.code; // "ENOENT" means the docker program was not found
          return reject(e);
        }
        resolve(stdout);
      }
    );
  });
}

/** `--format "{{json .}}"` prints one JSON object per line. Turn that text into objects. */
function parseJsonLines(text) {
  const rows = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    try {
      rows.push(JSON.parse(t));
    } catch {
      /* skip a malformed line instead of crashing */
    }
  }
  return rows;
}

// Docker prints sizes like "12.5MiB", "1.2kB", "7.6GiB". Convert them all to bytes.
const UNITS = {
  b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12,          // decimal (network, disk I/O)
  kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4, // binary (memory)
};

function parseSize(str) {
  const m = /^\s*([\d.]+)\s*([a-zA-Z]*)/.exec(str || "");
  if (!m) return 0;
  const unit = (m[2] || "b").toLowerCase();
  return parseFloat(m[1]) * (UNITS[unit] ?? 1);
}

// "12.5MiB / 7.6GiB" -> [bytesUsed, bytesLimit]
function parsePair(str) {
  const [a, b] = String(str || "").split("/");
  return [parseSize(a), parseSize(b)];
}

function parsePercent(str) {
  const v = parseFloat(String(str || "").replace("%", ""));
  return Number.isFinite(v) ? v : 0;
}

/** Combine `docker ps -a` (all containers) with `docker stats` (usage of running ones). */
function mergeContainers(psRows, statsRows) {
  const statsById = new Map();
  for (const s of statsRows) {
    statsById.set(String(s.ID || s.Container || "").slice(0, 12), s);
  }
  return psRows.map((c) => {
    const s = statsById.get(String(c.ID || "").slice(0, 12));
    const [memUsed, memLimit] = parsePair(s && s.MemUsage);
    const [netRx, netTx] = parsePair(s && s.NetIO);
    const [blockRead, blockWrite] = parsePair(s && s.BlockIO);
    return {
      id: String(c.ID || "").slice(0, 12),
      name: c.Names || "",
      image: c.Image || "",
      state: c.State || "unknown",
      status: c.Status || "",
      ports: c.Ports || "",
      created: c.CreatedAt || "",
      cpuPercent: s ? parsePercent(s.CPUPerc) : 0,
      memUsed,
      memLimit,
      memPercent: s ? parsePercent(s.MemPerc) : 0,
      netRx,
      netTx,
      blockRead,
      blockWrite,
      pids: s ? parseInt(s.PIDs, 10) || 0 : 0,
    };
  });
}

async function listContainers() {
  const psOut = await run(["ps", "-a", "--format", "{{json .}}"]);
  let statsOut = "";
  try {
    statsOut = await run(["stats", "--no-stream", "--format", "{{json .}}"], 20000);
  } catch {
    /* if stats fails for a moment, still show the containers with zero usage */
  }
  return mergeContainers(parseJsonLines(psOut), parseJsonLines(statsOut));
}

async function controlContainer(id, action) {
  if (!ACTIONS.has(action)) throw new Error("Invalid action. Use start, stop or restart.");
  if (!ID_RE.test(id)) throw new Error("Invalid container id.");
  await run([action, id], 40000);
}

module.exports = {
  listContainers, controlContainer, parseJsonLines, parseSize, parsePair, parsePercent,
  mergeContainers, ACTIONS, ID_RE,
};
