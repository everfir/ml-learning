import assert from "node:assert/strict";
import test from "node:test";
import { activate, defaults, forward, validParameters } from "../src/experiments/neuron/model.ts";
import { cpuRuntime } from "../src/shared/ml/tensor.ts";

test("首课默认参数与讲解中的计算一致", () => {
  const { z, a } = forward(defaults);
  assert.equal(z, 1);
  assert.equal(a.toFixed(3), "0.731");
  assert.equal(activate("Tanh", 1).toFixed(3), "0.762");
  assert.equal(activate("ReLU", -1), 0);
  assert.equal(activate("Linear", -1), -1);
});
test("零权重时结果只依赖偏置，损坏的草稿不恢复", () => {
  assert.deepEqual(forward({ ...defaults, x: -4, w: 0 }), forward({ ...defaults, x: 4, w: 0 }));
  assert.equal(validParameters({ ...defaults, x: Infinity }), false);
  assert.equal(validParameters({}), false);
  assert.ok(validParameters(defaults));
});
test("可选 TF.js CPU 后端可用并可释放张量", async () => {
  const tf = await cpuRuntime();
  const before = tf.memory().numTensors;
  const value = tf.tidy(() => tf.add(tf.scalar(1), tf.scalar(2)).dataSync()[0]);
  assert.equal(value, 3);
  assert.equal(tf.memory().numTensors, before);
});
