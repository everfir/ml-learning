import assert from "node:assert/strict";
import test from "node:test";
import {
  audit,
  inspect,
  measure,
  start,
  training,
  validDraft,
  weights,
} from "../src/experiments/fruit-loss/model.ts";
import { grid } from "../src/shared/data/gift-order.ts";

test("单果进步可早于箱号翻转，继续提高权重可能伤害整盘", () => {
  const [a, b, , d] = training;
  const initial = inspect(start().weight, a),
    adjusted = inspect(0.4, a);
  assert.ok(!initial.correct && !adjusted.correct && adjusted.loss < initial.loss);
  assert.equal(inspect(0.5, a).probability, 0.5);
  assert.ok(inspect(0.5, a).gift);
  assert.ok(inspect(2, a).loss < inspect(1.4, a).loss);
  assert.ok(inspect(2, d).loss > inspect(1.4, d).loss);
  assert.ok(measure(2, training).mean > measure(1.4, training).mean);
  for (const w of weights) assert.deepEqual(inspect(w, b), inspect(0, b));
  assert.equal(measure(1, grid).hits, 121);
});
test("验收盘排除全部训练坐标，可按保存的种子复现", () => {
  const keys = (f: { size: number; color: number }) => `${f.size},${f.color}`;
  for (const seed of [0, 10, 0xffffffff]) {
    const batch = audit(seed);
    assert.equal(batch.length, 10);
    assert.equal(new Set([...training, ...batch].map(keys)).size, 22);
    assert.deepEqual(audit(seed), batch);
    assert.ok(validDraft({ ...start(), seed, weight: 2, selected: "D" }));
  }
  assert.notDeepEqual(audit(0), audit(10));
  assert.ok(!validDraft({ ...start(), weight: Infinity }));
});
