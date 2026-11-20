import { useState } from "react";
import { box, type Draft, examples, type Fruit, forward, ordered, orderGap } from "./model";
import { decisionRegions } from "./regions";

const x = (size: number) => 48 + size * 40;
const y = (color: number) => 247 - color * 21;
const ticks = [0, 2, 4, 6, 8, 10];
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

type MapProps = {
  d: Draft;
  fruit: Fruit[];
  selected: number;
  select: (index: number) => void;
  blind: boolean;
};
export function FruitMap({ d, fruit, selected, select, blind }: MapProps) {
  const [reference, showReference] = useState(false);
  const list = blind ? fruit.slice(0, 2) : fruit;
  const f = list[selected] ?? list[0];
  const guess = d.guesses[selected];
  const r = forward(d, f);
  return (
    <figure className="net-map">
      <div className="net-map-key">
        {blind ? (
          <span>先按坐标判断 D、E 的箱号</span>
        ) : (
          <>
            <span>
              <i className="net-swatch" />
              机器礼盒区
            </span>
            <span className="net-gift">● 应进礼盒</span>
            <span className="net-loose">◆ 应走散装</span>
            <span>
              <i className="net-ring" />
              错分
            </span>
          </>
        )}
      </div>
      <div className="net-map-frame">
        <svg
          viewBox="0 0 482 290"
          className="net-space"
          role="img"
          aria-label="果子分布图，横轴个头分，纵轴橙色分，选择果子可追踪"
        >
          <rect x={x(0)} y={y(10)} width="400" height="210" fill={blind ? "#f6f7f7" : "#edf3f1"} />
          {!blind &&
            decisionRegions(d).map((poly) => {
              if (!poly.length) return null;
              const pts = poly.map((p) => `${x(p.size)},${y(p.color)}`).join(" ");
              return poly.length === 1 ? (
                <circle key={pts} cx={x(poly[0].size)} cy={y(poly[0].color)} r="2" fill="#a95a29" />
              ) : (
                <polygon key={pts} points={pts} fill="#fae1bc" stroke="#aa632f" strokeWidth="1.6" />
              );
            })}
          {ticks.map((t) => (
            <g key={t}>
              <path
                className="net-grid"
                d={`M${x(t)} ${y(10)}V${y(0)} M${x(0)} ${y(t)}H${x(10)}`}
              />
              <text x={x(t)} y="264" textAnchor="middle">
                {t}
              </text>
              <text x="36" y={y(t) + 4} textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {!blind && reference && (
            <path
              className="net-reference"
              d={`M${x(0)} ${y(orderGap)}L${x(10 - orderGap)} ${y(10)} M${x(orderGap)} ${y(0)}L${x(10)} ${y(10 - orderGap)}`}
            />
          )}
          {d.phase !== "audit" && (
            <line
              className="net-midline"
              x1={x(examples[0].size)}
              y1={y(examples[0].color)}
              x2={x(examples[1].size)}
              y2={y(examples[1].color)}
            />
          )}
          <text x="10" y="18">
            橙色（分）
          </text>
          <text x="248" y="284" textAnchor="middle">
            个头（分）
          </text>
          {list.map((p) => {
            const chosen = p.id === f.id,
              correct = ordered(p) === forward(d, p).gift;
            return (
              <g
                key={p.id}
                className="net-point"
                transform={`translate(${x(p.size)} ${y(p.color)})`}
              >
                <title>{`${p.id} 果（${p.size}，${p.color}）`}</title>
                <circle r="16" fill="transparent" />
                {chosen && <circle className="net-selected" r="14" />}
                {!blind && !correct && <circle className="net-error-ring" r="18" />}
                {blind || ordered(p) ? (
                  <circle r="10" fill={blind ? "#485c65" : "#9e481a"} />
                ) : (
                  <path d="M0 -13 13 0 0 13 -13 0Z" fill="#22675e" />
                )}
                <text className="net-letter" textAnchor="middle" y="4">
                  {p.id}
                </text>
              </g>
            );
          })}
        </svg>
        {list.map((p, i) => (
          <button
            type="button"
            key={p.id}
            className="net-point-hit"
            style={{ left: `${(x(p.size) / 482) * 100}%`, top: `${(y(p.color) / 290) * 100}%` }}
            aria-label={`追踪 ${p.id} 果，个头 ${p.size}，橙色 ${p.color}`}
            title={`${p.id} 果 · 个头 ${p.size} / 橙色 ${p.color}`}
            aria-pressed={p.id === f.id}
            onClick={() => select(i)}
          />
        ))}
      </div>
      {!blind && (
        <div className="net-map-note">
          <label>
            <input
              type="checkbox"
              checked={reference}
              onChange={(e) => showReference(e.target.checked)}
            />{" "}
            叠加订单边界（虚线）
          </label>
        </div>
      )}
      <figcaption className="net-reading">
        <strong>{f.id} 果</strong>
        <span>
          个头 {f.size} · 橙色 {f.color}
        </span>
        {!blind && (
          <>
            <span>订单：{box(ordered(f))}</span>
            <b className={r.gift === ordered(f) ? "" : "net-miss"}>
              机器：{box(r.gift)} {r.gift === ordered(f) ? "✓" : "×"}
            </b>
            {d.phase === "audit" && typeof guess === "boolean" && <span>你猜：{box(guess)}</span>}
          </>
        )}
      </figcaption>
    </figure>
  );
}
export function Trace({ d, f }: { d: Draft; f: Fruit }) {
  const r = forward(d, f),
    paired = d.phase !== "single",
    active = d.phase === "relu" || d.phase === "audit";
  const rows = [
    { name: "第一路", raw: r.raw1, out: r.first, color: "#24756a" },
    ...(paired ? [{ name: "第二路", raw: r.raw2, out: r.second, color: "#ac572a" }] : []),
    { name: "合计", raw: r.sum, out: r.sum, color: "#303f46" },
  ];
  const extent = Math.max(8, Math.abs(r.raw1), Math.abs(d.threshold));
  const px = (v: number) => 243 + (v * 125) / extent;
  const end = 32 + (rows.length - 1) * 29;
  return (
    <figure className="net-trace">
      <figcaption>
        <strong>{f.id} 果的信号</strong>
        <span>负分向左，正分向右</span>
      </figcaption>
      <svg
        className="net-signal"
        viewBox={`0 0 482 ${end + 38}`}
        role="img"
        aria-label={`${f.id} 果：第一路 ${r.first}${paired ? `，第二路 ${r.second}` : ""}，合计 ${r.sum}，门槛 ${d.threshold}，${box(r.gift)}`}
      >
        <text x={px(0)} y="15" textAnchor="middle">
          0
        </text>
        <line x1={px(0)} x2={px(0)} y1="20" y2={end + 10} stroke="#798685" />
        {rows.map((row, i) => {
          const cy = 32 + i * 29;
          return (
            <g key={row.name}>
              <text x="17" y={cy + 4}>
                {row.name}
              </text>
              <line x1={px(-extent)} x2={px(extent)} y1={cy} y2={cy} stroke="#d8dfde" />
              {active && row.raw < 0 && row.raw !== row.out && (
                <rect
                  x={px(row.raw)}
                  y={cy - 5}
                  width={px(0) - px(row.raw)}
                  height="10"
                  className="net-ghost"
                />
              )}
              {row.out !== 0 ? (
                <rect
                  x={px(Math.min(0, row.out))}
                  y={cy - 5}
                  width={Math.abs(px(row.out) - px(0))}
                  height="10"
                  rx="2"
                  fill={row.color}
                />
              ) : (
                <circle cx={px(0)} cy={cy} r="4" fill={row.color} />
              )}
              <text x="465" y={cy + 4} textAnchor="end">
                {row.raw === row.out ? signed(row.out) : `${signed(row.raw)} → 0`}
              </text>
            </g>
          );
        })}
        <line
          x1={px(d.threshold)}
          x2={px(d.threshold)}
          y1={end - 10}
          y2={end + 12}
          stroke="#9b4319"
          strokeWidth="2"
        />
        <text x={px(d.threshold)} y={end + 27} textAnchor="middle">
          门槛 {d.threshold}
        </text>
      </svg>
      <div className="net-trace-foot">
        <strong>
          {r.sum} 分 → {box(r.gift)}
        </strong>
        <details>
          <summary>查看算式</summary>
          <p>
            第一路：{f.size} × ({d.sizeWeight}) + {f.color} × ({d.colorWeight}) = {r.raw1}。
            {paired && `第二路将权重反向，得到 ${r.raw2}。`}
            {active && `ReLU 后两路为 ${r.first} 和 ${r.second}。`}
          </p>
        </details>
      </div>
    </figure>
  );
}
