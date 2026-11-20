import assert from "node:assert/strict";
import test from "node:test";
import {
  biasAt,
  contributions,
  crossing,
  ranking,
  reading,
  start,
  tray,
  validDraft,
} from "../src/experiments/fruit-display/legacy.ts";

test("两项贡献分别计入：调颜色可以追平再反超", () => {
  const [a, b] = tray;
  const d = start();
  assert.ok(contributions(d.weights, a).total > contributions(d.weights, b).total);
  assert.equal(
    contributions({ size: 1, color: 1 }, a).total,
    contributions({ size: 1, color: 1 }, b).total,
  );
  assert.deepEqual(contributions({ size: 1, color: 1.5 }, a), {
    sizePoints: 80,
    colorPoints: 60,
    total: 140,
  });
  assert.equal(contributions({ size: 1, color: 1.5 }, b).total, 160);
});
test("全范围偏置保持排名；同一颗果子的两种输出在同一条线上越过阈值", () => {
  for (let size = 0.5; size <= 2; size += 0.25)
    for (let color = 0.5; color <= 2; color += 0.25) {
      const weights = { size, color };
      const d = { ...start(), weights, biasPoints: biasAt(weights, 5) };
      const ids = ranking(d).map((r) => r.fruit.id);
      let count = 5;
      for (let cut = 5; cut <= 95; cut++) {
        const tuned = { ...d, biasPoints: biasAt(weights, cut) };
        assert.ok(validDraft(tuned));
        assert.equal(crossing(tuned), cut);
        const list = ranking(tuned);
        assert.deepEqual(
          list.map((r) => r.fruit.id),
          ids,
        );
        const selected = list.filter((r) => r.hard).length;
        assert.ok(selected <= count);
        count = selected;
        const readings = [cut - 1, cut, cut + 1].map((orange) =>
          reading(tuned, { ...tray[0], orange }),
        );
        assert.deepEqual(
          readings.map((r) => r.hard),
          [0, 1, 1],
        );
        assert.equal(readings[1].z, 0);
        assert.equal(readings[1].soft, 0.5);
        assert.ok(readings[0].soft < 0.5 && readings[2].soft > 0.5);
      }
    }
});
test("阶段快照可载入，超出模拟范围的草稿不会恢复", () => {
  const saved = { ...start(), phase: "activation", orange: 39 };
  assert.ok(validDraft(JSON.parse(JSON.stringify(saved))));
  assert.ok(!validDraft({ ...saved, biasPoints: 0 }));
  assert.ok(!validDraft({ ...saved, orange: 101 }));
});
