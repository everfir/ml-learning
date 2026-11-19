export type Bin = "fresh" | "juice";
export const bins: Record<Bin, string> = { fresh: "鲜食箱", juice: "加工箱" };
export type K = 1 | 3 | 5;
export interface Fruit {
  id: string;
  orange: number;
  diameter: number;
}
export interface Sample extends Fruit {
  bin: Bin;
}
export const samples: Sample[] = [
  { id: "01", orange: 74, diameter: 70, bin: "fresh" },
  { id: "02", orange: 82, diameter: 72, bin: "fresh" },
  { id: "03", orange: 78, diameter: 67, bin: "fresh" },
  { id: "04", orange: 65, diameter: 74, bin: "fresh" },
  { id: "05", orange: 63, diameter: 66, bin: "fresh" },
  { id: "06", orange: 48, diameter: 69, bin: "fresh" },
  { id: "07", orange: 18, diameter: 57, bin: "juice" },
  { id: "08", orange: 29, diameter: 55, bin: "juice" },
  { id: "09", orange: 31, diameter: 61, bin: "juice" },
  { id: "10", orange: 40, diameter: 64, bin: "juice" },
  { id: "11", orange: 52, diameter: 61, bin: "juice" },
  { id: "12", orange: 57, diameter: 65, bin: "juice" },
];
export const extra: Sample = { id: "13", orange: 81, diameter: 70, bin: "juice" };
export const batch: Sample[] = [
  { id: "A", orange: 80, diameter: 70, bin: "fresh" },
  { id: "B", orange: 22, diameter: 57, bin: "juice" },
  { id: "C", orange: 55, diameter: 64, bin: "juice" },
  { id: "D", orange: 78, diameter: 69, bin: "juice" },
];
export function training(withExtra: boolean) {
  return withExtra ? [...samples, extra] : samples;
}
export function distance(a: Fruit, b: Fruit) {
  return Math.hypot((a.orange - b.orange) / 10, (a.diameter - b.diameter) / 5);
}
export function predict(fruit: Fruit, k: K, withExtra: boolean) {
  const neighbors = training(withExtra)
    .map((sample) => ({ sample, distance: distance(sample, fruit) }))
    .sort((a, b) => a.distance - b.distance || a.sample.id.localeCompare(b.sample.id))
    .slice(0, k);
  const fresh = neighbors.filter((n) => n.sample.bin === "fresh").length;
  return { neighbors, fresh, juice: k - fresh, bin: (fresh > k / 2 ? "fresh" : "juice") as Bin };
}
export type Trial = { guess: Bin; k: K; withExtra: boolean };
export type Session = {
  version: 1;
  index: number;
  guess: Bin | null;
  k: K;
  withExtra: boolean;
  trials: Trial[];
};
export function start(): Session {
  return { version: 1, index: 0, guess: null, k: 3, withExtra: false, trials: [] };
}
function isBin(v: unknown): v is Bin {
  return v === "fresh" || v === "juice";
}
function isK(v: unknown): v is K {
  return v === 1 || v === 3 || v === 5;
}
function isTrial(v: unknown): v is Trial {
  if (!v || typeof v !== "object") return false;
  const r = v as Trial;
  return isBin(r.guess) && isK(r.k) && typeof r.withExtra === "boolean";
}
export function validSession(v: unknown): v is Session {
  if (!v || typeof v !== "object") return false;
  const s = v as Session;
  if (
    s.version !== 1 ||
    !Number.isInteger(s.index) ||
    s.index < 0 ||
    s.index >= batch.length ||
    !isK(s.k) ||
    typeof s.withExtra !== "boolean" ||
    !(s.guess === null || isBin(s.guess)) ||
    !Array.isArray(s.trials) ||
    !s.trials.every(isTrial)
  )
    return false;
  if (s.trials.length === s.index) return true;
  const latest = s.trials[s.index];
  return (
    s.trials.length === s.index + 1 &&
    latest.guess === s.guess &&
    latest.k === s.k &&
    latest.withExtra === s.withExtra
  );
}
