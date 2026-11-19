import { type Band, bandHeight, type Fruit, type Node, order, predictLeaf } from "./model";

const x = (c: number) => 42 + c * 3.66;
const y = (d: number) => 226 - (d - 52) * 7;
type Region = { xmin: number; xmax: number; ymin: number; ymax: number };
function Regions({ n, area }: { n: Node; area: Region }) {
  const { xmin, xmax, ymin, ymax } = area;
  if (!n.split)
    return (
      <rect
        x={x(xmin)}
        y={y(ymax)}
        width={x(xmax) - x(xmin)}
        height={y(ymin) - y(ymax)}
        fill={predictLeaf(n) ? "#fae9d5" : "#ebf3ef"}
      />
    );
  const { cut, feature, left, right } = n.split;
  const vertical = feature === "orange";
  return (
    <g>
      <Regions n={left} area={vertical ? { ...area, xmax: cut } : { ...area, ymax: cut }} />
      <Regions n={right} area={vertical ? { ...area, xmin: cut } : { ...area, ymin: cut }} />
      <path
        className="tree-edge"
        d={vertical ? `M${x(cut)} ${y(ymin)}V${y(ymax)}` : `M${x(xmin)} ${y(cut)}H${x(xmax)}`}
      />
    </g>
  );
}
export function Plot({
  fruit,
  tree,
  band,
  selected,
  pick,
}: {
  fruit: Fruit[];
  tree?: Node;
  band?: Band;
  selected?: number;
  pick?: (i: number) => void;
}) {
  return (
    <svg
      className="tree-plot"
      viewBox="0 0 430 270"
      role="img"
      aria-label="横轴为果皮橙色面积，纵轴为果径。圆点是订单礼盒果，菱形是散装果，浅橙底色是机器的礼盒区域。"
      onPointerDown={(e) => {
        const i = (e.target as Element).getAttribute("data-fruit");
        if (i !== null) pick?.(Number(i));
      }}
    >
      <title>分箱区域与订单样本</title>
      <defs>
        <clipPath id="tree-frame">
          <rect x={x(0)} y={y(80)} width={366} height={196} />
        </clipPath>
      </defs>
      <g clipPath="url(#tree-frame)">
        <rect x={x(0)} y={y(80)} width={366} height={196} fill="#ebf3ef" />
        {tree && <Regions n={tree} area={{ xmin: 0, xmax: 100, ymin: 52, ymax: 80 }} />}
        {band && (
          <polygon
            points={[
              [0, -1],
              [100, -1],
              [100, 1],
              [0, 1],
            ]
              .map(([c, sign]) => `${x(c)},${y(bandHeight(band, c) + sign * band.width)}`)
              .join(" ")}
            fill="#fae9d5"
            stroke="#535d61"
            strokeWidth="1.6"
          />
        )}
        {[0, 25, 50, 75, 100].map((c) => (
          <path className="tree-grid" key={c} d={`M${x(c)} ${y(80)}V226`} />
        ))}
        {[55, 60, 65, 70, 75, 80].map((d) => (
          <path className="tree-grid" key={d} d={`M42 ${y(d)}H408`} />
        ))}
        {fruit.map((f, i) => (
          <g key={f.id} transform={`translate(${x(f.orange)} ${y(f.diameter)})`}>
            {order(f) ? (
              <circle r="4.4" fill="#a84a1f" />
            ) : (
              <path d="M0 -5 5 0 0 5 -5 0Z" fill="#246d65" />
            )}
            {selected === i && <circle r="8.5" stroke="#273336" fill="none" strokeWidth="2" />}
            {band && (
              <text x="8" y="-4">
                {f.id}
              </text>
            )}
            {pick && (
              <circle r="8" fill="transparent" data-fruit={i} cursor="pointer">
                <title>查看第 {i + 1} 颗</title>
              </circle>
            )}
          </g>
        ))}
      </g>
      <text x="10" y="18">
        果径（mm）
      </text>
      {[55, 60, 65, 70, 75, 80].map((d) => (
        <text key={d} x="36" y={y(d) + 4} textAnchor="end">
          {d}
        </text>
      ))}
      {[0, 25, 50, 75, 100].map((c) => (
        <text key={c} x={x(c)} y="243" textAnchor="middle">
          {c}
        </text>
      ))}
      <text x="225" y="263" textAnchor="middle">
        果皮橙色面积（%）
      </text>
    </svg>
  );
}
