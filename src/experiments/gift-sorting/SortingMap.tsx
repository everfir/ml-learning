import { type PointerEvent, useRef } from "react";
import { accepts, type Fruit, height, ordered, type Rule } from "./model";

const x = (orange: number) => 40 + orange * 3.6;
const y = (diameter: number) => 222 - (diameter - 48) * 6;
const line = (cut: number, tilt: number) =>
  `M40 ${y(height(cut, tilt, 0))} L400 ${y(height(cut, tilt, 100))}`;

export function SortingMap({
  rule,
  fruit,
  onChange,
}: {
  rule: Rule;
  fruit: Fruit[];
  onChange?: (rule: Rule) => void;
}) {
  const dragging = useRef<{ key: "first" | "second"; offset: number } | null>(null);
  const { first, second, above, tilt } = rule;
  const other = second ?? (above ? 110 : 20);
  const nonempty = second === null || (above ? second >= first : second <= first);
  function pointerDiameter(event: PointerEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return 48 + (222 - point.y) / 6;
  }
  return (
    <svg
      className="gift-map"
      viewBox="0 0 425 265"
      role="img"
      aria-label="分箱图：横轴为果皮橙色面积，纵轴为果径。浅橙色区域的果子被机器送进礼盒，虚圈标出错分。也可用右侧滑杆调线。"
      onPointerDown={(event) => {
        const key = (event.target as Element).getAttribute("data-handle");
        if (!onChange || (key !== "first" && key !== "second")) return;
        const diameter = pointerDiameter(event);
        const cut = rule[key];
        if (diameter === null || cut === null) return;
        dragging.current = { key, offset: cut - diameter };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        const handle = dragging.current;
        const diameter = pointerDiameter(event);
        if (!onChange || !handle || diameter === null) return;
        const cut = Math.max(50, Math.min(80, Math.round(diameter + handle.offset)));
        if (cut !== rule[handle.key]) onChange({ ...rule, [handle.key]: cut });
      }}
      onLostPointerCapture={() => {
        dragging.current = null;
      }}
      onPointerUp={() => {
        dragging.current = null;
      }}
      onPointerCancel={() => {
        dragging.current = null;
      }}
    >
      <title>礼盒分拣规则和模拟样果</title>
      <defs>
        <clipPath id="gift-area">
          <rect x="40" y={y(82)} width="360" height="204" />
        </clipPath>
      </defs>
      <g clipPath="url(#gift-area)">
        <rect x="40" y={y(82)} width="360" height="204" fill="#f4f6f5" />
        {nonempty && (
          <polygon
            points={[
              [0, first],
              [100, first],
              [100, other],
              [0, other],
            ]
              .map(([orange, cut]) => `${x(orange)},${y(height(cut, tilt, orange))}`)
              .join(" ")}
            fill="#fae7cf"
          />
        )}
        {[0, 25, 50, 75, 100].map((v) => (
          <path key={v} className="gift-grid" d={`M${x(v)} 18V222`} />
        ))}
        {[50, 55, 60, 65, 70, 75, 80].map((v) => (
          <path key={v} className="gift-grid" d={`M40 ${y(v)}H400`} />
        ))}
        <path className="gift-line" d={line(first, tilt)} />
        {second !== null && (
          <path className="gift-line" strokeDasharray="6 4" d={line(second, tilt)} />
        )}
        {fruit.map((f) => (
          <g key={f.id} transform={`translate(${x(f.orange)} ${y(f.diameter)})`}>
            {ordered(f) ? (
              <circle r="5" fill="#a74a13" />
            ) : (
              <path d="M0 -6 6 0 0 6 -6 0Z" fill="#176b67" />
            )}
            {accepts(rule, f) !== ordered(f) && (
              <circle r="10" fill="none" stroke="#382b23" strokeDasharray="2 2" strokeWidth="1.5" />
            )}
            {fruit.length === 3 && (
              <text x="13" y="4" className="gift-point-label">
                {f.diameter} mm
              </text>
            )}
            <title>{`果径 ${f.diameter} mm · 橙色 ${f.orange}%`}</title>
          </g>
        ))}
      </g>
      {onChange &&
        (["first", "second"] as const).map((key) => {
          const cut = rule[key];
          if (cut === null) return null;
          const orange = key === "first" ? 38 : 62;
          return (
            <g key={key} transform={`translate(${x(orange)} ${y(height(cut, tilt, orange))})`}>
              <circle r="7" fill="white" stroke="#39454a" strokeWidth="1.5" />
              <path d="m-2 -2 2 -2 2 2m-4 4 2 2 2 -2" stroke="#39454a" fill="none" />
              <circle data-handle={key} className="gift-handle" r="12" fill="transparent">
                <title>上下拖动筛线</title>
              </circle>
            </g>
          );
        })}
      <text x="10" y="13">
        果径（mm）
      </text>
      {[50, 55, 60, 65, 70, 75, 80].map((v) => (
        <text key={v} x="33" y={y(v) + 4} textAnchor="end">
          {v}
        </text>
      ))}
      {[0, 25, 50, 75, 100].map((v) => (
        <text key={v} x={x(v)} y="239" textAnchor="middle">
          {v}
        </text>
      ))}
      <text x="220" y="259" textAnchor="middle">
        果皮橙色面积（%）
      </text>
    </svg>
  );
}
