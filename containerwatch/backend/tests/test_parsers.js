// Run: node tests/test_parsers.js   (no Docker needed - uses sample output)
const assert = require("assert");
const d = require("../docker");

assert.strictEqual(d.parseSize("12.5MiB"), 12.5 * 1024 * 1024);
assert.strictEqual(d.parseSize("1.2kB"), 1200);
assert.strictEqual(d.parseSize("7.6GiB"), 7.6 * 1024 ** 3);
assert.strictEqual(d.parseSize("0B"), 0);
assert.deepStrictEqual(d.parsePair("1MiB / 2MiB"), [1048576, 2097152]);
assert.strictEqual(d.parsePercent("0.50%"), 0.5);
assert.strictEqual(d.parsePercent("--"), 0);

const ps = [
  '{"ID":"abc123def456","Names":"web","Image":"nginx","State":"running","Status":"Up 3 hours","Ports":"0.0.0.0:80->80/tcp","CreatedAt":"2026-10-22"}',
  '{"ID":"fff111eee222","Names":"old-job","Image":"alpine","State":"exited","Status":"Exited (0) 2 days ago","Ports":""}',
  "not json at all",
].join("\n");
const stats = '{"ID":"abc123def456","Name":"web","CPUPerc":"12.50%","MemUsage":"40MiB / 1GiB","MemPerc":"3.91%","NetIO":"1.5kB / 2kB","BlockIO":"0B / 0B","PIDs":"5"}';

const merged = d.mergeContainers(d.parseJsonLines(ps), d.parseJsonLines(stats));
assert.strictEqual(merged.length, 2, "malformed line must be skipped");
assert.strictEqual(merged[0].cpuPercent, 12.5);
assert.strictEqual(merged[0].memUsed, 40 * 1024 * 1024);
assert.strictEqual(merged[0].pids, 5);
assert.strictEqual(merged[1].state, "exited");
assert.strictEqual(merged[1].cpuPercent, 0, "stopped containers have zero usage");

assert.ok(d.ID_RE.test("my-web_1.a"));
assert.ok(!d.ID_RE.test("x; rm -rf /"));
assert.ok(!d.ID_RE.test("$(whoami)"));
console.log("Parser tests passed.");
