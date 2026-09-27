// throttle.js：整批放行（单趟扫描，每条事件只结算一次）
import { refill } from "./bucket.js";

function bad(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

export function shapeTraffic(spec) {
  const capacity = spec && spec.capacity;
  const rate = spec && spec.rate;
  const events = spec && spec.events === undefined ? [] : spec && spec.events;

  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw bad("E_BAD_CAPACITY", "capacity 必须是正整数");
  }
  if (!isNonNegativeInteger(rate)) {
    throw bad("E_BAD_RATE", "rate 必须是非负整数");
  }
  if (!Array.isArray(events)) {
    throw bad("E_BAD_EVENT", "events 必须是事件数组");
  }
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event || typeof event !== "object" || Array.isArray(event)
        || !isNonNegativeInteger(event.gap) || !isNonNegativeInteger(event.want)) {
      throw bad("E_BAD_EVENT", "第 " + (index + 1) + " 条事件不合法");
    }
  }

  let tokens = capacity;
  let debt = 0;
  let accepted = 0;
  let borrowedTotal = 0;
  let borrowedTimes = 0;
  let rejected = 0;
  const rejectedPositions = [];

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const state = refill(tokens, debt, event.gap * rate, capacity);
    tokens = state.tokens;
    debt = state.debt;

    if (tokens >= event.want) {
      tokens -= event.want;
      accepted += 1;
      continue;
    }
    const shortfall = event.want - tokens;
    if (debt + shortfall <= capacity) {
      tokens = 0;
      debt += shortfall;
      borrowedTotal += shortfall;
      borrowedTimes += 1;
      accepted += 1;
    } else {
      rejected += 1;
      rejectedPositions.push(index + 1);
    }
  }

  return { tokens_end: tokens, debt_end: debt, accepted: accepted,
           borrowed_total: borrowedTotal, borrowed_times: borrowedTimes,
           rejected: rejected, rejected_positions: rejectedPositions,
           first_reject_at: rejectedPositions.length ? rejectedPositions[0] : 0 };
}
