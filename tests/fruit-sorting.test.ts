import assert from "node:assert/strict";
import test from "node:test";
import {
  batch,
  distance,
  extra,
  predict,
  samples,
  start,
  validSession,
} from "../src/experiments/fruit-sorting/model.ts";

test("A 的距离与讲义一致，同一条新增记录改变最近邻而保留三票多数", () => {
  const a = batch[0];
  assert.equal(distance(a, samples[1]).toFixed(2), "0.45");
  assert.equal(distance(a, extra).toFixed(2), "0.10");
  assert.deepEqual(
    predict(a, 3, false).neighbors.map((n) => n.sample.id),
    ["02", "01", "03"],
  );
  assert.equal(predict(a, 1, false).bin, "fresh");
  assert.equal(predict(a, 1, true).bin, "juice");
  assert.equal(predict(a, 3, true).bin, "fresh");
});
test("四颗留出果不参与投票，默认设置能展示一个泛化错误", () => {
  const predictions = batch.map((q) => predict(q, 3, false));
  assert.deepEqual(
    predictions.map((r) => r.bin),
    ["fresh", "juice", "juice", "fresh"],
  );
  assert.equal(predictions.filter((r, i) => r.bin === batch[i].bin).length, 3);
  for (const r of predictions)
    assert.ok(r.neighbors.every((n) => !batch.some((q) => q.id === n.sample.id)));
});
test("保留尚未揭晓和已揭晓的轮次，忽略不一致的旧草稿", () => {
  const s = start();
  assert.ok(validSession(s));
  const trial = { guess: "fresh", k: 3, withExtra: false };
  assert.ok(validSession({ ...s, guess: "fresh", trials: [trial] }));
  assert.ok(validSession({ ...s, index: 1, trials: [trial] }));
  assert.equal(validSession({ ...s, trials: [trial] }), false);
  assert.equal(validSession({ ...s, index: 2 }), false);
});
