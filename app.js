// app.js：渲染结果
import { refill } from "./bucket.js";
import { shapeTraffic } from "./throttle.js";

export function render(spec) {
  const capacity = spec.capacity || 0;
  const events = spec.events || [];
  const view = shapeTraffic(spec);
  const tokens = view.tokens_end || 0;
  const debt = view.debt_end || 0;
  const rejects = view.rejected_positions || [];
  return { tokens_end: tokens, debt_end: debt, accepted: view.accepted || 0,
           borrowed_total: view.borrowed_total || 0, borrowed_times: view.borrowed_times || 0,
           rejected: view.rejected || 0, rejected_positions: rejects,
           first_reject_at: rejects.length ? rejects[0] : 0, count: events.length,
           healthy: tokens <= capacity && debt <= capacity && !(tokens > 0 && debt > 0),
           tail: refill(0, 0, 3, 5).tokens };
}
