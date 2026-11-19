export type Fruit = { id: string; diameter: number; orange: number };
export const examples: Fruit[] = [58, 66, 74].map((diameter) => ({
  id: `sample-${diameter}`,
  diameter,
  orange: 50,
}));
export const probes = [61, 62, 70, 71];
export const batchSize = 12;
export const stages = ["试一条线", "加第二道筛", "锁线验新果"];

export type Rule = {
  first: number;
  tilt: number;
  above: boolean;
  second: number | null;
};
type Audit = { round: number; seed: number };
export type Draft = {
  version: 1;
  tried: boolean;
  rule: Rule;
  audit: Audit | null;
};
export function start(): Draft {
  return {
    version: 1,
    tried: false,
    rule: { first: 56, tilt: 0, above: true, second: null },
    audit: null,
  };
}
export function stage(draft: Draft) {
  return draft.audit ? 2 : draft.rule.second !== null ? 1 : 0;
}
export function ordered(fruit: Fruit) {
  return fruit.diameter >= 62 && fruit.diameter <= 70;
}
export function height(cut: number, tilt: number, orange: number) {
  return cut + tilt * ((orange - 50) / 50);
}
export function accepts(rule: Rule, fruit: Fruit) {
  const first = height(rule.first, rule.tilt, fruit.orange);
  const meetsFirst = rule.above ? fruit.diameter >= first : fruit.diameter <= first;
  if (!meetsFirst || rule.second === null) return meetsFirst;
  const second = height(rule.second, rule.tilt, fruit.orange);
  return rule.above ? fruit.diameter <= second : fruit.diameter >= second;
}
export function hits(rule: Rule, fruit: Fruit[]) {
  return fruit.filter((f) => accepts(rule, f) === ordered(f)).length;
}
// At 50% orange the tilt term vanishes for all three examples.
export function bestSingle(rule: Rule): Rule {
  let best = { ...rule, second: null };
  for (const above of [rule.above, !rule.above]) {
    for (let first = 50; first <= 80; first++) {
      const candidate = { ...best, above, first };
      if (hits(candidate, examples) > hits(best, examples)) best = candidate;
    }
  }
  return best;
}
// Four boundary checks plus eight randomly drawn fruits. Saving the seed reproduces the batch.
export function sample(seed: number): Fruit[] {
  let state = seed >>> 0;
  function integer(min: number, max: number) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return min + Math.floor((state / 2 ** 32) * (max - min + 1));
  }
  return Array.from({ length: batchSize }, (_, i) => ({
    id: `${seed}-${i}`,
    diameter: probes[i] ?? integer(52, 78),
    orange: integer(5, 95),
  }));
}
function inRange(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}
export function validDraft(value: unknown): value is Draft {
  const d = value as Partial<Draft> | null;
  if (d?.version !== 1 || typeof d.tried !== "boolean" || !d.rule) return false;
  const { first, tilt, above, second } = d.rule;
  if (!inRange(first, 50, 80) || !inRange(tilt, -10, 10) || typeof above !== "boolean")
    return false;
  if (second !== null && (!d.tried || !inRange(second, 50, 80))) return false;
  return (
    d.audit === null ||
    (!!d.audit &&
      second !== null &&
      inRange(d.audit.seed, 0, 0xffffffff) &&
      inRange(d.audit.round, 1, Number.MAX_SAFE_INTEGER))
  );
}
