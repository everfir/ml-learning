import { drawFruit, examples, type Fruit, ordered } from "../../shared/data/gift-order.ts";
import { sigmoid } from "../../shared/ml/activation.ts";
export const training: Fruit[] = [
  ...examples,
  { id: "D", size: 4, color: 6 },
  { id: "E", size: 1, color: 4 },
  { id: "F", size: 7, color: 4 },
  { id: "G", size: 8, color: 9 },
  { id: "H", size: 3, color: 1 },
  { id: "I", size: 6, color: 8 },
  { id: "J", size: 5, color: 9 },
  { id: "K", size: 7, color: 10 },
  { id: "L", size: 10, color: 9 },
];
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
export const auditSize = 100;
export function audit(seed: number, version: Draft["version"] = 2) {
  if (version === 1) return drawFruit(seed, training, 10, "M");
  return drawFruit(seed, training, auditSize, "M").map((f, i) => ({ ...f, id: String(i + 1) }));
}

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
