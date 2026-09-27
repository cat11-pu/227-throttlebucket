// throttle.js：整批放行（基线：一律给零）
import { refill } from "./bucket.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function shapeTraffic(spec) {
  const capacity = spec && spec.capacity;
  const rate = spec && spec.rate;
  const events = spec && spec.events != null ? spec.events : [];
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw fail("E_BAD_CAPACITY", "capacity 必须是正整数");
  }
  if (!Number.isInteger(rate) || rate < 0) {
    throw fail("E_BAD_RATE", "rate 必须是非负整数");
  }
  if (!Array.isArray(events)) {
    throw fail("E_BAD_EVENT", "events 必须是数组");
  }
  let tokens = capacity;
  let debt = 0;
  let accepted = 0;
  let borrowedTotal = 0;
  let borrowedTimes = 0;
  const rejectedPositions = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event || typeof event !== "object"
        || !Number.isInteger(event.gap) || event.gap < 0
        || !Number.isInteger(event.want) || event.want < 0) {
      throw fail("E_BAD_EVENT", "每条事件必须给非负整数的 gap 与 want");
    }
    const state = refill(tokens, debt, event.gap * rate, capacity);
    tokens = state.tokens;
    debt = state.debt;
    if (tokens >= event.want) {
      tokens -= event.want;
      accepted += 1;
    } else {
      const shortfall = event.want - tokens;
      if (debt + shortfall <= capacity) {
        tokens = 0;
        debt += shortfall;
        borrowedTotal += shortfall;
        borrowedTimes += 1;
        accepted += 1;
      } else {
        rejectedPositions.push(index + 1);
      }
    }
  }
  return { tokens_end: tokens, debt_end: debt, accepted: accepted,
           borrowed_total: borrowedTotal, borrowed_times: borrowedTimes,
           rejected: rejectedPositions.length, rejected_positions: rejectedPositions,
           first_reject_at: rejectedPositions.length ? rejectedPositions[0] : 0 };
}
