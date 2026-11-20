import type { Fruit } from "../../shared/data/gift-order";
import { inspect, measure, training, weights } from "./model";

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
