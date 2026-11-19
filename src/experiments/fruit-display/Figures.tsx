import { sigmoid } from "../../shared/ml/activation.ts";
import { type Draft, hard, reading, tray } from "./model";

const left = 44,
  right = 414,
  top = 26,
  bottom = 203;
const xColor = (c: number) => left + ((right - left) * c) / 100;
const ySize = (d: number) => bottom - ((bottom - top) * (d - 55)) / 25;

export function Boundary({ draft }: { draft: Draft }) {
  // z changes linearly with diameter. Two actual readings give its zero at each end.
  function zeroDiameter(orange: number) {
    const fruit = { id: "line", diameter: 55, orange };
    return 55 - (25 * reading(draft, fruit).z) / draft.weights.size;
  }
  const y0 = ySize(zeroDiameter(0)),
    y1 = ySize(zeroDiameter(100));
  return (
    <svg
      viewBox="0 0 448 248"
      className="stand-figure"
      role="img"
      aria-label="候选盘分箱图，横轴为橙色面积，纵轴为果径。线及上方入选。"
    >
      <title>候选盘上的入选线 z = 0</title>
      <defs>
        <clipPath id="stand-tray">
          <rect x={left} y={top} width={right - left} height={bottom - top} />
        </clipPath>
      </defs>
      <g clipPath="url(#stand-tray)">
        <rect x={left} y={top} width={right - left} height={bottom - top} fill="#f0f3f2" />
        <path d={`M${left} ${y0} L${right} ${y1} V-700 H${left} Z`} fill="#fae7ce" />
        {[0, 25, 50, 75, 100].map((v) => (
          <path key={v} className="stand-grid" d={`M${xColor(v)} ${top} V${bottom}`} />
        ))}
        {[55, 60, 65, 70, 75, 80].map((v) => (
          <path key={v} className="stand-grid" d={`M${left} ${ySize(v)} H${right}`} />
        ))}
        <path d={`M${left} ${y0} L${right} ${y1}`} fill="none" stroke="#513f33" strokeWidth="2" />
      </g>
      {tray.map((f) => (
        <g key={f.id} transform={`translate(${xColor(f.orange)} ${ySize(f.diameter)})`}>
          <circle
            r="5"
            fill={reading(draft, f).hard ? "#a34c1f" : "white"}
            stroke="#6a4836"
            strokeWidth="1.5"
          />
          <text x="8" y="3">
            {f.id}
          </text>
        </g>
      ))}
      <text x="8" y="16">
        果径（mm）
      </text>
      {[55, 60, 65, 70, 75, 80].map((v) => (
        <text key={v} x="37" y={ySize(v) + 4} textAnchor="end">
          {v}
        </text>
      ))}
      {[0, 25, 50, 75, 100].map((v) => (
        <text key={v} x={xColor(v)} y="219" textAnchor="middle">
          {v}
        </text>
      ))}
      <text x="232" y="241" textAnchor="middle">
        果皮橙色面积（%）
      </text>
    </svg>
  );
}

const zx = (z: number) => left + ((z + 3) * (right - left)) / 6;
const ay = (a: number) => bottom - a * (bottom - top);
const curve = Array.from({ length: 121 }, (_, i) => {
  const z = -3 + i / 20;
  return `${zx(z)},${ay(sigmoid(z))}`;
}).join(" ");
export function ActivationPlot({ draft }: { draft: Draft }) {
  const r = reading(draft, { ...tray[0], orange: draft.orange });
  return (
    <svg
      viewBox="0 0 448 248"
      className="stand-figure"
      role="img"
      aria-label={`同一总分 z=${r.z}，硬门槛输出 ${r.hard}，Sigmoid 输出 ${r.soft.toFixed(4)}`}
    >
      <title>硬门槛与 Sigmoid 对同一颗 A 果的响应</title>
      <text x="8" y="16">
        输出
      </text>
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <path className="stand-grid" d={`M${left} ${ay(v)} H${right}`} />
          <text x="37" y={ay(v) + 4} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
        <g key={v}>
          <path className="stand-grid" d={`M${zx(v)} ${top} V${bottom}`} />
          <text x={zx(v)} y="221" textAnchor="middle">
            {v}
          </text>
        </g>
      ))}
      <path
        d={`M${left} ${ay(hard(-3))} H${zx(0)} M${zx(0)} ${ay(hard(0))} H${right}`}
        stroke="#216b66"
        strokeWidth="2.8"
        fill="none"
      />
      <circle cx={zx(0)} cy={ay(0)} r="3.6" stroke="#216b66" fill="white" />
      <circle cx={zx(0)} cy={ay(1)} r="3.6" fill="#216b66" />
      <polyline points={curve} stroke="#ad5021" strokeWidth="2.8" fill="none" />
      <path d={`M${zx(r.z)} ${top} V${bottom}`} stroke="#626867" strokeDasharray="4 3" />
      <rect x={zx(r.z) - 4} y={ay(r.hard) - 4} width="8" height="8" fill="#216b66" stroke="white" />
      <circle cx={zx(r.z)} cy={ay(r.soft)} r="5" fill="#ad5021" stroke="white" />
      <text x="232" y="242" textAnchor="middle">
        加上偏置后的总分 z
      </text>
    </svg>
  );
}
