import { drawFruit, type Fruit, ordered } from "../../shared/data/gift-order.ts";
import { auditSize, drawAudit, training } from "../../shared/data/training-tray.ts";
import { sigmoid } from "../../shared/ml/activation.ts";

export { auditSize, training };
export const initialWeight = 0.25;
export const weights = Array.from({ length: 41 }, (_, i) => i / 20);
export function inspect(weight: number, f: Fruit) {
  const diff = f.color - f.size;
  const score = weight * Math.max(0, diff) + Math.max(0, -diff) - 3;
  const gift = score >= 0;
  return {
    probability: sigmoid(score),
    gift,
    correct: gift === ordered(f),
    loss: Math.log1p(Math.exp(ordered(f) ? -score : score)),
  };
}
export function measure(weight: number, fruits: Fruit[]) {
  const values = fruits.map((f) => inspect(weight, f));
  return {
    mean: values.reduce((sum, v) => sum + v.loss, 0) / values.length,
    hits: values.filter((v) => v.correct).length,
  };
}
export const audit = (seed: number, version: Draft["version"] = 2) =>
  version === 1 ? drawFruit(seed, training, 10, "M") : drawAudit(seed);
type Settings = { weight: number; selected: string; seed: number | null };
export type Draft = Settings & ({ version: 1 } | { version: 2; reference: number });
export const referenceWeight = (d: Draft) => (d.version === 1 ? d.weight : d.reference);
export function start(): Draft {
  return { version: 2, weight: initialWeight, reference: initialWeight, selected: "A", seed: null };
}
export function validDraft(value: unknown): value is Draft {
  const d = value as Partial<Draft> | null;
  return (
    (d?.version === 1 ||
      (d?.version === 2 && typeof d.reference === "number" && weights.includes(d.reference))) &&
    typeof d.weight === "number" &&
    weights.includes(d.weight) &&
    training.some((f) => f.id === d.selected) &&
    (d.seed === null ||
      (Number.isInteger(d.seed) &&
        typeof d.seed === "number" &&
        d.seed >= 0 &&
        d.seed <= 0xffffffff))
  );
}
