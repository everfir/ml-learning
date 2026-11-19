import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";

// Only import this module from an experiment that needs tensor operations.
export async function cpuRuntime() {
  if (tf.getBackend() !== "cpu" && !(await tf.setBackend("cpu")))
    throw new Error("无法初始化 CPU 后端");
  await tf.ready();
  return tf;
}
