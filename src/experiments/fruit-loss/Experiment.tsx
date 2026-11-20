import { BookOpen, Save } from "lucide-react";
import { box, ordered } from "@/shared/data/gift-order";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { useLessonNotebook } from "@/shared/useLessonNotebook";
import { documents } from "./documents";
import { FruitMap, LossCurves } from "./Figures";
import lesson from "./lesson.json";
import { audit, type Draft, inspect, measure, start, training, validDraft } from "./model";
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
  const batch = d.seed === null ? null : audit(d.seed);
  const hits = batch ? measure(d.weight, batch).hits : 0;
  function lock() {
    change({ ...d, seed: crypto.getRandomValues(new Uint32Array(1))[0] });
  }
  return (
    <>
      <p className="loss-task">
        {batch
          ? "网络已锁定。看这批新果分对了几颗，再和训练盘对照。"
          : "先盯住 A 果，把第一路的权重从 0.25 调到 0.40。它还分错着吗？损失呢？"}
      </p>
      <div className="loss-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>{batch ? "新果验收" : "训练盘的分箱图"}</h2>
            {batch ? (
              <strong role="status">
                本批正确率 {hits * 10}%（{hits}
                /10）
              </strong>
            ) : (
              <span>
                分对 {train.hits} / {training.length} 颗
              </span>
            )}
          </div>
          <FruitMap
            weight={d.weight}
            fruit={batch ?? training}
            selected={batch ? undefined : fruit.id}
            onSelect={batch ? undefined : (selected) => change({ ...d, selected })}
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
              disabled={!!batch}
              onChange={(e) => change({ ...d, weight: e.target.valueAsNumber })}
            />
            <div className="loss-ends">
              <span>0 · 忽略「橙色减个头」</span>
              <span>2 · 加倍计分</span>
            </div>
            {!batch && (
              <p className="loss-mobile-readout">
                {fruit.id} 果损失 {result.loss.toFixed(3)} · 整盘平均 {train.mean.toFixed(3)}
              </p>
            )}
            <div className="loss-actions">
              <Button onClick={lock}>{batch ? "再验 10 颗" : "锁定权重，验 10 颗新果"}</Button>
              {batch && (
                <Button variant="outline" onClick={() => change({ ...d, seed: null })}>
                  解锁调参
                </Button>
              )}
              <Guide anchor={batch ? "audit" : "weight"} label={batch ? "验收说明" : "调参说明"} />
            </div>
          </div>
        </section>
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
            <LossCurves weight={d.weight} fruit={fruit} />
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
