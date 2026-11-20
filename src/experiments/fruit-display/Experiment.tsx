import { BookOpen, Save } from "lucide-react";
import { useState } from "react";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { useLessonNotebook } from "@/shared/useLessonNotebook";
import { documents } from "./documents";
import { FruitMap, Trace } from "./Figures";
import { LegacyRecords } from "./LegacyRecords";
import lesson from "./lesson.json";
import {
  auditSize,
  batch,
  type Draft,
  examples,
  forward,
  ordered,
  phases,
  start,
  validDraft,
} from "./model";
import "./style.css";

type Props = { d: Draft; change: (d: Draft) => void };
function Slider({
  name,
  n,
  min,
  max,
  edit,
}: {
  name: string;
  n: number;
  min: number;
  max: number;
  edit: (n: number) => void;
}) {
  return (
    <label className="net-slider">
      <span>{name}</span>
      <output>{n}</output>
      <input
        aria-label={name}
        type="range"
        min={min}
        max={max}
        step={1}
        value={n}
        onChange={(e) => edit(e.target.valueAsNumber)}
      />
    </label>
  );
}
function Workbench({ d, change }: Props) {
  const [index, select] = useState(0);
  const audit = d.phase === "audit";
  const fruit = audit ? batch(d.seed, d.version) : examples;
  const selected = Math.min(index, fruit.length - 1),
    f = fruit[selected];
  const correct = fruit.filter((v) => forward(d, v).gift === ordered(v)).length;
  function lock() {
    select(0);
    change({
      version: 3,
      phase: "audit",
      sizeWeight: d.sizeWeight,
      colorWeight: d.colorWeight,
      threshold: d.threshold,
      seed: crypto.getRandomValues(new Uint32Array(1))[0],
    });
  }
  const guide =
    d.phase === "audit"
      ? "audit"
      : d.phase === "single"
        ? "weights"
        : d.phase === "pair"
          ? "bias"
          : "activation";
  return (
    <>
      <ol className="net-stages" aria-label="实验进度">
        {Object.entries(phases).map(([k, v], i) => (
          <li key={k} aria-current={k === d.phase ? "step" : undefined}>
            0{i + 1} {v}
          </li>
        ))}
      </ol>
      <div className="net-mission">
        <strong>装箱任务</strong>
        <span>个头和橙色各按 0–10 分计。两项相差至少 3 分进礼盒，其余散装。</span>
      </div>
      <div className="net-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>{audit ? "新果分布" : "三颗样果的分箱图"}</h2>
            {audit ? (
              <strong className="net-accuracy" role="status">
                本批正确率 {Math.round((correct / fruit.length) * 100)}%{" "}
                <small>
                  （{correct}/{fruit.length}）
                </small>
              </strong>
            ) : (
              <small>
                与订单一致 {correct} / {fruit.length}
              </small>
            )}
          </div>
          <FruitMap d={d} fruit={fruit} selected={selected} select={select} />
          {(d.phase === "single" || d.phase === "relu") && (
            <div className="net-map-sliders">
              <Slider
                name="第一路 · 个头权重"
                min={-2}
                max={2}
                n={d.sizeWeight}
                edit={(sizeWeight) => change({ ...d, sizeWeight })}
              />
              <Slider
                name="第一路 · 橙色权重"
                min={-2}
                max={2}
                n={d.colorWeight}
                edit={(colorWeight) => change({ ...d, colorWeight })}
              />
              <Slider
                name="进礼盒的总分门槛"
                min={-20}
                max={20}
                n={d.threshold}
                edit={(threshold) => change({ ...d, threshold })}
              />
            </div>
          )}
        </section>
        <div className="net-side">
          <section className="panel net-trace-panel">
            <Trace d={d} f={f} />
          </section>
          <section className="panel net-controls">
            <div className="panel-heading">
              <h2>{phases[d.phase]}</h2>
              <a className="net-guide" href={guideHref("workbench", guide)}>
                <BookOpen size={14} />
                对照讲解
              </a>
            </div>
            <div className="net-body">
              {d.phase === "single" && (
                <>
                  <p>
                    <strong>让 A、B 都进礼盒，同时留下 C。</strong>{" "}
                    先交换权重，看浅橙色区域能盖住哪颗果。再拖动门槛，试着同时收下两个圆点。
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      change({ ...d, sizeWeight: d.colorWeight, colorWeight: d.sizeWeight })
                    }
                  >
                    交换两项权重
                  </Button>
                </>
              )}
              {d.phase === "pair" && (
                <>
                  <p>
                    你刚加了一路，沿用同一颗果子的读数，权重与第一路恰好相反。先把两个原始分直接相加。
                  </p>
                  <div className="net-feedback">
                    点 A，再点 B。两路的色条一样长、方向相反，合计停在 0。
                  </div>
                  <p>如果每一路只报告自己找到的正向线索，A 的正分还能留下吗？</p>
                  <Button onClick={() => change({ ...d, phase: "relu" })}>
                    给两路接上「负分记 0」
                  </Button>
                </>
              )}
              {d.phase === "relu" && (
                <>
                  <p>
                    <strong>负分记 0，这道开关叫 ReLU。</strong> 看 A 和 B 各靠哪一路拿分，再检查
                    C。把总分门槛调到符合订单的位置。
                  </p>
                  <p className="net-feedback" role="status">
                    {correct === 3
                      ? "三颗样果全对。差 2 分和差 3 分的新果也能分清吗？"
                      : "还有样果走错。可以用「颜色减个头」对准第一条线索，再检查门槛。"}
                  </p>
                </>
              )}
              {(d.phase === "single" || d.phase === "relu") && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => change({ ...d, sizeWeight: -1, colorWeight: 1 })}
                  >
                    试「颜色减个头」
                  </Button>
                  {d.phase === "single" ? (
                    <>
                      <p>
                        三颗总分依次为 {examples.map((v) => forward(d, v).sum).join("、")}。C
                        的两项读数都正好在 A、B 中间，它的分数也总在中间。
                      </p>
                      <Button onClick={() => change({ ...d, phase: "pair" })}>
                        保留第一路，添一路反向打分
                      </Button>
                    </>
                  ) : (
                    <Button onClick={lock}>锁定网络，验 {auditSize} 颗新果</Button>
                  )}
                </>
              )}
              {audit && (
                <>
                  <p>
                    网络固定在个头权重 {d.sizeWeight}、橙色权重 {d.colorWeight}
                    ，第二路反向，总分门槛为 {d.threshold}。两个中间神经元各自经过 ReLU。
                  </p>

                  <p className="net-feedback">
                    {correct === fruit.length
                      ? "这批新果全部符合订单。"
                      : "点一颗带虚圈的果子，沿信号条找出漏装或误收的原因。"}
                  </p>
                  <Button onClick={lock}>再验 {auditSize} 颗</Button>
                </>
              )}
              {d.phase !== "single" && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    select(0);
                    change({
                      ...d,
                      phase: d.phase === "pair" ? "single" : d.phase === "relu" ? "pair" : "relu",
                    });
                  }}
                >
                  {audit ? "解锁并调参" : "回到上一步"}
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
export default function Experiment() {
  const { draft, change, runs, ready, saving, save, notice } = useLessonNotebook(
    start,
    validDraft,
    { draftKey: "draft:v2", runPrefix: "network:" },
  );
  return (
    <LabShell
      title={lesson.title}
      code="05"
      topic="机器学习入门"
      description="把小而橙、大而青的果子一起选出来。亲手搭一个有两个中间神经元的分拣器，再拿新果验收。"
      documents={documents}
      notice={notice}
      recordCount={runs.length}
      action={
        <Button disabled={!ready || saving} onClick={save}>
          <Save />
          {saving ? "保存中" : "保存记录"}
        </Button>
      }
      workbench={ready ? <Workbench d={draft} change={change} /> : <p>正在读取网络草稿…</p>}
      records={
        <>
          <section className="panel">
            <div className="panel-heading">
              <h2>网络实验记录</h2>
              <span>{runs.length} 条</span>
            </div>
            {runs.length === 0 ? (
              <p className="net-body">
                {ready ? "在工作台保存一次，可以回到当时的网络和验收单。" : "正在读取记录…"}
              </p>
            ) : (
              runs.map((r) => (
                <div key={r.id} className="net-record">
                  <div>
                    <strong>
                      {phases[r.draft.phase]} · 权重 ({r.draft.sizeWeight}, {r.draft.colorWeight}) ·
                      门槛 {r.draft.threshold}
                    </strong>
                    <p>{new Date(r.at).toLocaleString("zh-CN")}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      change(r.draft);
                      location.hash = lessonHref({ section: "workbench" });
                    }}
                  >
                    载入
                  </Button>
                </div>
              ))
            )}
          </section>
          <LegacyRecords />
        </>
      }
    />
  );
}
