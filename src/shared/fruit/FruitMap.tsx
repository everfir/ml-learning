import { type Fruit, grid, ordered } from "../data/gift-order";

const mapX = (n: number) => 58 + n * 35;
const mapY = (n: number) => 236 - n * 19;
const ticks = [0, 2, 4, 6, 8, 10];
export function FruitMap({
  predictsGift,
  fruit,
  selected,
  onSelect,
}: {
  predictsGift: (fruit: Fruit) => boolean;
  fruit: Fruit[];
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <figure className="tray-map">
      <figcaption className="tray-key">
        <span>
          <i />
          机器礼盒区
        </span>
        <span>● 应进礼盒</span>
        <span>◆ 应走散装</span>
        <span>虚圈为错分</span>
      </figcaption>
      <div className="tray-map-frame">
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
              fill={predictsGift(f) ? "#fae1bc" : "#e9f1ef"}
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
              {predictsGift(f) !== ordered(f) && (
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
                    className="tray-active-id"
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
              className="tray-point-hit"
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
