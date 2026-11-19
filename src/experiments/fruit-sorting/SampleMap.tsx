import { BookOpen, ScatterChart } from "lucide-react";
import { guideHref } from "@/shared/lesson-route";
import { bins, type Fruit, type K, predict, type Sample, training } from "./model";

const x = (orange: number) => 48 + 4.6 * orange;
const y = (diameter: number) => 302 - 9.2 * (diameter - 50);
function Dot({ fruit }: { fruit: Sample }) {
  const px = x(fruit.orange),
    py = y(fruit.diameter);
  return fruit.bin === "fresh" ? (
    <circle cx={px} cy={py} r="5.8" fill="var(--fresh)" />
  ) : (
    <path d={`M${px},${py - 6.8}l6.8,6.8 -6.8,6.8 -6.8,-6.8Z`} fill="var(--juice)" />
  );
}
export function SampleMap({
  fruit,
  k,
  withExtra,
  showVotes,
}: {
  fruit: Fruit;
  k: K;
  withExtra: boolean;
  showVotes: boolean;
}) {
  const data = training(withExtra);
  const result = predict(fruit, k, withExtra);
  return (
    <section className="panel fruit-map">
      <div className="panel-heading">
        <h2>
          <ScatterChart />
          抽检样本分布
        </h2>
        <a href={guideHref("workbench", "map")} className="fruit-read">
          <BookOpen size={15} />
          读图
        </a>
      </div>
      <div className="map-legend">
        <span>
          <i className="fresh-dot" />
          鲜食箱
        </span>
        <span>
          <i className="juice-dot" />
          加工箱
        </span>
        <span>
          <i className="query-dot" />
          待分拣 {fruit.id}
        </span>
      </div>
      <svg
        viewBox="0 0 532 352"
        role="img"
        aria-label={`样本分布图；待分拣 ${fruit.id}，橙色面积 ${fruit.orange}%，果径 ${fruit.diameter} 毫米。下方抽检表列出所有点。`}
      >
        <title>按果皮橙色面积和果径查找相似样本</title>
        <text x="8" y="14">
          果径（mm）
        </text>
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((t) => (
          <g key={t}>
            <line className="fruit-grid" x1={x(t)} x2={x(t)} y1={y(50)} y2={y(80)} />
            {t % 20 === 0 && (
              <text x={x(t)} y="322" textAnchor="middle">
                {t}
              </text>
            )}
          </g>
        ))}
        {[50, 55, 60, 65, 70, 75, 80].map((t) => (
          <g key={t}>
            <line className="fruit-grid" x1={x(0)} x2={x(100)} y1={y(t)} y2={y(t)} />
            <text x="39" y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <text x="278" y="344" textAnchor="middle">
          果皮橙色面积（%）
        </text>
        {showVotes &&
          result.neighbors.map((n) => (
            <g key={n.sample.id}>
              <line
                className="neighbor-line"
                x1={x(fruit.orange)}
                y1={y(fruit.diameter)}
                x2={x(n.sample.orange)}
                y2={y(n.sample.diameter)}
              />
              <circle
                className="neighbor-ring"
                cx={x(n.sample.orange)}
                cy={y(n.sample.diameter)}
                r="10"
              />
            </g>
          ))}
        {data.map((f) => (
          <g key={f.id}>
            <title>{`样本 ${f.id} · ${bins[f.bin]} · ${f.orange}% · ${f.diameter} mm`}</title>
            <Dot fruit={f} />
          </g>
        ))}
        <circle
          cx={x(fruit.orange)}
          cy={y(fruit.diameter)}
          r="6"
          fill="white"
          stroke="#20262a"
          strokeWidth="2.4"
        />
        <circle cx={x(fruit.orange)} cy={y(fruit.diameter)} r="2" fill="#20262a" />
        <text className="fruit-point-label" x={x(fruit.orange) + 12} y={y(fruit.diameter) + 16}>
          {fruit.id}
        </text>
      </svg>
      <details className="sample-details">
        <summary>查看 {data.length} 颗已抽检果的测量值</summary>
        <div className="sample-scroll">
          <table>
            <thead>
              <tr>
                <th>编号</th>
                <th>橙色面积</th>
                <th>果径</th>
                <th>人工标签</th>
              </tr>
            </thead>
            <tbody>
              {data.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.orange}%</td>
                  <td>{f.diameter} mm</td>
                  <td>{bins[f.bin]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
