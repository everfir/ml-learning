import { type Draft, forward } from "./model.ts";

type Point = { size: number; color: number };
const square: Point[] = [
  { size: 0, color: 0 },
  { size: 10, color: 0 },
  { size: 10, color: 10 },
  { size: 0, color: 10 },
];

// Clip the score plane at the threshold. The two ReLU inputs are opposite, so at a
// positive threshold their accepted half-planes are disjoint.
function halfPlane(d: Draft, branch: "raw1" | "raw2") {
  const score = (p: Point) => forward(d, { ...p, id: "" })[branch] - d.threshold;
  const polygon: Point[] = [];
  for (let i = 0; i < square.length; i++) {
    const a = square[i],
      b = square[(i + 1) % square.length];
    const sa = score(a),
      sb = score(b);
    if (sa >= 0) polygon.push(a);
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb);
      polygon.push({
        size: a.size + t * (b.size - a.size),
        color: a.color + t * (b.color - a.color),
      });
    }
  }
  return polygon;
}
export function decisionRegions(d: Draft) {
  if (d.phase === "single") return [halfPlane(d, "raw1")];
  if (d.threshold <= 0) return [square];
  if (d.phase === "pair") return [];
  return [halfPlane(d, "raw1"), halfPlane(d, "raw2")];
}
