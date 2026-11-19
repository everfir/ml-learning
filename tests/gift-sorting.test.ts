import assert from "node:assert/strict";
import test from "node:test";
import {
  accepts,
  batchSize,
  bestSingle,
  examples,
  hits,
  probes,
  sample,
  start,
  validDraft,
} from "../src/experiments/gift-sorting/model.ts";

test("任何单线都至少错分一颗，枚举器确实找到两颗正确", () => {
  for (const above of [true, false]) {
    for (let first = 50; first <= 80; first++) {
      for (let tilt = -10; tilt <= 10; tilt++) {
        const rule = { first, above, tilt, second: null };
        assert.ok(hits(rule, examples) <= 2);
      }
      assert.equal(hits(bestSingle({ above, first, tilt: 3, second: null }), examples), 2);
    }
  }
});
test("上下限可按任意顺序安装，包含端点，交叉的筛不能放行", () => {
  const batch = sample(53);
  assert.equal(batch.length, batchSize);
  assert.deepEqual(
    batch.slice(0, 4).map((f) => f.diameter),
    probes,
  );
  for (const above of [true, false]) {
    const exact = { first: above ? 62 : 70, second: above ? 70 : 62, above, tilt: 0 };
    assert.deepEqual(
      batch.slice(0, 4).map((f) => accepts(exact, f)),
      [false, true, true, false],
    );
    assert.equal(hits(exact, batch), batchSize);
    assert.equal(hits(exact, examples), 3);
    assert.ok(batch.every((f) => !accepts({ ...exact, above: !above }, f)));
  }
  assert.equal(hits({ first: 60, second: 72, above: true, tilt: 0 }, examples), 3);
  assert.ok(hits({ first: 60, second: 72, above: true, tilt: 0 }, batch) <= batchSize - 2);
});
test("记录能复现当前验收，缺失第二道筛的验收不可载入", () => {
  const draft = start();
  const audit = { seed: 91, round: 2 };
  assert.ok(validDraft(draft));
  assert.ok(!validDraft({ ...draft, audit }));
  const saved = { ...draft, tried: true, rule: { ...draft.rule, second: 73 }, audit };
  const restored = JSON.parse(JSON.stringify(saved));
  assert.ok(validDraft(restored));
  assert.deepEqual(sample(restored.audit?.seed ?? 0), sample(audit.seed));
  assert.notDeepEqual(sample(90), sample(audit.seed));
});
