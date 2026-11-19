import { type PointerEvent, useRef } from "react";
import { adjust, bins, boundary, type Fruit, inspect, type Line } from "./model";

const x = (c: number) => 50 + c * 5.1;
const y = (d: number) => 297 - (d - 50) * 8.6;
function segment(line: Line) {
  return `M ${x(0)} ${y(boundary(line, 0))} L ${x(100)} ${y(boundary(line, 100))}`;
}
type Props = {
  line: Line;
  baseline?: Line;
  fruit: Fruit[];
  selected: number;
  select: (index: number) => void;
  edit?: (line: Line) => void;
};
export function FruitMap({ line, baseline, fruit, selected, select, edit }: Props) {
  const drag = useRef<keyof Line | null>(null);
  function point(event: PointerEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix || !drag.current || !edit) return;
    const { y: py } = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const d = 50 + (297 - py) / 8.6;
    edit(adjust(line, drag.current, drag.current === "height" ? d : (d - line.height) / 0.8));
  }
  const sample = fruit[selected];
  const reading = inspect(line, sample);
  return (
    <>
      <svg
        className="boundary-map"
        viewBox="0 0 600 345"
        role="img"
        aria-label="分箱图。横轴是果皮橙色占比，纵轴是果径。可用图下选框查看每颗果，手调阶段也可用滑杆移动分箱线。"
        onPointerDown={(event) => {
          const el = event.target as SVGElement;
          const grip = el.getAttribute("data-grip");
          if (edit && (grip === "height" || grip === "tilt")) {
            drag.current = grip;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
          }
          const i = el.getAttribute("data-index");
          if (i !== null) select(Number(i));
        }}
        onPointerMove={point}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <title>柑橘分箱线与逐果抽检标签</title>
        <defs>
          <clipPath id="fruit-plot">
            <rect x={x(0)} y={y(80)} width="510" height="258" />
          </clipPath>
        </defs>
        <g clipPath="url(#fruit-plot)">
          <rect x={x(0)} y={y(80)} width="510" height="258" fill="#edf6f4" />
          <path d={`${segment(line)} L ${x(100)} 0 L ${x(0)} 0 Z`} fill="#fdf1e5" />
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <path key={v} className="b-grid" d={`M${x(v)} 39V297`} />
          ))}
          {[50, 55, 60, 65, 70, 75, 80].map((v) => (
            <path key={v} className="b-grid" d={`M50 ${y(v)}H560`} />
          ))}
          {baseline && (
            <path
              d={segment(baseline)}
              fill="none"
              stroke="#727984"
              strokeWidth="2.4"
              strokeDasharray="6 4"
            />
          )}
          <path d={segment(line)} fill="none" stroke="#293444" strokeWidth="3" />
          {fruit.map((f, i) => (
            <g
              key={`${f.orange}-${f.diameter}`}
              transform={`translate(${x(f.orange)} ${y(f.diameter)})`}
            >
              {inspect(line, f).predicted !== f.bin && <circle r="7" className="b-error" />}
              {f.bin === "fresh" ? (
                <circle r="4.6" fill="#be5a20" />
              ) : (
                <path d="M0 -5.5L5.5 0 0 5.5 -5.5 0Z" fill="#14766e" />
              )}
              <circle r="8" data-index={i} fill="transparent" className="b-pick">
                <title>{`第 ${i + 1} 颗 · ${bins[f.bin]}`}</title>
              </circle>
            </g>
          ))}
          <circle
            cx={x(sample.orange)}
            cy={y(sample.diameter)}
            r="10"
            fill="none"
            stroke="#192531"
            strokeWidth="2"
            pointerEvents="none"
          />
        </g>
        <text x="13" y="21">
          果径（mm）
        </text>
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <text key={v} x={x(v)} y="316" textAnchor="middle">
            {v}
          </text>
        ))}
        {[50, 55, 60, 65, 70, 75, 80].map((v) => (
          <text key={v} x="42" y={y(v) + 4} textAnchor="end">
            {v}
          </text>
        ))}
        <text x="305" y="338" textAnchor="middle">
          果皮橙色面积（%）
        </text>
        {edit &&
          (["height", "tilt"] as const).map((key, i) => {
            const c = i === 0 ? 50 : 90;
            return (
              <g key={key} transform={`translate(${x(c)} ${y(boundary(line, c))})`}>
                <circle r="9" fill="#fff" stroke="#263747" strokeWidth="2.4" />
                <path
                  d="M-3 -2L0 -5 3 -2M-3 2L0 5 3 2"
                  fill="none"
                  stroke="#263747"
                  strokeWidth="1.4"
                />
                <circle r="16" data-grip={key} className="b-grip" fill="transparent">
                  <title>{i === 0 ? "上下拖动中心把手" : "上下拖动倾斜把手"}</title>
                </circle>
              </g>
            );
          })}
      </svg>
      <div className="b-inspector">
        <label>
          逐果查看{" "}
          <select
            aria-label="选择查看的果子"
            value={selected}
            onChange={(e) => select(Number(e.target.value))}
          >
            {fruit.map((f, i) => (
              <option key={`${f.orange}-${f.diameter}`} value={i}>
                第 {i + 1} 颗
              </option>
            ))}
          </select>
        </label>
        <p>
          {sample.orange.toFixed(1)}% 橙色 · {sample.diameter.toFixed(1)} mm · 抽检为
          <strong>{bins[sample.bin]}</strong>
        </p>
        <p>
          {baseline ? `我的线判为${bins[inspect(baseline, sample).predicted]}，机器线` : "当前线"}
          判为{bins[reading.predicted]}。鲜食分数 {reading.freshWeight.toFixed(2)}，这颗扣{" "}
          {reading.loss.toFixed(2)} 分。
        </p>
      </div>
    </>
  );
}
