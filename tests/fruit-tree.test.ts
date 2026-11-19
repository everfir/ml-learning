import assert from "node:assert/strict";
import test from "node:test";
import {
  harvest,
  inBand,
  midpoint,
  order,
  pairs,
  predict,
  route,
  start,
  train,
  training,
  trees,
  validDraft,
} from "../src/experiments/fruit-tree/model.ts";

test("同尺寸有相反标签，收下两个礼盒果的直带一定包含中点", () => {
  assert.deepEqual(pairs.map(order), [true, false, false, true]);
  assert.equal(order(midpoint), false);
  for (let center = 54; center <= 78; center++)
    for (let tilt = -16; tilt <= 16; tilt++)
      for (let width = 1; width <= 12; width++) {
        const b = { center, tilt, width };
        if (inBand(b, pairs[0]) && inBand(b, pairs[3])) assert.ok(inBand(b, midpoint));
      }
});
test("每步多一个分裂，比较阈值时等号走左支", () => {
  assert.deepEqual(
    trees.map((t) => training.filter((f) => predict(t, f) === f.gift).length),
    [22, 24, 32, 36],
  );
  const t = trees[trees.length - 1];
  assert.equal(t.split?.feature, "diameter");
  assert.deepEqual(
    route(t, { ...midpoint, diameter: 66.5, orange: 70 }).path.map((n) => n.id),
    ["根", "根左", "根左左"],
  );
  // An unseen diameter exposes the learned threshold's difference from the order.
  const f = { ...midpoint, orange: 90 };
  assert.notEqual(predict(t, f), order(f));
  assert.equal(train(training.map((v) => ({ ...v, gift: false }))).length, 1);
  const swapped = train(training.map((v) => ({ ...v, gift: !v.gift }))).at(-1);
  assert.ok(swapped);
  for (const f of training) assert.equal(predict(swapped, f), !f.gift);
});
test("快照恢复锁定步数及独立抽样", () => {
  assert.ok(validDraft(start()));
  const saved = {
    ...start(),
    phase: "tree",
    guesses: [true, false, false, true],
    middle: true,
    revealed: 2,
    step: 2,
    seed: 0,
  };
  assert.ok(validDraft(saved));
  assert.ok(!validDraft({ ...saved, step: 4 }));
  assert.ok(!validDraft({ ...saved, phase: "band" }));
  assert.deepEqual(harvest(0), harvest(JSON.parse(JSON.stringify(saved)).seed));
  assert.notDeepEqual(harvest(0), harvest(1));
});
