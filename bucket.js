// bucket.js：补令牌并还债（基线：原样返回）
export function refill(tokens, debt, gained, capacity) {
  const repaid = Math.min(debt, gained);
  const left = gained - repaid;
  return { tokens: Math.min(tokens + left, capacity), debt: debt - repaid };
}
