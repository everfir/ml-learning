import { BookOpen, Save } from "lucide-react";
import { useState } from "react";
import { box, ordered } from "@/shared/data/gift-order";
import { FruitMap } from "@/shared/fruit/FruitMap";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { useLessonNotebook } from "@/shared/useLessonNotebook";
import { AuditPanel } from "./AuditPanel";
import { documents } from "./documents";
import { LossCurves } from "./Figures";
import lesson from "./lesson.json";
import {
  auditSize,
  type Draft,
  inspect,
  measure,
  referenceWeight,
  start,
  training,
  validDraft,
} from "./model";
import "./style.css";

function Guide({ anchor, label }: { anchor: string; label: string }) {
  return (
    <a className="loss-guide" href={guideHref("workbench", anchor)}>
      <BookOpen size={14} />
      {label}
    </a>
  );
}
const percent = (v: number) => `${(v * 100).toFixed(1)}%`;
function Workbench({ d, change }: { d: Draft; change: (d: Draft) => void }) {
  const fruit = training.find((f) => f.id === d.selected) ?? training[0];
  const result = inspect(d.weight, fruit),
    train = measure(d.weight, training);
  const locked = d.seed !== null;
  const reference = referenceWeight(d);
  const baseline = measure(reference, training).mean;
  const changed = d.weight !== reference;
  const delta = train.mean - baseline;
  const [playSeed, setPlaySeed] = useState<number | null>(null);
  function lock() {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    setPlaySeed(seed);
    change({ ...d, version: 2, reference: d.weight, seed });
  }
  return (
    <>
      <p className="loss-task">
        {locked
          ? "权重已锁定。留意最初几颗的正确率，再看整批验完时的结果。"
          : "店员希望训练盘的平均损失低于 0.30。先任选一个方向试调，再根据损失决定保留还是退回。"}
      </p>
      <div className="loss-columns">
        {d.seed !== null ? (
          <AuditPanel
            key={d.seed}
            seed={d.seed}
            version={d.version}
            weight={d.weight}
            animate={playSeed === d.seed}
            again={lock}
            unlock={() => change({ ...d, seed: null })}
          />
        ) : (
          <section className="panel">
            <div className="panel-heading">
              <h2>训练盘的分箱图</h2>
              <span>
                分对 {train.hits} / {training.length} 颗
              </span>
            </div>
            <FruitMap
              predictsGift={(f) => inspect(d.weight, f).gift}
              fruit={training}
              selected={fruit.id}
              onSelect={(selected) => change({ ...d, selected })}
            />
            <div className="loss-pad loss-controls">
              <label htmlFor="loss-weight">
                第一路的输出权重 <output htmlFor="loss-weight">{d.weight.toFixed(2)}</output>
              </label>
              <input
                id="loss-weight"
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={d.weight}
                onChange={(e) =>
                  change({ ...d, version: 2, reference, weight: e.target.valueAsNumber })
                }
              />
              <div className="loss-ends">
                <span>0 · 忽略「橙色减个头」</span>
                <span>2 · 加倍计分</span>
              </div>
              <div className="loss-compare">
                <span>整盘平均损失 · 目标 &lt; 0.30</span>
                <strong>
                  {baseline.toFixed(3)} → {train.mean.toFixed(3)}
                </strong>
                <p>
                  {!changed
                    ? `当前基准权重 ${reference.toFixed(2)}。拖动滑杆试一个新位置。`
                    : `相比权重 ${reference.toFixed(2)}，平均损失${delta < 0 ? "下降" : "上升"} ${Math.abs(delta).toFixed(4)}。${delta < 0 ? "可以留住这一步，再试附近的位置。" : "可以退回基准，换个方向或缩小步子。"}`}
                </p>
              </div>
              <div className="loss-actions">
                <Button
                  disabled={!changed}
                  onClick={() => change({ ...d, version: 2, reference: d.weight })}
                >
                  保留作新基准
                </Button>
                <Button
                  variant="outline"
                  disabled={!changed}
                  onClick={() => change({ ...d, weight: reference })}
                >
                  退回基准
                </Button>
                <Guide anchor="weight" label="调参说明" />
              </div>
              <div className="loss-submit">
                <span>{train.mean < 0.3 ? "已达到训练目标" : "可随时检验当前权重"}</span>
                <Button variant="outline" onClick={lock}>
                  锁定当前权重，验 {auditSize} 颗
                </Button>
              </div>
            </div>
          </section>
        )}
        <section className="panel">
          <div className="panel-heading">
            <h2>训练盘上的损失</h2>
            <Guide anchor="compare" label="读图" />
          </div>
          <div className="loss-pad">
            <label className="loss-select">
              追踪样果{" "}
              <select value={fruit.id} onChange={(e) => change({ ...d, selected: e.target.value })}>
                {training.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.id} 果 · 个头 {f.size} / 橙色 {f.color}
                  </option>
                ))}
              </select>
            </label>
            <div className="loss-prob">
              <span>
                机器给的礼盒概率 <b>{percent(result.probability)}</b>
              </span>
              <span>
                订单 {box(ordered(fruit))} · {result.correct ? "分对" : "错分"}
              </span>
            </div>
            <div className="loss-meter">
              <i style={{ width: percent(result.probability) }} />
            </div>
            <div className="loss-threshold">50% 进盒线</div>
            <div className="loss-stats">
              <div>
                <small>{fruit.id} 果损失</small>
                <b className="loss-single">{result.loss.toFixed(3)}</b>
              </div>
              <div>
                <small>{training.length} 颗平均损失</small>
                <b className="loss-mean">{train.mean.toFixed(3)}</b>
              </div>
            </div>
            <p className="loss-explain">
              店员要{box(ordered(fruit))}，机器给这个正确箱号的概率是{" "}
              {percent(ordered(fruit) ? result.probability : 1 - result.probability)}。这颗扣{" "}
              {result.loss.toFixed(3)} 分，12 颗的扣分取平均后用来比较权重。{" "}
              <a className="loss-guide" href={guideHref("theory", "loss")}>
                损失怎么算？
              </a>
            </p>
            <details className="loss-reveal">
              <summary>展开完整损失曲线</summary>
              <LossCurves weight={d.weight} fruit={fruit} />
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
export default function Experiment() {
  const { draft, change, runs, ready, saving, save, notice } = useLessonNotebook(start, validDraft);
  return (
    <LabShell
      title={lesson.title}
      code="06"
      topic="机器学习入门"
      description="调一个权重，看同一颗果子的箱号、礼盒概率和损失怎样变化。"
      documents={documents}
      notice={notice}
      recordCount={runs.length}
      action={
        <Button disabled={!ready || saving} onClick={save}>
          <Save />
          保存记录
        </Button>
      }
      workbench={ready ? <Workbench d={draft} change={change} /> : <p>正在读取实验草稿…</p>}
      records={
        <section className="panel">
          <div className="panel-heading">
            <h2>权重与损失记录</h2>
            <span>{runs.length} 条</span>
          </div>
          {runs.length === 0 && (
            <p className="loss-pad">在工作台保存一次，就能回来比较不同权重。</p>
          )}
          {runs.map((r) => (
            <div className="loss-record" key={r.id}>
              <div>
                <strong>
                  权重 {r.draft.weight.toFixed(2)} · 平均损失{" "}
                  {measure(r.draft.weight, training).mean.toFixed(3)}
                </strong>
                <small>
                  {new Date(r.at).toLocaleString("zh-CN")} ·{" "}
                  {r.draft.seed === null ? "训练盘" : "已锁定验收"}
                </small>
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
          ))}
        </section>
      }
    />
  );
}
