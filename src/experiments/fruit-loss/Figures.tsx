import { type Fruit, grid, ordered } from "../../shared/data/gift-order";
import { inspect, measure, training, weights } from "./model";

const mapX = (n: number) => 58 + n * 35;
const mapY = (n: number) => 236 - n * 19;
const ticks = [0, 2, 4, 6, 8, 10];
export function FruitMap({
  weight,
  fruit,
  selected,
  onSelect,
}: {
  weight: number;
  fruit: Fruit[];
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <figure className="loss-map">
      <figcaption className="loss-key">
        <span>
          <i />
          机器礼盒区
        </span>
        <span>● 应进礼盒</span>
        <span>◆ 应走散装</span>
        <span>虚圈为错分</span>
      </figcaption>
      <div className="loss-map-frame">
        <svg
          viewBox="0 0 452 278"
          role="img"
          aria-label="个头分为横轴，橙色分为纵轴。每格是一种读数，点的形状表示订单，底色表示机器判断。"
        >
          <title>果子的位置和订单固定，底色随权重变化</title>
          {grid.map((f) => (
            <rect
              key={f.size * 11 + f.color}
              x={mapX(f.size) - 17.5}
              y={mapY(f.color) - 9.5}
              width="35"
              height="19"
              stroke="white"
              strokeWidth=".9"
              fill={inspect(weight, f).gift ? "#fae1bc" : "#e9f1ef"}
            />
          ))}
          <text x="12" y="20">
            橙色（分）
          </text>
          <text x="228" y="274" textAnchor="middle">
            个头（分）
          </text>
          {ticks.map((n) => (
            <g key={n}>
              <text x={mapX(n)} y="259" textAnchor="middle">
                {n}
              </text>
              <text x="33" y={mapY(n) + 4} textAnchor="end">
                {n}
              </text>
            </g>
          ))}
          {fruit.map((f) => (
            <g key={f.id} transform={`translate(${mapX(f.size)} ${mapY(f.color)})`}>
              <title>
                {f.id} 果，个头 {f.size} 分，橙色 {f.color} 分
              </title>
              {!inspect(weight, f).correct && (
                <circle
                  r="11.5"
                  fill="none"
                  stroke="#a43244"
                  strokeWidth="1.6"
                  strokeDasharray="3 2"
                />
              )}
              {ordered(f) ? (
                <circle r="6.4" fill="#9e481a" />
              ) : (
                <path d="M0 -7 7 0 0 7 -7 0Z" fill="#24685d" />
              )}
              {selected === f.id && (
                <>
                  <circle r="15" fill="none" stroke="#202e31" strokeWidth="2" />
                  <text
                    className="loss-active-id"
                    x={f.size >= 9 ? -18 : 18}
                    textAnchor={f.size >= 9 ? "end" : "start"}
                    y="3"
                  >
                    {f.id}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
        {onSelect &&
          fruit.map((f) => (
            <button
              key={f.id}
              type="button"
              className="loss-point-hit"
              style={{
                left: `${(mapX(f.size) / 452) * 100}%`,
                top: `${(mapY(f.color) / 278) * 100}%`,
              }}
              aria-label={`追踪 ${f.id} 果`}
              aria-pressed={selected === f.id}
              onClick={() => onSelect(f.id)}
            />
          ))}
      </div>
    </figure>
  );
}

const chartX = (w: number) => 48 + w * 166;
const chartY = (l: number) => 142 - l * 36;
export function LossCurves({ weight, fruit }: { weight: number; fruit: Fruit }) {
  const points = weights.map((w) => ({
    x: chartX(w),
    single: chartY(inspect(w, fruit).loss),
    mean: chartY(measure(w, training).mean),
  }));
  return (
    <figure className="loss-curves">
      <figcaption>
        <span className="loss-single">━ {fruit.id} 果损失</span>
        <span className="loss-mean">━ 训练盘平均损失</span>
      </figcaption>
      <svg
        viewBox="0 0 410 188"
        role="img"
        aria-label={`横轴是输出权重，纵轴是对数损失。当前权重 ${weight}，${fruit.id} 果损失 ${inspect(weight, fruit).loss.toFixed(3)}，训练盘平均损失 ${measure(weight, training).mean.toFixed(3)}。`}
      >
        <text x="12" y="19">
          损失
        </text>
        {[0, 1, 2, 3].map((n) => (
          <g key={n}>
            <line x1="48" x2="380" y1={chartY(n)} y2={chartY(n)} stroke="var(--grid)" />
            <text x="35" y={chartY(n) + 4} textAnchor="end">
              {n}
            </text>
          </g>
        ))}
        {[0, 0.5, 1, 1.5, 2].map((n) => (
          <text key={n} x={chartX(n)} y="160" textAnchor="middle">
            {n}
          </text>
        ))}
        <text x="214" y="181" textAnchor="middle">
          第一路的输出权重
        </text>
        <line
          x1={chartX(weight)}
          x2={chartX(weight)}
          y1="27"
          y2="142"
          stroke="#757b7e"
          strokeDasharray="3 3"
        />
        {(["single", "mean"] as const).map((key) => (
          <g key={key} className={`loss-${key}`}>
            <polyline
              points={points.map((p) => `${p.x},${p[key]}`).join(" ")}
              stroke="currentColor"
              fill="none"
              strokeWidth="2.5"
            />
            <circle
              cx={chartX(weight)}
              cy={chartY(
                key === "single" ? inspect(weight, fruit).loss : measure(weight, training).mean,
              )}
              r="4.6"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
            />
          </g>
        ))}
      </svg>
    </figure>
  );
}
