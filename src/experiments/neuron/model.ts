export const functions = ["Sigmoid", "ReLU", "Tanh", "Linear"] as const;
export type Activation = (typeof functions)[number];
export type Parameters = { activation: Activation; x: number; w: number; b: number };
export const defaults: Parameters = { activation: "Sigmoid", x: 1, w: 1.5, b: -0.5 };
export const formulas: Record<Activation, string> = {
  Sigmoid: "1 / (1 + e⁻ᶻ)",
  ReLU: "max(0, z)",
  Tanh: "tanh(z)",
  Linear: "z",
};
export function activate(fn: Activation, z: number) {
  switch (fn) {
    case "Sigmoid":
      return 1 / (1 + Math.exp(-z));
    case "ReLU":
      return Math.max(0, z);
    case "Tanh":
      return Math.tanh(z);
    case "Linear":
      return z;
  }
}
export function forward({ activation, x, w, b }: Parameters) {
  const z = w * x + b;
  return { z, a: activate(activation, z) };
}
export function validParameters(value: unknown): value is Parameters {
  if (!value || typeof value !== "object") return false;
  const p = value as Parameters;
  return (
    functions.includes(p.activation) &&
    [p.x, p.w, p.b].every((v) => Number.isFinite(v) && Math.abs(v) <= 4)
  );
}
export function fixed(value: number, places = 2) {
  return (Math.abs(value) < 0.5 * 10 ** -places ? 0 : value).toFixed(places);
}
