// Run: node tests/test_api.js   (starts the server in demo mode on port 5055)
const assert = require("assert");
const { spawn } = require("child_process");
const path = require("path");

const PORT = 5055, BASE = `http://localhost:${PORT}`;
const server = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
  env: { ...process.env, DEMO_MODE: "true", PORT: String(PORT), POLL_MS: "300" },
  stdio: "ignore",
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (p) => (await fetch(BASE + p)).json();

(async () => {
  try {
    await sleep(1500);
    const health = await get("/api/health");
    assert.strictEqual(health.ok, true);
    assert.strictEqual(health.mode, "demo");

    const data = await get("/api/containers");
    assert.ok(data.containers.length >= 5, "demo containers listed");
    assert.ok(data.summary.running >= 1 && data.summary.stopped >= 1);
    assert.ok(data.containers.some((c) => c.highUsage), "cpu-burner should be flagged high usage");

    const running = data.containers.find((c) => c.state === "running");
    await sleep(900);
    const hist = await get(`/api/containers/${running.id}/history`);
    assert.ok(hist.length >= 2, "history is being recorded");

    const stop = await fetch(`${BASE}/api/containers/${running.id}/stop`, { method: "POST" });
    assert.strictEqual(stop.status, 200);
    const after = await get("/api/containers");
    assert.strictEqual(after.containers.find((c) => c.id === running.id).state, "exited");

    const bad = await fetch(`${BASE}/api/containers/${running.id}/delete`, { method: "POST" });
    assert.strictEqual(bad.status, 400, "unknown action must be rejected");
    const inject = await fetch(`${BASE}/api/containers/x;ls/stop`, { method: "POST" });
    assert.strictEqual(inject.status, 400);

    console.log("API tests passed.");
  } catch (e) {
    console.error("API test FAILED:", e.message);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
})();
