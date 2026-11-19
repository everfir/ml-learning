type Reading = { diameter: number; orange: number };
export type Fruit = Reading & { id: string };
export type Feature = keyof Reading;
export const features: Feature[] = ["diameter", "orange"];
export const names = { diameter: "果径", orange: "橙色面积" };
export const units = { diameter: " mm", orange: "%" };
export const bin = (gift: boolean) => (gift ? "礼盒" : "散装");
export function order({ diameter, orange }: Reading) {
  return diameter < 66 ? orange >= 70 : orange <= 45;
}
export const pairs: Fruit[] = [
  { id: "A", diameter: 60, orange: 90 },
  { id: "B", diameter: 60, orange: 30 },
  { id: "C", diameter: 72, orange: 90 },
  { id: "D", diameter: 72, orange: 30 },
];
export const midpoint: Fruit = { id: "中点", diameter: 66, orange: 60 };
export type Band = { center: number; tilt: number; width: number };
export const bandHeight = (b: Band, orange: number) => b.center + (b.tilt * (orange - 60)) / 50;
export const inBand = (b: Band, f: Fruit) =>
  Math.abs(f.diameter - bandHeight(b, f.orange)) <= b.width;

export type Example = Fruit & { gift: boolean };
export const training: Example[] = [60, 65, 68, 72].flatMap((diameter) =>
  [25, 40, 50, 65, 75, 80, 85, 90, 95].map((orange) => ({
    id: `train-${diameter}-${orange}`,
    diameter,
    orange,
    gift: order({ diameter, orange }),
  })),
);
export type Split = { feature: Feature; cut: number };
export type Node = {
  id: string;
  count: number;
  gifts: number;
  split?: Split & { left: Node; right: Node };
};
const leaf = (id: string, items: Example[]): Node => ({
  id,
  count: items.length,
  gifts: items.filter((f) => f.gift).length,
});
export const predictLeaf = (n: Node) => 2 * n.gifts > n.count;
export function route(root: Node, fruit: Fruit) {
  const path = [root];
  let node = root;
  while (node.split) {
    const { feature, cut, left, right } = node.split;
    node = fruit[feature] <= cut ? left : right;
    path.push(node);
  }
  return { path, leaf: node };
}
export const predict = (tree: Node, fruit: Fruit) => predictLeaf(route(tree, fruit).leaf);
export const question = (s: Split) => `${names[s.feature]} ≤ ${s.cut}${units[s.feature]}？`;
function impurity(items: Example[]) {
  const p = items.filter((f) => f.gift).length / items.length;
  return items.length * 2 * p * (1 - p);
}
// Rank splits by the reduction in total (sample-weighted) Gini impurity.
export function train(items: Example[]) {
  const states: Node[] = [leaf("根", items)];
  while (true) {
    const tree = states[states.length - 1];
    const groups = new Map<Node, Example[]>();
    for (const f of items) {
      const { path, leaf: n } = route(tree, f);
      if (path.length > 2) continue;
      const group = groups.get(n);
      if (group) group.push(f);
      else groups.set(n, [f]);
    }
    let best: { id: string; gain: number; split: NonNullable<Node["split"]> } | undefined;
    for (const [node, group] of groups) {
      if (group.length < 2) continue;
      for (const feature of features) {
        const values = [...new Set(group.map((f) => f[feature]))].sort((a, b) => a - b);
        for (let i = 1; i < values.length; i++) {
          const cut = (values[i - 1] + values[i]) / 2;
          const left = group.filter((f) => f[feature] <= cut);
          const right = group.filter((f) => f[feature] > cut);
          const gain = impurity(group) - impurity(left) - impurity(right);
          if (gain > (best?.gain ?? 0) + 1e-10)
            best = {
              id: node.id,
              gain,
              split: {
                feature,
                cut,
                left: leaf(`${node.id}左`, left),
                right: leaf(`${node.id}右`, right),
              },
            };
        }
      }
    }
    if (!best) return states;
    const { id, split } = best;
    function grow(n: Node): Node {
      if (n.id === id) return { ...n, split };
      if (!n.split) return n;
      return { ...n, split: { ...n.split, left: grow(n.split.left), right: grow(n.split.right) } };
    }
    states.push(grow(tree));
  }
}
export const trees = train(training);
export function harvest(seed: number): Fruit[] {
  let state = seed;
  const integer = (a: number, b: number) => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return a + Math.floor((state / 2 ** 32) * (b - a + 1));
  };
  return Array.from({ length: 16 }, (_, i) => ({
    id: `${seed}-${i}`,
    diameter: integer(55, 78),
    orange: integer(10, 95),
  }));
}
export type Draft = {
  version: 1;
  phase: "guess" | "band" | "tree";
  guesses: (boolean | null)[];
  revealed: number;
  band: Band;
  middle: boolean;
  step: number;
  seed: number | null;
};
export function start(): Draft {
  return {
    version: 1,
    phase: "guess",
    guesses: [null, null, null, null],
    revealed: 0,
    band: { center: 66, tilt: 0, width: 3 },
    middle: false,
    step: 0,
    seed: null,
  };
}
function int(v: unknown, min: number, max: number) {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}
export function validDraft(value: unknown): value is Draft {
  const d = value as Partial<Draft> | null;
  if (
    d?.version !== 1 ||
    !["guess", "band", "tree"].includes(d.phase ?? "") ||
    !Array.isArray(d.guesses) ||
    d.guesses.length !== 4 ||
    !d.guesses.every((v) => v === null || typeof v === "boolean") ||
    !int(d.revealed, 0, 2)
  )
    return false;
  return (
    !!d.band &&
    int(d.band.center, 54, 78) &&
    int(d.band.tilt, -16, 16) &&
    int(d.band.width, 1, 12) &&
    typeof d.middle === "boolean" &&
    int(d.step, 0, trees.length - 1) &&
    (d.seed === null || int(d.seed, 0, 0xffffffff)) &&
    d.guesses.slice(0, 2 * (d.revealed ?? 0)).every((v) => v !== null) &&
    (d.phase === "guess" || d.revealed === 2) &&
    (d.phase !== "tree" || d.middle) &&
    (d.seed === null || d.phase === "tree")
  );
}
