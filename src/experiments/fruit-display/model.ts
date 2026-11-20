export type Fruit = { id: string; size: number; color: number };
export const examples: Fruit[] = [
  { id: "A", size: 2, color: 8 },
  { id: "B", size: 8, color: 2 },
  { id: "C", size: 5, color: 5 },
];
export const phases = {
  single: "试一个打分器",
  pair: "接第二路",
  relu: "负分记零",
  audit: "锁定验收",
};
export type Phase = keyof typeof phases;
export type Draft = {
  version: 2;
  phase: Phase;
  sizeWeight: number;
  colorWeight: number;
  threshold: number;
  seed: number;
  guesses: (boolean | null)[];
  revealed: boolean;
};
export const freshGuesses = () => Array<boolean | null>(6).fill(null);
export function start(): Draft {
  return {
    version: 2,
    phase: "single",
    sizeWeight: -1,
    colorWeight: 1,
    threshold: 5,
    seed: 0,
    guesses: freshGuesses(),
    revealed: false,
  };
}
export const box = (gift: boolean) => (gift ? "礼盒" : "散装");
export const orderGap = 3;
export const ordered = (f: Fruit) => Math.abs(f.color - f.size) >= orderGap;
export function forward(d: Draft, f: Fruit) {
  const raw1 = d.sizeWeight * f.size + d.colorWeight * f.color;
  const raw2 = -raw1;
  const active = d.phase === "relu" || d.phase === "audit";
  const first = active ? Math.max(0, raw1) : raw1;
  const second = d.phase === "single" ? 0 : active ? Math.max(0, raw2) : raw2;
  const sum = first + second;
  return { raw1, raw2, first, second, sum, gift: sum >= d.threshold };
}
// The first pair tests the inclusive order threshold. Remaining integer inputs are new to the tray.
export function batch(seed: number): Fruit[] {
  const result = [
    { id: "D", size: 7, color: 4 },
    { id: "E", size: 7, color: 5 },
  ];
  const pool: Fruit[] = [];
  for (let size = 0; size <= 10; size++)
    for (let color = 0; color <= 10; color++) {
      if (![...examples, ...result].some((f) => f.size === size && f.color === color))
        pool.push({ id: "", size, color });
    }
  let state = seed;
  for (const id of ["F", "G", "H", "I"]) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const [f] = pool.splice(Math.floor((state / 2 ** 32) * pool.length), 1);
    result.push({ ...f, id });
  }
  return result;
}
function integer(n: unknown, min: number, max: number) {
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
}
export function validDraft(value: unknown): value is Draft {
  const d = value as Partial<Draft> | null;
  return (
    d?.version === 2 &&
    typeof d.phase === "string" &&
    Object.hasOwn(phases, d.phase) &&
    integer(d.sizeWeight, -2, 2) &&
    integer(d.colorWeight, -2, 2) &&
    integer(d.threshold, -20, 20) &&
    integer(d.seed, 0, 0xffffffff) &&
    typeof d.revealed === "boolean" &&
    Array.isArray(d.guesses) &&
    d.guesses.length === 6 &&
    d.guesses.every((g) => g === null || typeof g === "boolean") &&
    (!d.revealed || (d.phase === "audit" && d.guesses.slice(0, 2).every((g) => g !== null)))
  );
}
