import fs from "node:fs";
import { refill } from "./bucket.js";
import { shapeTraffic } from "./throttle.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/events.json", "utf8"));
const view = render(spec);

emit("收尾令牌 =", view.tokens_end);
emit("收尾欠债 =", view.debt_end);
emit("接受条数 =", view.accepted);
emit("借出合计 =", view.borrowed_total);
emit("借出次数 =", view.borrowed_times);
emit("拒绝条数 =", view.rejected);
emit("拒绝位置列表 =", JSON.stringify(view.rejected_positions));
emit("首次拒绝位置 =", view.first_reject_at);
emit("事件条数 =", view.count);
emit("桶况复核 =", view.healthy);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  shapeTraffic({ capacity: 0, rate: 1, events: [] });
  emit("容量写错的错误码", "没有报错");
} catch (error) {
  emit("容量写错的错误码", error && error.code ? error.code : String(error.message));
}
try {
  shapeTraffic({ capacity: 2, rate: -1, events: [] });
  emit("速率写错的错误码", "没有报错");
} catch (error) {
  emit("速率写错的错误码", error && error.code ? error.code : String(error.message));
}
try {
  shapeTraffic({ capacity: 2, rate: 1, events: [{ gap: 1, want: -3 }] });
  emit("事件写错的错误码", "没有报错");
} catch (error) {
  emit("事件写错的错误码", error && error.code ? error.code : String(error.message));
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "收尾令牌": 0,
  "收尾欠债": 3,
  "接受条数": 4,
  "借出合计": 7,
  "借出次数": 2,
  "拒绝条数": 1,
  "拒绝位置列表": [
    5
  ],
  "首次拒绝位置": 5,
  "事件条数": 5,
  "桶况复核": true,
  "容量写错的错误码": "E_BAD_CAPACITY",
  "速率写错的错误码": "E_BAD_RATE",
  "事件写错的错误码": "E_BAD_EVENT"
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
