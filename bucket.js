// bucket.js：补令牌并还债（先还债，剩余进桶，进桶不超容量）
export function refill(tokens, debt, gained, capacity) {
  const repaid = Math.min(debt, gained);
  const left = gained - repaid;
  return { tokens: Math.min(capacity, tokens + left), debt: debt - repaid };
}
