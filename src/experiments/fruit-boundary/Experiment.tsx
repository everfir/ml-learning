import { BookOpen, ChartScatter, Save, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { documents } from "./documents";
import lesson from "./lesson.json";
import { FruitMap } from "./Map";
import {
  adjust,
  batchSize,
  bins,
  type Draft,
  evaluateBatch,
  harvest,
  initial,
  inspect,
  type Line,
  limits,
  measure,
  train,
  training,
} from "./model";
import { useNotebook } from "./useNotebook";
import "./style.css";

function Read({ anchor, children }: { anchor: string; children: string }) {
  return (
    <a className="b-read" href={guideHref("theory", anchor)}>
      <BookOpen size={14} />
      {children}
    </a>
  );
}
function LossPlot({ values }: { values: number[] }) {
  const max = values[0],
    min = values[values.length - 1];
  const points = values.map(
    (v, i) =>
      `${5 + (220 * i) / Math.max(1, values.length - 1)},${6 + (43 * (max - v)) / (max - min || 1)}`,
  );
  return (
    <figure className="b-loss">
      <figcaption>
        每步训练损失{" "}
        <strong>
          {max.toFixed(3)} → {min.toFixed(3)}
        </strong>
      </figcaption>
      <svg
        viewBox="0 0 230 58"
        role="img"
        aria-label={`从第 0 步到第 ${values.length - 1} 步的平均损失`}
      >
        <title>横轴为步数，纵轴为平均损失</title>
        <path d="M5 6V50H225" stroke="#cad2d4" fill="none" />
        <polyline points={points.join(" ")} stroke="#14766e" strokeWidth="2.5" fill="none" />
        <circle cx="5" cy="6" r="3" fill="#14766e" />
      </svg>
      <small>
        第 0 步<span>第 {values.length - 1} 步</span>
      </small>
    </figure>
  );
}
type Props = { draft: Draft; change: (draft: Draft) => void };
function Workbench({ draft, change }: Props) {
  const { human, step, audit } = draft;
  const path = useMemo(() => train(human), [human]);
  const current = path[step ?? 0];
  const previous = step ? path[step - 1] : null;
  const parameter = previous?.line.height !== current.line.height ? "height" : "tilt";
  const stage = audit ? 2 : step === null ? 0 : 1;
  const [running, run] = useState(false);
  const [selected, select] = useState(0);
  const latest = useMemo(() => (audit ? harvest(audit.lastSeed, batchSize) : null), [audit]);
  const fruit = latest?.fruit ?? training;
  const index = selected < fruit.length ? selected : 0;
  const atEnd = step === path.length - 1;
  useEffect(() => {
    if (!running || step === null || stage !== 1) return;
    if (atEnd) {
      run(false);
      return;
    }
    const timer = setTimeout(() => change({ ...draft, step: step + 1 }), 220);
    return () => clearTimeout(timer);
  }, [running, step, stage, atEnd, change, draft]);
  function edit(line: Line) {
    if (line.height !== human.height || line.tilt !== human.tilt) change({ ...draft, human: line });
  }
  function sampleBatch() {
    run(false);
    const seed = latest?.nextSeed ?? crypto.getRandomValues(new Uint32Array(1))[0];
    const next = evaluateBatch(human, current.line, seed, audit);
    change({ ...draft, audit: next });
    select(0);
  }
  const total = (audit?.batches ?? 0) * batchSize;
  const different =
    latest?.fruit.flatMap((f, i) =>
      inspect(human, f).predicted === inspect(current.line, f).predicted ? [] : [i],
    ) ?? [];
  return (
    <div className="boundary-lab">
      <ol className="b-stages" aria-label="实验进度">
        {["手调分箱线", "机器试一步", "锁线验新果"].map((name, i) => (
          <li key={name} aria-current={stage === i ? "step" : undefined}>
            <b>0{i + 1}</b>
            {name}
          </li>
        ))}
      </ol>
      <div className="b-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <ChartScatter />
              {audit ? `第 ${audit.batches} 批新果` : "训练果与分箱线"}
            </h2>
            <span>{fruit.length} 颗 · 模拟抽检</span>
          </div>
          <div className="b-legend">
            <span className="b-fresh">● 鲜食箱</span>
            <span className="b-juice">◆ 加工箱</span>
            <span>虚圈 · 分错</span>
            {step !== null && <span>虚线 · 我的线　实线 · 机器线</span>}
          </div>
          <FruitMap
            line={current.line}
            baseline={stage === 0 ? undefined : human}
            fruit={fruit}
            selected={index}
            select={select}
            edit={stage === 0 ? edit : undefined}
          />
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <SlidersHorizontal />
              {["你来定规则", "机器来调参", "新果验收"][stage]}
            </h2>
            <Read anchor={["line", "loss", "audit"][stage]}>
              {["怎样读线", "怎样扣分", "怎样验收"][stage]}
            </Read>
          </div>
          <div className="b-controls">
            {stage < 2 && (
              <div className="b-stats">
                <div>
                  训练果分错
                  <strong>
                    {training.length - current.hits}
                    <small> / {training.length} 颗</small>
                  </strong>
                </div>
                <div>
                  平均损失<strong>{current.loss.toFixed(3)}</strong>
                </div>
              </div>
            )}
            {stage === 0 && (
              <>
                <p>
                  试着少分错一颗。线上方进鲜食箱，下方进加工箱。上下拖动图中的两个白色把手，也可以用滑杆。
                </p>
                {(["height", "tilt"] as const).map((key) => (
                  <label key={key} className="b-range">
                    {key === "height" ? "中心高度" : "右端相对中心的升降"}{" "}
                    <output>{human[key].toFixed(1)} mm</output>
                    <input
                      type="range"
                      min={limits[key][0]}
                      max={limits[key][1]}
                      step="0.5"
                      value={human[key]}
                      onChange={(e) => edit(adjust(human, key, e.target.valueAsNumber))}
                    />
                  </label>
                ))}
                <div className="b-example">
                  <strong>分错一样多，哪条线更好？</strong>
                  <p>切换这对线，看上面两个数各有什么变化。</p>
                  <div className="b-actions">
                    {[68, 66].map((h, i) => (
                      <Button
                        key={h}
                        size="sm"
                        variant="outline"
                        aria-pressed={human.height === h && human.tilt === 6}
                        onClick={() => edit({ ...initial, height: h })}
                      >
                        试线 {i === 0 ? "A" : "B"}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={() => change({ ...draft, step: 0 })}>定下我的线，交给机器</Button>
              </>
            )}
            {stage === 1 && (
              <>
                <p>
                  机器从你的线出发，分别试着调高、调低和改变倾斜，每次只动一个参数，保留平均损失降得最多的一步。
                </p>
                <div className="b-feedback" aria-live={running ? "off" : "polite"}>
                  <strong>
                    第 {step} 步 ·{" "}
                    {previous
                      ? previous.line.height !== current.line.height
                        ? "调整中心高度"
                        : "调整倾斜"
                      : "从你的线开始"}
                  </strong>
                  <p>
                    {previous
                      ? `参数从 ${previous.line[parameter]} 调到 ${current.line[parameter]} mm，平均损失减少 ${(previous.loss - current.loss).toPrecision(2)}。`
                      : "先点一次「试一步」，观察实线和分错的果子。"}
                  </p>
                </div>
                <div className="b-actions">
                  <Button
                    disabled={atEnd || running}
                    onClick={() => change({ ...draft, step: (step ?? 0) + 1 })}
                  >
                    试一步
                  </Button>
                  <Button variant="outline" disabled={atEnd} onClick={() => run(!running)}>
                    {running ? "暂停调整" : "连续调整"}
                  </Button>
                </div>
                {atEnd && <p role="status">四个方向都没有更低的损失，机器已停下。</p>}
                <LossPlot values={path.slice(0, (step ?? 0) + 1).map((p) => p.loss)} />
                <Button variant="outline" onClick={sampleBatch}>
                  锁定两条线，验 100 颗新果
                </Button>
              </>
            )}
            {audit && latest && (
              <>
                <p>
                  两条线已锁定，共同判断每一颗来货。图上是最新一批，点选果子可以对照预测和抽检答案。
                </p>
                <table className="b-table">
                  <caption>分对的果子与准确率</caption>
                  <thead>
                    <tr>
                      <th>规则</th>
                      <th>本批 / {batchSize}</th>
                      <th>累计 / {total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "我的线", line: human, hits: audit.humanHits },
                      { name: "机器线", line: current.line, hits: audit.machineHits },
                    ].map((r) => (
                      <tr key={r.name}>
                        <th>{r.name}</th>
                        <td>{measure(r.line, latest.fruit).hits} 颗</td>
                        <td>
                          {r.hits} 颗 · {((100 * r.hits) / total).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="b-example">
                  <strong>本批有 {different.length} 颗，两条线意见不同</strong>
                  {different.length > 0 ? (
                    <label>
                      选一颗在图上对照{" "}
                      <select
                        aria-label="查看分歧果"
                        value={different.includes(index) ? index : ""}
                        onChange={(e) => select(Number(e.target.value))}
                      >
                        <option value="" disabled>
                          选择果样
                        </option>
                        {different.map((i) => (
                          <option key={i} value={i}>
                            第 {i + 1} 颗 · 抽检为{bins[fruit[i].bin]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p>这一批的两组预测完全一致。</p>
                  )}
                </div>
                <Button onClick={sampleBatch}>再验 100 颗</Button>
              </>
            )}
            {step !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  run(false);
                  select(0);
                  change({ ...draft, step: null, audit: null });
                }}
              >
                返回手调，开始新一轮
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
export default function Experiment() {
  const { draft, change, ready, save, saving, runs, notice } = useNotebook();
  return (
    <LabShell
      title={lesson.title}
      topic="机器学习入门"
      code="02"
      documents={documents}
      description="给同一条柑橘分拣线调两个参数，再用没见过的新果检验它。"
      notice={notice}
      recordCount={runs.length}
      action={
        <Button disabled={!ready || saving} onClick={save}>
          <Save />
          {saving ? "保存中" : "保存记录"}
        </Button>
      }
      workbench={
        ready ? <Workbench draft={draft} change={change} /> : <p role="status">正在读取实验草稿…</p>
      }
      records={
        <section className="panel">
          <div className="panel-heading">
            <h2>已保存的分箱实验</h2>
            <span>{runs.length} 条</span>
          </div>
          {runs.length === 0 ? (
            <p className="b-record">在工作台点击「保存记录」，可留下当时的分箱线和验收成绩。</p>
          ) : (
            runs.map((r) => (
              <div className="b-record" key={r.id}>
                <div>
                  <strong>
                    {r.draft.audit
                      ? `已验 ${r.draft.audit.batches * batchSize} 颗`
                      : r.draft.step === null
                        ? "手调分箱线"
                        : `机器第 ${r.draft.step} 步`}
                  </strong>
                  <p>
                    {new Date(r.at).toLocaleString("zh-CN")} · 我的线高 {r.draft.human.height}{" "}
                    mm，倾斜 {r.draft.human.tilt} mm
                  </p>
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
      }
    />
  );
}
