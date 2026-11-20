import assert from "node:assert/strict";
import test from "node:test";
import {
  forward,
  gradients,
  learn,
  meanLoss,
  type Network,
  start,
  validDraft,
} from "../src/experiments/fruit-backprop/model.ts";
import { training } from "../src/shared/data/training-tray.ts";

test("A 的首次反馈降低损失但还分错，换 B 时另一支路独立更新", () => {
  const d = start(),
    a = learn(d, false),
    b = learn({ ...a, selected: "B" }, false);
  assert.deepEqual(a.net[1], d.net[1]);
  assert.ok(a.net[0].gain > d.net[0].gain && a.net[0].out > d.net[0].out);
  assert.ok(forward(a.net, training[0]).loss < forward(d.net, training[0]).loss);
  assert.equal(forward(a.net, training[0]).gift, false);
  assert.deepEqual(b.net[0], a.net[0]);
  assert.ok(b.net[1].gain > a.net[1].gain);
});
test("两路两层的梯度与数值微分逐项一致", () => {
  const net: Network = [
    { gain: 0.91, out: 0.47 },
    { gain: 0.87, out: 0.66 },
  ];
  for (const f of training)
    for (const i of [0, 1])
      for (const key of ["out", "gain"] as const) {
        const delta = 1e-5,
          plus = structuredClone(net),
          minus = structuredClone(net);
        plus[i][key] += delta;
        minus[i][key] -= delta;
        const numeric = (forward(plus, f).loss - forward(minus, f).loss) / (2 * delta);
        assert.ok(Math.abs(numeric - gradients(net, f)[i][key]) < 1e-7);
      }
});
test("轮训固定遍历、锁定停止，裁剪曲线后仍可恢复", () => {
  let d = start();
  const initial = meanLoss(d.net);
  for (let i = 0; i < 120; i++) {
    d = learn(d, true);
    assert.equal(d.selected, training[i % 12].id);
    assert.equal(d.history.at(-1), meanLoss(d.net));
  }
  assert.ok(meanLoss(d.net) < initial);
  assert.equal(d.history.length, 61);
  assert.ok(validDraft(JSON.parse(JSON.stringify(d))));
  const locked = { ...d, seed: 0 };
  assert.equal(learn(locked, true), locked);
  assert.ok(!validDraft({ ...d, history: [] }));
});
