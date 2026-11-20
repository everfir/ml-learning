import assert from "node:assert/strict";
import test from "node:test";
import {
  batch,
  examples,
  forward,
  ordered,
  start,
  validDraft,
} from "../src/experiments/fruit-display/model.ts";

test("任一可调单路的中点分等于平均分，无法同时实现三个标签", () => {
  for (let sizeWeight = -2; sizeWeight <= 2; sizeWeight++)
    for (let colorWeight = -2; colorWeight <= 2; colorWeight++)
      for (let threshold = -20; threshold <= 20; threshold++) {
        const d = { ...start(), sizeWeight, colorWeight, threshold };
        const [a, b, c] = examples.map((f) => forward(d, f));
        assert.equal(a.sum + b.sum, 2 * c.sum);
        assert.ok(!a.gift || !b.gift || c.gift);
      }
});
test("两路会抵消，ReLU 后可在整个输入网格上实现订单", () => {
  for (let size = 0; size <= 10; size++)
    for (let color = 0; color <= 10; color++) {
      const f = { id: "X", size, color };
      assert.equal(forward({ ...start(), phase: "pair" }, f).sum, 0);
      const r = forward({ ...start(), phase: "relu", threshold: 3 }, f);
      assert.equal(r.sum, Math.abs(size - color));
      assert.equal(r.gift, ordered(f));
    }
});
test("盲测在锁定规则下生成，可重现，门槛不准时边界果会漏装", () => {
  const d = { ...start(), phase: "audit" as const, seed: 135 };
  assert.ok(validDraft(d));
  assert.ok(!validDraft({ ...d, revealed: true }));
  const fruits = batch(d.seed);
  const id = (f: (typeof fruits)[number]) => `${f.size},${f.color}`;
  assert.equal(new Set([...examples, ...fruits].map(id)).size, 9);
  assert.deepEqual(fruits, batch(135));
  assert.notDeepEqual(fruits, batch(136));
  assert.deepEqual(fruits.slice(0, 2).map(ordered), [true, false]);
  assert.equal(forward(d, fruits[0]).gift, false);
  assert.ok(validDraft({ ...d, guesses: [true, false, null, null, null, null], revealed: true }));
});
