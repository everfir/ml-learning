import { BookOpen, Save } from "lucide-react";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { useLessonNotebook } from "@/shared/useLessonNotebook";
import { documents } from "./documents";
import { ActivationPlot, Boundary } from "./Figures";
import lesson from "./lesson.json";
import {
  biasAt,
  contributions,
  crossing,
  type Draft,
  formatScore,
  phases,
  ranking,
  reading,
  sizePercent,
  start,
  tray,
  validDraft,
} from "./model";
import "./style.css";

type Props = { d: Draft; change: (next: Draft) => void };
function Guide({ phase }: { phase: Draft["phase"] }) {
  return (
    <a className="stand-guide" href={guideHref("theory", phase)}>
      <BookOpen size={15} />
      对照讲解
    </a>
  );
}
function Slider({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  change,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  change: (n: number) => void;
}) {
  return (
    <label className="stand-slider">
      <span>{label}</span>
      <output>{display}</output>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={display}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => change(e.target.valueAsNumber)}
      />
    </label>
  );
}
function Pair({ d, change }: Props) {
  const [a, b] = tray.map((f) => contributions(d.weights, f).total);
  function edit(key: "size" | "color", value: number) {
    const weights = { ...d.weights, [key]: value };
    change({ ...d, weights, biasPoints: biasAt(weights, tray[0].orange), orange: tray[0].orange });
  }
  return (
    <div className="stand-columns">
      <section className="panel">
        <div className="panel-heading">
          <h2>A、B 的打分单</h2>
          <span>展台候选 · 模拟测量</span>
        </div>
        <div className="stand-body">
          <div className="stand-legend">
            <span className="stand-size">■ 果径贡献</span>
            <span className="stand-color">■ 颜色贡献</span>
          </div>
          {tray.slice(0, 2).map((f) => {
            const score = contributions(d.weights, f);
            return (
              <div className="stand-slip" key={f.id}>
                <div className="stand-slip-head">
                  <h3>
                    {f.id} 果{" "}
                    <small>
                      {f.diameter} mm · {f.orange}% 橙色
                    </small>
                  </h3>
                  <strong>
                    {formatScore(score.total / 100)} <small>分</small>
                  </strong>
                </div>
                <div className="stand-meter" aria-hidden="true">
                  <i style={{ width: `${score.sizePoints / 2.4}%` }} />
                  <i style={{ width: `${score.colorPoints / 2.4}%` }} />
                </div>
                <p>
                  果径 {formatScore(sizePercent(f.diameter) / 100)} × {formatScore(d.weights.size)}{" "}
                  = <b>{formatScore(score.sizePoints / 100)}</b>　颜色 {formatScore(f.orange / 100)}{" "}
                  × {formatScore(d.weights.color)} = <b>{formatScore(score.colorPoints / 100)}</b>
                </p>
              </div>
            );
          })}
          <div className="stand-result" role="status">
            {a === b
              ? "A、B 并列"
              : `${a > b ? "A" : "B"} 果领先 ${formatScore(Math.abs(a - b) / 100)} 分`}
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>给线索分配权重</h2>
          <Guide phase="weights" />
        </div>
        <div className="stand-body">
          <p>你会先摆哪颗？选一颗，再试着让它领先。</p>
          <div className="stand-actions">
            {(["A", "B"] as const).map((id) => (
              <Button
                key={id}
                size="sm"
                aria-pressed={d.pick === id}
                variant={d.pick === id ? "default" : "outline"}
                onClick={() => change({ ...d, pick: id })}
              >
                先摆 {id} 果
              </Button>
            ))}
          </div>
          <Slider
            label="果径权重"
            value={d.weights.size}
            display={formatScore(d.weights.size)}
            min={0.5}
            max={2}
            step={0.25}
            change={(n) => edit("size", n)}
          />
          <Slider
            label="颜色权重"
            value={d.weights.color}
            display={formatScore(d.weights.color)}
            min={0.5}
            max={2}
            step={0.25}
            change={(n) => edit("color", n)}
          />
          <p>保持果径权重，试着把颜色权重调到与它相等，再往上调一格。</p>
          <Button onClick={() => change({ ...d, phase: "bias" })}>保留权重，挑入选果</Button>
        </div>
      </section>
    </div>
  );
}
function Bias({ d, change }: Props) {
  const list = ranking(d);
  return (
    <div className="stand-columns">
      <section className="panel">
        <div className="panel-heading">
          <h2>五颗果子的入选线</h2>
          <span>线上与浅橙区域入选</span>
        </div>
        <Boundary draft={d} />
        <table className="stand-table">
          <caption>按总分排列的候选盘</caption>
          <thead>
            <tr>
              <th>样果</th>
              <th>加权分</th>
              <th>总分 z</th>
              <th>去向</th>
            </tr>
          </thead>
          <tbody>
            {list.map(({ fruit, z, hard }) => (
              <tr key={fruit.id}>
                <th scope="row">{fruit.id} 果</th>
                <td>{formatScore(contributions(d.weights, fruit).total / 100)}</td>
                <td>{formatScore(z)}</td>
                <td>{hard ? "上展台" : "留在盘中"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>今天展台要挑严一点</h2>
          <Guide phase="bias" />
        </div>
        <div className="stand-body">
          <p>
            果径权重 {formatScore(d.weights.size)}，颜色权重 {formatScore(d.weights.color)}
            。五颗果子共用这套偏好，每颗再加同一个偏置 b。
          </p>
          <div className="stand-result" role="status">
            入选 {list.filter((f) => f.hard).length} / {list.length} 颗
          </div>
          <Slider
            label="偏置 b"
            value={d.biasPoints}
            display={formatScore(d.biasPoints / 100)}
            min={biasAt(d.weights, 95)}
            max={biasAt(d.weights, 5)}
            step={d.weights.color}
            change={(biasPoints) => change({ ...d, biasPoints })}
          />
          <p>
            加权分达到 <strong>{formatScore(-d.biasPoints / 100)}</strong>{" "}
            就入选。把偏置往左调，观察哪颗先退出，以及 A、B 的先后有没有变化。
          </p>
          <div className="stand-actions">
            <Button onClick={() => change({ ...d, phase: "activation" })}>
              固定门槛，观察 A 果
            </Button>
            <Button variant="ghost" onClick={() => change({ ...d, phase: "weights" })}>
              返回调权重
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
function Activations({ d, change }: Props) {
  const cut = crossing(d);
  const f = { ...tray[0], orange: d.orange };
  const r = reading(d, f);
  const { sizePoints, colorPoints } = contributions(d.weights, f);
  return (
    <div className="stand-columns">
      <section className="panel">
        <div className="panel-heading">
          <h2>同一总分，两种响应</h2>
          <span>A 果 · 75 mm</span>
        </div>
        <div className="stand-readouts" aria-live="polite">
          <div className="stand-size">
            ■ 硬门槛<strong>{r.hard}</strong>
          </div>
          <div className="stand-color">
            ● Sigmoid<strong>{r.soft.toFixed(4)}</strong>
          </div>
        </div>
        <ActivationPlot draft={d} />
        <p className="stand-caption">
          虚线标出 A 果当前的 z。方块和圆点分别读出两种函数在这里的高度。
        </p>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>把 A 果移过入选线</h2>
          <Guide phase="activation" />
        </div>
        <div className="stand-body">
          <p>
            保留刚才的权重、偏置和果径。模拟改变同一颗 A 果的橙色面积，达到 {cut}% 时正好在线上。
          </p>
          <Slider
            label="A 果橙色面积"
            min={0}
            max={100}
            value={d.orange}
            display={`${d.orange}%`}
            change={(orange) => change({ ...d, orange })}
          />
          <div className="stand-actions">
            {[
              [-1, "线前"],
              [0, "线上"],
              [1, "线后"],
            ].map(([delta, label]) => {
              const orange = cut + Number(delta);
              return (
                <Button
                  key={label}
                  size="sm"
                  variant="outline"
                  aria-pressed={d.orange === orange}
                  onClick={() => change({ ...d, orange })}
                >
                  {label} · {orange}%
                </Button>
              );
            })}
          </div>
          <div className="stand-equation">
            z = {formatScore(sizePoints / 100)} + {formatScore(colorPoints / 100)} −{" "}
            {formatScore(-d.biasPoints / 100)} = <strong>{formatScore(r.z)}</strong>
          </div>
          <p>
            按硬门槛，A 果{r.hard ? "上展台" : "留在盘中"}。若用 Sigmoid 输出 ≥ 0.5
            作为入选条件，它也会{r.hard ? "上展台" : "留在盘中"}。
          </p>
          <Button variant="outline" onClick={() => change({ ...d, phase: "bias" })}>
            返回调偏置
          </Button>
        </div>
      </section>
    </div>
  );
}
export default function Experiment() {
  const { draft, change, ready, runs, save, saving, notice } = useLessonNotebook(start, validDraft);
  return (
    <LabShell
      title={lesson.title}
      code="05"
      topic="机器学习入门"
      description="让个头与颜色各投一份分。给门店挑展台候选果，再跟着同一颗橘子越过入选线。"
      documents={documents}
      notice={notice}
      recordCount={runs.length}
      action={
        <Button disabled={!ready || saving} onClick={save}>
          <Save />
          {saving ? "保存中" : "保存记录"}
        </Button>
      }
      workbench={
        ready ? (
          <>
            <ol className="stand-stages" aria-label="实验进度">
              {Object.entries(phases).map(([key, name], i) => (
                <li key={key} aria-current={key === draft.phase ? "step" : undefined}>
                  0{i + 1} {name}
                </li>
              ))}
            </ol>
            {draft.phase === "weights" ? (
              <Pair d={draft} change={change} />
            ) : draft.phase === "bias" ? (
              <Bias d={draft} change={change} />
            ) : (
              <Activations d={draft} change={change} />
            )}
          </>
        ) : (
          <p>正在读取实验草稿…</p>
        )
      }
      records={
        <section className="panel">
          <div className="panel-heading">
            <h2>展台挑果记录</h2>
            <span>{runs.length} 条</span>
          </div>
          {runs.length === 0 ? (
            <p className="stand-body">
              {ready
                ? "在工作台保存一条记录，就能回看当时的排名、入选线或过线读数。"
                : "正在读取记录…"}
            </p>
          ) : (
            runs.map((r) => (
              <div key={r.id} className="stand-record">
                <div>
                  <strong>
                    {phases[r.draft.phase]} · 果径权重 {formatScore(r.draft.weights.size)} /
                    颜色权重 {formatScore(r.draft.weights.color)}
                  </strong>
                  <p>
                    {new Date(r.at).toLocaleString("zh-CN")}
                    {r.draft.phase !== "weights" &&
                      ` · b = ${formatScore(r.draft.biasPoints / 100)}`}
                    {r.draft.phase === "activation" && ` · A 果 ${r.draft.orange}% 橙色`}
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
