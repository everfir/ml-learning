import { drawFruit, examples, type Fruit } from "../../shared/data/gift-order.ts";

export { box, examples, type Fruit, ordered, orderGap } from "../../shared/data/gift-order.ts";
export const phases = {
  single: "试一个打分器",
  pair: "接第二路",
  relu: "负分记零",
  audit: "锁定验收",
};
export type Phase = keyof typeof phases;
export type Draft = {
  version: 2 | 3;
  phase: Phase;
  sizeWeight: number;
  colorWeight: number;
  threshold: number;
  seed: number;
};
export function start(): Draft {
  return {
    version: 3,
    phase: "single",
    sizeWeight: -1,
    colorWeight: 1,
    threshold: 5,
    seed: 0,
  };
}
export function forward(d: Draft, f: Fruit) {
  const raw1 = d.sizeWeight * f.size + d.colorWeight * f.color;
  const raw2 = -raw1;
  const active = d.phase === "relu" || d.phase === "audit";
  const first = active ? Math.max(0, raw1) : raw1;
  const second = d.phase === "single" ? 0 : active ? Math.max(0, raw2) : raw2;
  const sum = first + second;
  return { raw1, raw2, first, second, sum, gift: sum >= d.threshold };
}
export const auditSize = 10;
export function batch(seed: number, version: Draft["version"] = 3): Fruit[] {
  // Version 2 records start with two fixed checks and four seeded draws.
  const result: Fruit[] =
    version === 2
      ? [
          { id: "D", size: 7, color: 4 },
          { id: "E", size: 7, color: 5 },
        ]
      : [];
  return [
    ...result,
    ...drawFruit(
      seed,
      [...examples, ...result],
      version === 2 ? 4 : auditSize,
      version === 2 ? "F" : "D",
    ),
  ];
}
function integer(n: unknown, min: number, max: number) {
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
}
export function validDraft(value: unknown): value is Draft {
  const d = value as Partial<Draft> | null;
  return (
    (d?.version === 2 || d?.version === 3) &&
    typeof d.phase === "string" &&
    Object.hasOwn(phases, d.phase) &&
    integer(d.sizeWeight, -2, 2) &&
    integer(d.colorWeight, -2, 2) &&
    integer(d.threshold, -20, 20) &&
    integer(d.seed, 0, 0xffffffff)
  );
}
