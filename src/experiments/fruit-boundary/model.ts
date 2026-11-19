export type Bin = "fresh" | "juice";
export const bins = { fresh: "鲜食箱", juice: "加工箱" };
export type Fruit = { orange: number; diameter: number; bin: Bin };
export type Line = { height: number; tilt: number };
export const limits = { height: [60, 70], tilt: [-12, 12] } as const;
export const initial: Line = { height: 68, tilt: 6 };
export const batchSize = 100;

// A reproducible stream of half-open uniforms, shifted half a cell away from zero.
export function harvest(seed: number, count: number) {
  let state = seed >>> 0;
  function uniform() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + 0.5) / 4294967296;
  }
  const fruit: Fruit[] = [];
  while (fruit.length < count) {
    const bin = uniform() < 0.5 ? "fresh" : "juice";
    let orange: number, diameter: number;
    do {
      const radius = Math.sqrt(-2 * Math.log(uniform()));
      const angle = 2 * Math.PI * uniform();
      orange = (bin === "fresh" ? 58 : 42) + 19 * radius * Math.cos(angle);
      diameter = (bin === "fresh" ? 68 : 62) + 5 * radius * Math.sin(angle);
    } while (orange < 0 || orange > 100 || diameter < 50 || diameter > 80);
    fruit.push({ bin, orange, diameter });
  }
  return { fruit, nextSeed: state };
}

export const training = harvest(10, 32).fruit;
export function boundary(line: Line, orange: number) {
  return line.height + (line.tilt * (orange - 50)) / 50;
}
export function inspect(line: Line, fruit: Fruit) {
  const score = (fruit.diameter - boundary(line, fruit.orange)) / 4;
  const predicted: Bin = score >= 0 ? "fresh" : "juice";
  const loss = Math.log1p(Math.exp(fruit.bin === "fresh" ? -score : score));
  return { predicted, loss, freshWeight: 1 / (1 + Math.exp(-score)) };
}
export function measure(line: Line, fruit = training) {
  let hits = 0,
    total = 0;
  for (const sample of fruit) {
    const { predicted, loss } = inspect(line, sample);
    if (predicted === sample.bin) hits++;
    total += loss;
  }
  return { hits, loss: total / fruit.length };
}
export function adjust(line: Line, key: keyof Line, value: number): Line {
  const [min, max] = limits[key];
  return { ...line, [key]: Math.min(max, Math.max(min, Math.round(value * 2) / 2)) };
}
export function train(start: Line) {
  const path = [{ line: start, ...measure(start) }];
  while (true) {
    const current = path[path.length - 1];
    let best = current;
    for (const key of ["height", "tilt"] as const) {
      for (const delta of [-0.5, 0.5]) {
        const line = adjust(current.line, key, current.line[key] + delta);
        const candidate = { line, ...measure(line) };
        if (candidate.loss < best.loss - 1e-12) best = candidate;
      }
    }
    if (best === current) return path;
    path.push(best);
  }
}
export type Audit = {
  lastSeed: number;
  batches: number;
  humanHits: number;
  machineHits: number;
};
export function evaluateBatch(
  human: Line,
  machine: Line,
  seed: number,
  previous: Audit | null,
): Audit {
  const { fruit } = harvest(seed, batchSize);
  return {
    lastSeed: seed,
    batches: (previous?.batches ?? 0) + 1,
    humanHits: (previous?.humanHits ?? 0) + measure(human, fruit).hits,
    machineHits: (previous?.machineHits ?? 0) + measure(machine, fruit).hits,
  };
}
export type Draft = { version: 1; human: Line; step: number | null; audit: Audit | null };
export function start(): Draft {
  return { version: 1, human: initial, step: null, audit: null };
}
export function validDraft(value: unknown): value is Draft {
  const d = value as Partial<Draft> | null;
  if (
    d?.version !== 1 ||
    !d.human ||
    !Object.entries(limits).every(([key, [min, max]]) => {
      const n = d.human?.[key as keyof Line];
      return typeof n === "number" && Number.isInteger(n * 2) && n >= min && n <= max;
    })
  )
    return false;
  if (d.step === null) return d.audit === null;
  if (
    typeof d.step !== "number" ||
    !Number.isInteger(d.step) ||
    d.step < 0 ||
    d.step >= train(d.human).length
  )
    return false;
  const a = d.audit;
  return (
    a === null ||
    (!!a &&
      Number.isSafeInteger(a.batches) &&
      a.batches >= 1 &&
      Number.isSafeInteger(a.batches * batchSize) &&
      Number.isInteger(a.lastSeed) &&
      a.lastSeed >= 0 &&
      a.lastSeed <= 0xffffffff &&
      [a.humanHits, a.machineHits].every(
        (n) => Number.isSafeInteger(n) && n >= 0 && n <= a.batches * batchSize,
      ))
  );
}
