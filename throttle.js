// throttle.js：整批放行（基线：一律给零）
import { refill } from "./bucket.js";

export function shapeTraffic(spec) {
  return { tokens_end: 0, debt_end: 0, accepted: 0, borrowed_total: 0, borrowed_times: 0,
           rejected: 0, rejected_positions: [], first_reject_at: 0 };
}
