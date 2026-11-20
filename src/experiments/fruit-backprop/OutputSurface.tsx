import { useMemo, useState } from "react";
import { box, type Fruit, ordered } from "@/shared/data/gift-order";
import { forward, type Network } from "./model";

type Vertex = { size: number; color: number; p: number };
const ticks = [0, 5, 10];
const percent = (p: number) => `${(100 * p).toFixed(1)}%`;

// Equal differences have equal output. Sample along those diagonals so the mesh
// follows the ReLU crease and the two score=0 crossings exactly.
function surfaceBands(net: Network) {
  const differences = new Set(Array.from({ length: 41 }, (_, i) => i / 2 - 10));
  function row(diff: number) {
    const size = Math.max(0, -diff),
      color = Math.max(0, diff);
    const { p, score } = forward(net, { id: "", size, color });
    const length = 10 - Math.abs(diff);
    return {
      diff,
      score,
      ends: [
        { size, color, p },
        { size: size + length, color: color + length, p },
      ],
    };
  }
  const center = row(0);
  for (const end of [-10, 10]) {
    const { score } = row(end);
    if (score > 0) differences.add((end * -center.score) / (score - center.score));
  }
  return Array.from(differences)
    .sort((a, b) => a - b)
    .map(row);
}

function camera(angle: number) {
  const a = (angle * Math.PI) / 180;
  return (size: number, color: number, p = 0) => {
    const x = size - 5,
      y = color - 5;
    const depth = x * Math.sin(a) + y * Math.cos(a);
    return {
      x: 221 + 23 * (x * Math.cos(a) - y * Math.sin(a)),
      y: 177 + 8 * depth - 111 * p,
      depth,
    };
  };
}
type Point = ReturnType<ReturnType<typeof camera>>;
const coords = (point: Point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`;

export function OutputSurface({
  net,
  fruit,
  selected,
  previous,
  onSelect,
}: {
  net: Network;
  fruit: Fruit[];
  selected?: Fruit;
  previous?: Network;
  onSelect?: (id: string) => void;
}) {
  const [angle, setAngle] = useState(38);
  const [byBox, setByBox] = useState(false);
  const project = useMemo(() => camera(angle), [angle]);
  const bands = useMemo(() => surfaceBands(net), [net]);
  const mesh = useMemo(() => {
    const projected = (v: Vertex) => project(v.size, v.color, v.p);
    return bands
      .slice(1)
      .map((row, i) => {
        const last = bands[i];
        const p = (last.ends[0].p + row.ends[0].p) / 2;
        const corners = [last.ends[0], last.ends[1], row.ends[1], row.ends[0]].map(projected);
        const fill = byBox
          ? last.score + row.score >= 0
            ? "#f0b77e"
            : "#9bc9bf"
          : `hsl(${170 - 143 * p} 44% ${83 - 34 * p}%)`;
        return {
          diff: row.diff,
          depth: corners.reduce((sum, v) => sum + v.depth, 0) / 4,
          shape: corners.map(coords).join(" "),
          fill,
          lines: [0.25, 0.5, 0.75]
            .map((t) => {
              const at = (a: Point, b: Point) =>
                `${a.x + (b.x - a.x) * t},${a.y + (b.y - a.y) * t}`;
              return `M${at(corners[0], corners[1])} L${at(corners[3], corners[2])}`;
            })
            .join(" "),
          rim: [last, row]
            .filter((b) => Math.abs(b.score) < 1e-9)
            .map((b) => b.ends.map((v) => coords(projected(v))).join(" ")),
        };
      })
      .sort((a, b) => a.depth - b.depth);
  }, [bands, byBox, project]);
  const points = fruit
    .map((f) => {
      const output = forward(net, f);
      return { f, output, pt: project(f.size, f.color, output.p) };
    })
    .sort(
      (a, b) =>
        Number(a.f.id === selected?.id) - Number(b.f.id === selected?.id) ||
        a.pt.depth - b.pt.depth,
    );
  const z = project(0, 10);
  const current = selected && forward(net, selected);
  const before = previous && selected ? forward(previous, selected) : undefined;
  const oldPoint = before && selected ? project(selected.size, selected.color, before.p) : null;
  return (
    <figure className="bp-surface">
      <div className="bp-surface-tools">
        <label>
          <input type="checkbox" checked={byBox} onChange={(e) => setByBox(e.target.checked)} />{" "}
          按箱号染色
        </label>
        <label>
          转动视角{" "}
          <input
            type="range"
            min="15"
            max="75"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="bp-surface-frame">
        <svg
          viewBox="0 0 442 280"
          role="img"
          aria-label="模型输出曲面。底面是个头和橙色分数，高度是当前模型给出的礼盒概率。"
        >
          <title>模型对不同果子的礼盒概率</title>
          <g className="bp-floor">
            {ticks.map((n) => (
              <path
                key={n}
                d={`M${coords(project(0, n))} L${coords(project(10, n))} M${coords(project(n, 0))} L${coords(project(n, 10))}`}
              />
            ))}
            <path d={`M${coords(z)} V${z.y - 111}`} />
          </g>
          {[0, 0.5, 1].map((p) => (
            <g key={p}>
              <path className="bp-floor" d={`M${z.x - 4} ${z.y - p * 111} h4`} />
              <text x={z.x - 7} y={z.y - p * 111 + 4} textAnchor="end">
                {p * 100}%
              </text>
            </g>
          ))}
          <text x={z.x} y={z.y - 124} textAnchor="middle">
            礼盒概率
          </text>
          {mesh.map((b) => (
            <g key={b.diff}>
              <polygon points={b.shape} fill={b.fill} stroke={b.fill} strokeWidth=".8" />
              <polygon points={b.shape} className="bp-weave" />
              <path d={b.lines} className="bp-weave" />
              {b.rim.map((line) => (
                <polyline key={line} points={line} stroke="#593a26" strokeWidth="1.8" />
              ))}
            </g>
          ))}
          {ticks.map((n) => {
            const a = project(n, 10),
              b = project(10, n);
            return (
              <g key={n}>
                <text x={a.x - 6} y={a.y + 15} textAnchor="end">
                  {n}
                </text>
                {n !== 10 && (
                  <text x={b.x + 6} y={b.y + 15}>
                    {n}
                  </text>
                )}
              </g>
            );
          })}
          <text x={project(4, 10).x - 16} y={project(4, 10).y + 33} textAnchor="middle">
            个头（分）
          </text>
          <text x={project(10, 4).x + 16} y={project(10, 4).y + 33} textAnchor="middle">
            橙色（分）
          </text>
          {oldPoint && before && selected && current && (
            <g stroke="#283a38" strokeWidth="1.4">
              <title>上一步的高度 · {percent(before.p)}</title>
              <line
                x1={oldPoint.x}
                x2={oldPoint.x}
                y1={oldPoint.y}
                y2={project(selected.size, selected.color, current.p).y}
              />
              <circle cx={oldPoint.x} cy={oldPoint.y} r="2.7" fill="white" />
            </g>
          )}
          {points.map(({ f, pt, output }) => (
            <g key={f.id} transform={`translate(${pt.x} ${pt.y})`}>
              <title>
                {f.id} 果 · 礼盒概率 {percent(output.p)} · 订单{box(ordered(f))}
              </title>
              {output.gift !== ordered(f) && (
                <circle r="6.8" stroke="#8a3744" strokeDasharray="2 1.5" fill="none" />
              )}
              {ordered(f) ? (
                <circle r="3.7" fill="#803d1c" stroke="white" />
              ) : (
                <path d="M0 -4.5 4.5 0 0 4.5 -4.5 0Z" fill="#174f48" stroke="white" />
              )}
              {selected?.id === f.id && (
                <>
                  <circle r="9" fill="none" stroke="#202d30" strokeWidth="1.8" />
                  <text className="bp-picked" x="12" y="3">
                    {f.id}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
        {onSelect &&
          points.map(({ f, pt }) => (
            <button
              type="button"
              key={f.id}
              className="tray-point-hit"
              aria-label={`追踪 ${f.id} 果`}
              aria-pressed={selected?.id === f.id}
              style={{ left: `${(pt.x / 442) * 100}%`, top: `${(pt.y / 280) * 100}%` }}
              onClick={() => onSelect(f.id)}
            />
          ))}
      </div>
      <figcaption>
        {selected && current && (
          <p>
            <strong>{selected.id} 果</strong> · 礼盒概率{" "}
            <b>
              {before && `${percent(before.p)} → `}
              {percent(current.p)}
            </b>{" "}
            · 预测{box(current.gift)}
          </p>
        )}
        <p>
          {byBox ? "青色为散装，橙色为礼盒（概率 ≥ 50%）。" : "曲面越高，模型越倾向礼盒。"}
          圆点应进礼盒，菱形应走散装，虚圈表示错分。
        </p>
      </figcaption>
    </figure>
  );
}
