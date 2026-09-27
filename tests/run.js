import assert from "node:assert";
import { refill } from "../bucket.js";
import { shapeTraffic } from "../throttle.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("refill returns tokens", () => {
  assert.strictEqual(typeof refill(0, 0, 1, 5).tokens, "number");
});

check("refill returns debt", () => {
  assert.strictEqual(typeof refill(0, 0, 1, 5).debt, "number");
});

check("shapeTraffic returns rejected positions", () => {
  assert.ok(Array.isArray(shapeTraffic({ capacity: 1, rate: 0, events: [] }).rejected_positions));
});

check("render counts events", () => {
  assert.strictEqual(typeof render({ capacity: 1, rate: 0, events: [] }).count, "number");
});

check("render exposes healthy flag", () => {
  assert.strictEqual(typeof render({ capacity: 1, rate: 0, events: [] }).healthy, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
