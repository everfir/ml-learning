import { sigmoid } from "../../shared/ml/activation.ts";
export type Fruit = { id: string; diameter: number; orange: number };
export const tray: Fruit[] = [
  { id: "A", diameter: 75, orange: 40 },
  { id: "B", diameter: 65, orange: 80 },
  { id: "C", diameter: 70, orange: 60 },
  { id: "D", diameter: 59, orange: 25 },
  { id: "E", diameter: 79, orange: 92 },
];
export const phases = { weights: "调权重", bias: "调偏置", activation: "看过线" };
export type Weights = { size: number; color: number };
export type Draft = {
  version: 1;
  phase: keyof typeof phases;
  weights: Weights;
  biasPoints: number;
  orange: number;
  pick: "A" | "B" | null;
};
export function sizePercent(diameter: number) {
  return 4 * (diameter - 55);
}
export const hard = (z: number) => Number(z >= 0);
export function contributions(w: Weights, f: Fruit) {
  // Keep quarter-weight × integer-percent products exact until after the threshold comparison.
  const sizePoints = w.size * sizePercent(f.diameter);
  const colorPoints = w.color * f.orange;
  return { sizePoints, colorPoints, total: sizePoints + colorPoints };
}
export function reading(d: Draft, f: Fruit) {
  const points = contributions(d.weights, f).total + d.biasPoints;
  const z = points / 100;
  return { z, hard: hard(z), soft: sigmoid(z) };
}
export function biasAt(w: Weights, orange: number) {
  return -contributions(w, { ...tray[0], orange }).total;
}
export function crossing(d: Draft) {
  return (-d.biasPoints - d.weights.size * sizePercent(tray[0].diameter)) / d.weights.color;
}
export function start(): Draft {
  const weights = { size: 1.25, color: 1 };
  return {
    version: 1,
    phase: "weights",
    weights,
    biasPoints: biasAt(weights, tray[0].orange),
    orange: tray[0].orange,
    pick: null,
  };
}
export function ranking(d: Draft) {
  return tray.map((f) => ({ fruit: f, ...reading(d, f) })).sort((a, b) => b.z - a.z);
}
function weight(v: unknown) {
  return typeof v === "number" && v >= 0.5 && v <= 2 && Number.isInteger(v * 4);
}
export function validDraft(value: unknown): value is Draft {
  const d = value as Partial<Draft> | null;
  if (
    d?.version !== 1 ||
    !Object.hasOwn(phases, d.phase ?? "") ||
    !d.weights ||
    !weight(d.weights.size) ||
    !weight(d.weights.color) ||
    typeof d.biasPoints !== "number" ||
    typeof d.orange !== "number" ||
    !Number.isInteger(d.orange) ||
    d.orange < 0 ||
    d.orange > 100 ||
    !(d.pick === null || d.pick === "A" || d.pick === "B")
  )
    return false;
  const cut = (-d.biasPoints - d.weights.size * sizePercent(tray[0].diameter)) / d.weights.color;
  return Number.isInteger(cut) && cut >= 5 && cut <= 95;
}
export const formatScore = (v: number) => String(Number(v.toFixed(4)));
