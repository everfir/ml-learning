const num = (n: number) => n.toFixed(3);
export function History({ values, steps }: { values: number[]; steps: number }) {
  const top = Math.max(1, ...values),
    x = (i: number) => 45 + (i * 307) / Math.max(1, values.length - 1),
    y = (v: number) => 103 - (v / top) * 76;
  const last = values.length - 1;
  return (
    <figure className="bp-history">
      <figcaption>
        整盘平均损失 <strong>{num(values[last])}</strong>
      </figcaption>
      <svg
        viewBox="0 0 380 142"
        role="img"
        aria-label={`横轴为更新步数，纵轴为十二颗平均损失。第 ${steps} 步，损失 ${num(values[last])}`}
      >
        {[0, top / 2, top].map((v) => (
          <g key={v}>
            <line x1="45" x2="352" y1={y(v)} y2={y(v)} stroke="var(--grid)" />
            <text x="38" textAnchor="end" y={y(v) + 4}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <polyline
          points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          fill="none"
          stroke="#246b60"
          strokeWidth="2.8"
        />
        <circle cx={x(last)} cy={y(values[last])} r="4.5" fill="#246b60" />
        <text x="45" y="122" textAnchor="middle">
          {steps - last}
        </text>
        {last > 0 && (
          <text x="352" y="122" textAnchor="middle">
            {steps}
          </text>
        )}
        <text x="200" y="137" textAnchor="middle">
          更新步数
        </text>
      </svg>
    </figure>
  );
}
