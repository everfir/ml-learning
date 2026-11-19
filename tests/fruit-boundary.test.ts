import assert from "node:assert/strict";
import test from "node:test";
import {
  batchSize,
  boundary,
  evaluateBatch,
  harvest,
  initial,
  inspect,
  measure,
  start,
  train,
  training,
  validDraft,
} from "../src/experiments/fruit-boundary/model.ts";

test("两条教材试线错果数相同，损失和示例预测不同", () => {
  const b = { height: 66, tilt: 6 };
  const sample = { orange: 75, diameter: 70, bin: "fresh" } as const;
  assert.equal(boundary(initial, 75), 71);
  assert.equal(inspect(initial, sample).predicted, "juice");
  assert.equal(inspect(b, sample).predicted, "fresh");
  assert.equal(training.length, 32);
  assert.equal(measure(initial).hits, 18);
  assert.equal(measure(b).hits, 18);
  assert.equal(measure(initial).loss.toFixed(3), "0.852");
  assert.equal(measure(b).loss.toFixed(3), "0.731");
});
test("机调从手调线出发，每次保留一个使平均损失降低的小步", () => {
  const path = train(initial);
  assert.ok(path.length > 1);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1],
      b = path[i];
    assert.equal(
      Math.abs(a.line.height - b.line.height) + Math.abs(a.line.tilt - b.line.tilt),
      0.5,
    );
    assert.ok(b.loss < a.loss);
  }
  assert.equal(train(path[path.length - 1].line).length, 1);
});
test("验收在同一条抽样流上成对计分，续抽与一次抽大批相符", () => {
  const path = train(initial);
  const machine = path[path.length - 1].line;
  const first = harvest(42, batchSize);
  const second = harvest(first.nextSeed, batchSize);
  const all = harvest(42, batchSize * 2).fruit;
  assert.deepEqual([...first.fruit, ...second.fruit], all);
  assert.ok(
    all.every((f) => f.orange >= 0 && f.orange <= 100 && f.diameter >= 50 && f.diameter <= 80),
  );
  const a = evaluateBatch(initial, machine, 42, null);
  const b = evaluateBatch(initial, machine, first.nextSeed, a);
  assert.equal(b.humanHits, measure(initial, all).hits);
  assert.equal(b.machineHits, measure(machine, all).hits);
  assert.equal(b.batches, 2);
  assert.ok(validDraft({ version: 1, human: initial, step: train(initial).length - 1, audit: b }));
  assert.ok(!validDraft({ ...start(), step: 0, audit: { ...b, humanHits: 201 } }));
  assert.ok(!validDraft({ ...start(), step: 123456 }));
  assert.ok(!validDraft({ ...start(), audit: a }));
});
