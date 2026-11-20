import { Pause, Play } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { box, type Fruit, ordered } from "@/shared/data/gift-order";
import { guideHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { forward, gradients, type Network } from "./model";

const titles = [
  "读入果子，算两种差值",
  "乘输入权重，经过 ReLU",
  "合并贡献，决定箱号",
  "从损失回到输出权重",
  "穿过 ReLU，回到输入权重",
  "对照更新前后",
];
const nextLabels = [
  "计算隐藏层",
  "计算输出与损失",
  "反向传播：看输出梯度",
  "反向传播：看输入梯度",
  "应用梯度，更新权重",
  "再学一次",
];
const num = (n: number) => String(Number(n.toFixed(3)));
const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
const weightLink = "https://everfir.github.io/ml-learning/fruit-display/#/introduction/shift";

function Node({
  x,
  y,
  w = 160,
  name,
  value,
  lit = false,
}: {
  x: number;
  y: number;
  w?: number;
  name: string;
  value: string;
  lit?: boolean;
}) {
  return (
    <g className={lit ? "bp-node bp-lit" : "bp-node"} transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y="-18" width={w} height="36" rx="8" />
      <text textAnchor="middle" y="-3">
        {name}
      </text>
      <text className="bp-node-value" textAnchor="middle" y="12">
        {value}
      </text>
    </g>
  );
}

export function NetworkDiagram({
  net,
  previous,
  f,
  blocked,
  onApply,
  rate,
}: {
  net: Network;
  previous?: Network;
  f: Fruit;
  blocked: boolean;
  onApply: () => void;
  rate: number;
}) {
  const [stage, setStage] = useState(previous ? 5 : 0);
  const [replay, setReplay] = useState(!!previous);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || blocked) return;
    const timer = window.setTimeout(() => {
      if (stage === 4) {
        setPlaying(false);
        onApply();
      } else {
        setStage(stage + 1);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [playing, blocked, stage, onApply]);

  function togglePlayback() {
    if (!playing && replay) {
      setReplay(false);
      setStage(0);
    }
    setPlaying(!playing);
  }

  const old = replay && previous ? previous : net;
  const r = forward(old, f),
    after = forward(net, f),
    g = gradients(old, f);
  const display = stage === 5 ? after : r;
  const backward = stage === 3 || stage === 4;
  const color = backward ? "#9a4924" : "#23675d";
  const id = useId();
  function edge(x1: number, y1: number, x2: number, y2: number, lit: boolean, reverse = false) {
    const stroke = lit ? color : "#b3bfbc";
    return (
      <line
        x1={reverse ? x2 : x1}
        y1={reverse ? y2 : y1}
        x2={reverse ? x1 : x2}
        y2={reverse ? y1 : y2}
        stroke={stroke}
        strokeWidth={lit ? 2.5 : 1.4}
        markerEnd={`url(#${id}-${lit ? "on" : "off"})`}
      />
    );
  }
  const target = Number(ordered(f));
  const explanations = [
    `将橙色 ${f.color} 和个头 ${f.size} 输入两路减法器，得到 ${num(r.inputs[0])} 和 ${num(r.inputs[1])}。`,
    `差值先乘线上的输入权重。ReLU 保留正数、把其余归零，两路留下 ${num(r.hidden[0])} 和 ${num(r.hidden[1])}。`,
    `两路贡献相加再减 3，得分 ${num(r.score)}。Sigmoid 给出 ${pct(r.p)} 的礼盒概率，机器送${box(r.gift)}。订单要${box(!!target)}，损失为 ${num(r.loss)}。`,
    `标签为 ${target}。损失对总分的导数是礼盒概率减标签，等于 ${num(r.error)}。把它乘各路的隐藏输出，两根输出线的梯度分别是 ${num(g[0].out)} 和 ${num(g[1].out)}。`,
    `反馈先乘更新前的输出权重，再经过 ReLU。开着的一路再乘输入差值，得到输入权重梯度。两路分别为 ${num(g[0].gain)} 和 ${num(g[1].gain)}。`,
    `图上已按新权重重算。礼盒概率 ${pct(r.p)} → ${pct(after.p)}，损失 ${num(r.loss)} → ${num(after.loss)}。更新后送${box(after.gift)}。`,
  ];
  function next() {
    if (stage === 5) {
      setReplay(false);
      setStage(0);
      return;
    }
    if (stage === 4 && !replay) {
      onApply();
      return;
    }
    setStage(stage + 1);
  }
  return (
    <div className="bp-trace">
      <div className="bp-step" aria-live="polite">
        <span>
          {stage < 3 ? "前向" : backward ? "反向" : "更新"} · {stage + 1}/6
        </span>
        <strong>{titles[stage]}</strong>
      </div>
      <svg
        className="bp-network"
        viewBox="0 0 416 372"
        role="img"
        aria-label={`${f.id} 果计算网络。${titles[stage]}。${explanations[stage]}`}
      >
        <defs>
          {["on", "off"].map((s) => (
            <marker
              id={`${id}-${s}`}
              key={s}
              markerWidth="5"
              markerHeight="5"
              refX="4.6"
              refY="2.5"
              orient="auto"
            >
              <path d="M0 0 5 2.5 0 5Z" fill={s === "on" ? color : "#b3bfbc"} />
            </marker>
          ))}
        </defs>
        <Node
          x={208}
          y={23}
          w={175}
          name={`${f.id} 果 · 两项输入`}
          value={`个头 ${f.size}　橙色 ${f.color}`}
          lit={stage === 0}
        />
        {old.map((b, i) => {
          const x = i === 0 ? 103 : 313,
            active = display.hidden[i] > 0;
          const applied = stage === 5 ? net[i] : b;
          const inputLabel =
            stage === 4
              ? `梯度 ${num(g[i].gain)}`
              : stage === 5
                ? `${num(b.gain)} → ${num(net[i].gain)}`
                : `× ${num(b.gain)}`;
          const outLabel = backward
            ? `梯度 ${num(g[i].out)}`
            : stage === 5
              ? `${num(b.out)} → ${num(net[i].out)}`
              : `× ${num(b.out)}`;
          return (
            <g key={x}>
              {edge(208, 41, x, 65, stage === 0)}
              <Node
                x={x}
                y={84}
                name={i === 0 ? "橙色 − 个头" : "个头 − 橙色"}
                value={num(r.inputs[i])}
                lit={stage === 0}
              />
              {edge(x - 66, 102, x - 66, 145, stage === 1 || (stage === 4 && active), backward)}
              <text x={x - 53} y="120">
                输入权重
              </text>
              <text className="bp-weight" x={x - 53} y="138">
                {inputLabel}
              </text>
              <Node
                x={x}
                y={164}
                name={stage === 0 ? "ReLU" : `ReLU · ${active ? "开启" : "关闭"}`}
                value={
                  stage === 4
                    ? `反馈 ${num(r.error * b.out)} → ${num(active ? r.error * b.out : 0)}`
                    : stage === 0
                      ? "待计算"
                      : `${num(display.inputs[i] * applied.gain)} → ${num(display.hidden[i])}`
                }
                lit={stage === 1 || (backward && active)}
              />
              {edge(x - 66, 182, x - 66, 225, stage === 2 || stage === 3, backward)}
              <text x={x - 53} y="201">
                输出权重
              </text>
              <text className="bp-weight" x={x - 53} y="218">
                {outLabel}
              </text>
              <Node
                x={x}
                y={244}
                name={`第${i === 0 ? "一" : "二"}路贡献`}
                value={stage < 2 ? "待计算" : num(display.hidden[i] * applied.out)}
                lit={stage >= 2 && active}
              />
              {edge(x, 262, 208 + (i === 0 ? -30 : 30), 280, stage === 2 || backward, backward)}
            </g>
          );
        })}
        <Node
          x={208}
          y={299}
          w={242}
          name="两路相加 − 3 → Sigmoid"
          value={stage < 2 ? "待计算" : `总分 ${num(display.score)}　礼盒 ${pct(display.p)}`}
          lit={stage === 2 || backward}
        />
        {edge(208, 317, 208, 331, stage === 2 || backward, backward)}
        <Node
          x={208}
          y={350}
          w={290}
          name={`订单：${box(!!target)}（标签 ${target}）`}
          value={
            stage < 2
              ? "等待预测"
              : backward
                ? `损失 ${num(r.loss)}　反馈 p − y = ${num(r.error)}`
                : `预测：${box(display.gift)}　损失 ${num(display.loss)}`
          }
          lit={stage >= 2}
        />
      </svg>
      <p className="bp-caption">
        {explanations[stage]}
        {stage === 4 && !replay && ` 点击更新，将各权重减去 ${rate} × 对应梯度。`}
      </p>
      <div className="bp-nav">
        <Button
          variant="outline"
          disabled={!stage || blocked || playing}
          onClick={() => setStage(stage - 1)}
        >
          上一步
        </Button>
        <Button disabled={blocked || playing} onClick={next}>
          {stage === 4 && replay ? "重看更新结果" : nextLabels[stage]}
        </Button>
        <Button variant="outline" disabled={blocked} onClick={togglePlayback}>
          {playing ? <Pause /> : <Play />}
          {playing ? "暂停连续学习" : "连续学这颗"}
        </Button>
      </div>
      <div className="bp-concepts">
        <a href={weightLink} target="_blank" rel="noreferrer">
          权重 · 第五课 ↗
        </a>
        <a href={guideHref("theory", "backward")}>梯度 · 本课定义</a>
      </div>
    </div>
  );
}
