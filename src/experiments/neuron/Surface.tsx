import { useMemo } from "react";
import { activate, fixed, type Parameters } from "./model";

function project(x: number, w: number, p: Pick<Parameters, "activation" | "b">) {
  const a = activate(p.activation, x * w + p.b);
  const height = p.activation === "Sigmoid" ? a - 0.5 : p.activation === "Tanh" ? a / 2 : a / 36;
  return { x: 225 + x * 23 + w * 19, y: 100 - x * 5 + w * 8 - height * 85 };
}
export function Surface({ p }: { p: Parameters }) {
  const { activation, b } = p;
  const grid = useMemo(() => {
    const traces = [];
    for (const axis of ["x", "w"]) {
      for (let i = 0; i <= 24; i++) {
        const constant = -4 + i / 3;
        const points = Array.from({ length: 73 }, (_, j) => {
          const t = -4 + j / 9;
          const pt = project(axis === "x" ? t : constant, axis === "w" ? t : constant, {
            activation,
            b,
          });
          return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        }).join(" ");
        traces.push(
          <polyline
            key={axis + i}
            points={points}
            stroke={axis === "x" ? "#c85729" : "#e5976b"}
            strokeWidth={i % 6 === 0 ? 1.1 : 0.7}
          />,
        );
      }
    }
    return traces;
  }, [activation, b]);
  const current = project(p.x, p.w, p);
  return (
    <figure className="surface-view">
      <svg
        viewBox="0 0 450 218"
        role="img"
        aria-label={`固定偏置 ${fixed(b)} 的 ${activation} 响应曲面，标点为 x = ${fixed(p.x)}、w = ${fixed(p.w)}`}
      >
        <title>神经元响应曲面</title>
        <g className="surface-axes">
          <path d="M57 134 L209 198 L393 158" fill="none" />
          <text x="43" y="141">
            x = −4
          </text>
          <text x="374" y="174">
            x +
          </text>
          <text x="153" y="204">
            w +
          </text>
        </g>
        <g fill="none">{grid}</g>
        <circle cx={current.x} cy={current.y} r="5" fill="#22292e" stroke="white" strokeWidth="2" />
      </svg>
      <figcaption>固定 b = {fixed(b)} · 底面为输入 x 与权重 w，深色点为当前输出。</figcaption>
    </figure>
  );
}
