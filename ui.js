// ui.js：操作面板与视图（原生 DOM，无弹窗）
import { render } from "./app.js";

export function mount(spec, parts) {
  parts.log.textContent = "容量 " + (spec.capacity || 0) + "，速率 " + (spec.rate || 0)
    + "，事件 " + (spec.events || []).length + " 条。";

  function draw() {
    let view = null;
    try {
      view = render(spec);
    } catch (error) {
      parts.out.textContent = String(error && error.code ? error.code : error);
      parts.log.textContent = "跑不动：" + String(error && error.message ? error.message : error);
      return;
    }
    parts.out.textContent = JSON.stringify(view, null, 1);
    parts.stage.textContent = "";
    (spec.events || []).forEach(function (event, spot) {
      const row = document.createElement("div");
      row.className = "row";
      const head = document.createElement("span");
      head.textContent = "第 " + (spot + 1) + " 条 间隔 " + event.gap + " 秒 要 " + event.want + " 个";
      row.appendChild(head);
      const bar = document.createElement("span");
      bar.className = "bar";
      const fill = document.createElement("i");
      fill.style.width = Math.min(100, event.want * 10) + "%";
      bar.appendChild(fill);
      row.appendChild(bar);
      const mark = document.createElement("span");
      const rejected = (view.rejected_positions || []).indexOf(spot + 1) !== -1;
      mark.className = "chip" + (rejected ? " bad" : " ok");
      mark.textContent = rejected ? "拒绝" : "接受";
      row.appendChild(mark);
      parts.stage.appendChild(row);
    });
    parts.legend.textContent = "收尾令牌 " + view.tokens_end + "，欠债 " + view.debt_end
      + "，借出合计 " + view.borrowed_total;
    parts.log.textContent = view.count + " 条事件，" + (view.healthy ? "桶况合法" : "桶况不合法");
  }

  const gapInput = document.createElement("input");
  gapInput.type = "number";
  gapInput.value = "1";
  parts.controls.appendChild(gapInput);

  const wantInput = document.createElement("input");
  wantInput.type = "number";
  wantInput.value = "3";
  parts.controls.appendChild(wantInput);

  const runButton = document.createElement("button");
  runButton.className = "primary";
  runButton.textContent = "跑一遍";
  runButton.addEventListener("click", draw);
  parts.controls.appendChild(runButton);

  const addButton = document.createElement("button");
  addButton.textContent = "追加一条事件";
  addButton.addEventListener("click", function () {
    const gap = Number(gapInput.value);
    const want = Number(wantInput.value);
    spec.events = (spec.events || []).concat([{ gap: Number.isFinite(gap) ? gap : 0,
                                               want: Number.isFinite(want) ? want : 0 }]);
    draw();
  });
  parts.controls.appendChild(addButton);

  const dropButton = document.createElement("button");
  dropButton.textContent = "删最后一条事件";
  dropButton.addEventListener("click", function () {
    spec.events = (spec.events || []).slice(0, Math.max(0, (spec.events || []).length - 1));
    draw();
  });
  parts.controls.appendChild(dropButton);

  const capButton = document.createElement("button");
  capButton.textContent = "容量加一";
  capButton.addEventListener("click", function () {
    spec.capacity = (spec.capacity || 1) + 1;
    draw();
  });
  parts.controls.appendChild(capButton);

  draw();
}
