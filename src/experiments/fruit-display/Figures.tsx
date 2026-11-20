import { box, type Draft, type Fruit, forward } from "./model";

function questionLine(sw: number, cw: number, f: Fruit) {
  return `个头 ${f.size} × (${sw}) ＋ 橙色 ${f.color} × (${cw})`;
}
export function Trace({ d, f }: { d: Draft; f: Fruit }) {
  const r = forward(d, f),
    paired = d.phase !== "single",
    activated = d.phase === "relu" || d.phase === "audit";
  return (
    <figure className="net-trace">
      <figcaption>{f.id} 果的计算路径</figcaption>
      <div className="net-input">
        输入 <strong>个头 {f.size} 分</strong>
        <strong>橙色 {f.color} 分</strong>
      </div>
      <div className={paired ? "net-paths paired" : "net-paths"}>
        <div className="net-path">
          <small>↓ 第一路</small>
          <p>{questionLine(d.sizeWeight, d.colorWeight, f)}</p>
          <strong>原始分 {r.raw1}</strong>
          {activated && <p className="net-activation">ReLU → {r.first}</p>}
        </div>
        {paired && (
          <div className="net-path">
            <small>↓ 第二路</small>
            <p>{questionLine(-d.sizeWeight, -d.colorWeight, f)}</p>
            <strong>原始分 {r.raw2}</strong>
            {activated && <p className="net-activation">ReLU → {r.second}</p>}
          </div>
        )}
      </div>
      <div className="net-output">
        <small>↓ 输出判断</small>
        <b>{paired ? `${r.first} + (${r.second}) = ${r.sum}` : `得分 ${r.sum}`}</b>
        <span>
          {r.sum >= d.threshold ? "达到" : "低于"}门槛 {d.threshold} → {box(r.gift)}
        </span>
      </div>
    </figure>
  );
}
