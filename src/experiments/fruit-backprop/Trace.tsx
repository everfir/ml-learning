import { box, type Fruit, ordered } from "@/shared/data/gift-order";
import { forward, gradients, type Network } from "./model";

const num = (n: number) => n.toFixed(3);
export function NetworkTrace({ net, previous, f }: { net: Network; previous?: Network; f: Fruit }) {
  const old = previous ?? net,
    before = forward(old, f),
    after = forward(net, f);
  const grad = gradients(old, f);
  return (
    <div className="bp-trace">
      <div className="bp-signals">
        {old.map((b, i) => {
          const active = before.hidden[i] > 0;
          return (
            <section
              key={i === 0 ? "positive" : "negative"}
              className={active ? "bp-lane bp-on" : "bp-lane"}
            >
              <header>
                <b>
                  第{i === 0 ? "一" : "二"}路 · {i === 0 ? "橙色减个头" : "个头减橙色"}
                </b>
                <span>{active ? "有信号" : "ReLU 关闭"}</span>
              </header>
              <div className="bp-path">
                <span>
                  输入差值<b>{before.inputs[i]}</b>
                </span>
                <i>→</i>
                <span>
                  ReLU 输出<b>{Number(before.hidden[i].toFixed(2))}</b>
                </span>
                <i>→</i>
                <span>
                  贡献分<b>{(before.hidden[i] * b.out).toFixed(2)}</b>
                </span>
              </div>
              <div className="bp-return">
                <b>← {previous ? "本步反馈" : "若学这颗"}</b>
                <span>{active ? "损失经输出权重传回输入权重" : "本路两个权重的梯度均为零"}</span>
              </div>
              <div className="bp-weights">
                <span>
                  输入权重{" "}
                  <b>
                    {num(b.gain)}
                    {previous && ` → ${num(net[i].gain)}`}
                  </b>
                </span>
                <span>
                  输出权重{" "}
                  <b>
                    {num(b.out)}
                    {previous && ` → ${num(net[i].out)}`}
                  </b>
                </span>
              </div>
            </section>
          );
        })}
      </div>
      <div className="bp-result">
        <div>
          <small>礼盒概率</small>
          <b>
            {previous && `${(before.p * 100).toFixed(1)}% → `}
            {(after.p * 100).toFixed(1)}%
          </b>
        </div>
        <div>
          <small>这颗的损失</small>
          <b>
            {previous && `${num(before.loss)} → `}
            {num(after.loss)}
          </b>
        </div>
      </div>
      <div
        className="bp-gauge"
        role="img"
        aria-label="礼盒概率条；中线为百分之五十，虚线标出更新前的位置"
      >
        <i style={{ width: `${after.p * 100}%` }} />
        {previous && <b style={{ left: `${before.p * 100}%` }} />}
      </div>
      <small className="bp-gauge-key">中线 50% · 达线进盒{previous ? " · 虚线为更新前" : ""}</small>
      <p className="bp-note">
        订单要{box(ordered(f))}，{previous ? `更新前送${box(before.gift)}，更新后送` : "当前送"}
        {box(after.gift)}。
      </p>
      <details>
        <summary>查看本颗的梯度</summary>
        <p>
          礼盒概率减标签 = {num(before.error)}。按{previous ? "更新前" : "当前"}权重计算：
        </p>
        {grad.map((g, i) => (
          <p key={i === 0 ? "first" : "second"}>
            第{i === 0 ? "一" : "二"}路 · 输出权重梯度 {num(g.out)}，输入权重梯度 {num(g.gain)}。
          </p>
        ))}
      </details>
    </div>
  );
}
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
