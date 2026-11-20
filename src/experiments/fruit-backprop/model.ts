import { type Fruit, ordered } from "../../shared/data/gift-order.ts";
import { training } from "../../shared/data/training-tray.ts";
import { sigmoid } from "../../shared/ml/activation.ts";

export type Branch = { gain: number; out: number };
export type Network = [Branch, Branch];
export const rates = [0.0125, 0.025, 0.05];
export function forward(net: Network, f: Fruit) {
  const diff = f.color - f.size;
  const inputs = [diff, -diff];
  const hidden = net.map((b, i) => Math.max(0, b.gain * inputs[i]));
  const score = hidden[0] * net[0].out + hidden[1] * net[1].out - 3;
  const p = sigmoid(score),
    gift = score >= 0,
    target = Number(ordered(f));
  const loss = Math.log1p(Math.exp(target ? -score : score));
  return { inputs, hidden, score, p, gift, loss, error: p - target };
}
export function gradients(net: Network, f: Fruit): Network {
  const r = forward(net, f);
  const branch = (b: Branch, i: number) => ({
    out: r.error * r.hidden[i],
    gain: r.hidden[i] > 0 ? r.error * b.out * r.inputs[i] : 0,
  });
  return [branch(net[0], 0), branch(net[1], 1)];
}
export function update(net: Network, f: Fruit, rate: number): Network {
  const g = gradients(net, f);
  const next = (i: number) => ({
    gain: net[i].gain - rate * g[i].gain,
    out: net[i].out - rate * g[i].out,
  });
  return [next(0), next(1)];
}
export const meanLoss = (net: Network) =>
  training.reduce((sum, f) => sum + forward(net, f).loss, 0) / training.length;
export type Draft = {
  version: 1;
  net: Network;
  selected: string;
  prior: { net: Network; id: string } | null;
  steps: number;
  traySteps: number;
  rate: number;
  history: number[];
  seed: number | null;
};
export function start(): Draft {
  const net: Network = [
    { gain: 1, out: 0.25 },
    { gain: 1, out: 0.25 },
  ];
  return {
    version: 1,
    net,
    selected: "A",
    prior: null,
    steps: 0,
    traySteps: 0,
    rate: 0.025,
    history: [meanLoss(net)],
    seed: null,
  };
}
export function learn(d: Draft, fromTray: boolean): Draft {
  if (d.seed !== null) return d;
  const f = fromTray
    ? training[d.traySteps % training.length]
    : training.find((f) => f.id === d.selected);
  if (!f) return d;
  const net = update(d.net, f, d.rate);
  return {
    ...d,
    net,
    selected: f.id,
    prior: { net: d.net, id: f.id },
    steps: d.steps + 1,
    traySteps: d.traySteps + Number(fromTray),
    history: [...d.history.slice(-60), meanLoss(net)],
  };
}
const known = (id: unknown) => training.some((f) => f.id === id);
function network(n: unknown): n is Network {
  return (
    Array.isArray(n) &&
    n.length === 2 &&
    n.every((b) => b && Number.isFinite(b.gain) && Number.isFinite(b.out))
  );
}
const count = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
export function validDraft(value: unknown): value is Draft {
  const d = value as Partial<Draft> | null;
  return (
    d?.version === 1 &&
    network(d.net) &&
    known(d.selected) &&
    count(d.steps) &&
    count(d.traySteps) &&
    d.traySteps <= d.steps &&
    typeof d.rate === "number" &&
    rates.includes(d.rate) &&
    (d.prior === null || (!!d.prior && known(d.prior.id) && network(d.prior.net))) &&
    Array.isArray(d.history) &&
    d.history.length === Math.min(61, d.steps + 1) &&
    d.history.every((n) => Number.isFinite(n) && n >= 0) &&
    (d.seed === null || (count(d.seed) && d.seed <= 0xffffffff))
  );
}
