import assert from "node:assert/strict";
import test from "node:test";
import { forward, start } from "../src/experiments/fruit-display/model.ts";
import { decisionRegions } from "../src/experiments/fruit-display/regions.ts";

type Point = { size: number; color: number };
// The polygons go counterclockwise and include their boundary, even if only an edge remains.
function contains(polygon: Point[], p: Point) {
  if (!polygon.length) return false;
  const xs = polygon.map((v) => v.size),
    ys = polygon.map((v) => v.color);
  if (
    p.size < Math.min(...xs) ||
    p.size > Math.max(...xs) ||
    p.color < Math.min(...ys) ||
    p.color > Math.max(...ys)
  )
    return false;
  return polygon.every((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    return (
      (b.size - a.size) * (p.color - a.color) - (b.color - a.color) * (p.size - a.size) >= -1e-9
    );
  });
}
test("图中礼盒区和分拣器逐点一致，包含门槛等号、零权重与全收全拒", () => {
  for (const phase of ["single", "pair", "relu", "audit"] as const)
    for (let sizeWeight = -2; sizeWeight <= 2; sizeWeight++)
      for (let colorWeight = -2; colorWeight <= 2; colorWeight++)
        for (let threshold = -20; threshold <= 20; threshold++) {
          const d = { ...start(), phase, sizeWeight, colorWeight, threshold };
          const regions = decisionRegions(d);
          for (let size = 0; size <= 10; size++)
            for (let color = 0; color <= 10; color++) {
              const f = { id: "X", size, color };
              assert.equal(
                regions.some((poly) => contains(poly, f)),
                forward(d, f).gift,
              );
            }
        }
});
