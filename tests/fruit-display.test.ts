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
test("每批随机验十颗，避开样果，可按种子复现", () => {
  assert.equal(start().version, 3);
  const d = { ...start(), phase: "audit" as const, threshold: 3 };
  assert.ok(validDraft(d));
  for (const seed of [0, 135, 136, 0xffffffff]) {
    const fruit = batch(seed);
    assert.equal(fruit.length, 10);
    assert.equal(new Set([...examples, ...fruit].map((f) => `${f.size},${f.color}`)).size, 13);
    assert.deepEqual(fruit, batch(seed));
    assert.ok(fruit.every((f) => forward(d, f).gift === ordered(f)));
  }
  assert.notDeepEqual(batch(135), batch(136));
});
test("旧验收单沿用原六颗样本和成绩", () => {
  const old = {
    ...start(),
    version: 2 as const,
    phase: "audit" as const,
    seed: 135,
    guesses: [true, false, null, null, null, null],
    revealed: true,
  };
  assert.ok(validDraft(old));
  const fruit = batch(old.seed, old.version);
  assert.deepEqual(
    fruit.map((f) => [f.id, f.size, f.color]),
    [
      ["D", 7, 4],
      ["E", 7, 5],
      ["F", 3, 1],
      ["G", 5, 8],
      ["H", 2, 7],
      ["I", 7, 3],
    ],
  );
  assert.equal(fruit.filter((f) => forward(old, f).gift === ordered(f)).length, 3);
});
