import { BookOpen, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ordered } from "@/shared/data/gift-order";
import { drawAudit, training } from "@/shared/data/training-tray";
import { FruitMap } from "@/shared/fruit/FruitMap";
import { TrayAudit } from "@/shared/fruit/TrayAudit";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { useLessonNotebook } from "@/shared/useLessonNotebook";
import { documents } from "./documents";
import lesson from "./lesson.json";
import { type Draft, forward, learn, rates, start, validDraft } from "./model";
import { NetworkDiagram } from "./NetworkDiagram";
import { History } from "./Trace";
import "./style.css";

function Guide({ id, text }: { id: string; text: string }) {
  return (
    <a className="bp-guide" href={guideHref("workbench", id)}>
      <BookOpen size={14} />
      {text}
    </a>
  );
}
function Workbench({ d, change }: { d: Draft; change: (next: Draft) => void }) {
  const [end, setEnd] = useState<number | null>(null);
  const [animate, setAnimate] = useState<number | null>(null);
  const [restart, setRestart] = useState(0);
  function reset() {
    setEnd(null);
    setAnimate(null);
    setRestart((n) => n + 1);
    change(start());
  }
  const running = end !== null && d.traySteps < end && d.seed === null;
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => change(learn(d, true)), 550);
    return () => window.clearTimeout(timer);
  }, [d, change, running]);
  const f = training.find((f) => f.id === d.selected) ?? training[0];
  const previous = d.prior?.id === f.id ? d.prior.net : undefined;
  const batch = useMemo(() => (d.seed === null ? null : drawAudit(d.seed)), [d.seed]);
  const hits = training.filter((f) => forward(d.net, f).gift === ordered(f)).length;
  function lock() {
    setEnd(null);
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    setAnimate(seed);
    change({ ...d, seed });
  }
  const slot = d.traySteps % training.length;
  return (
    <>
      <p className="bp-task">
        {d.seed !== null
          ? "网络已锁定。观察同一组权重在新果上的表现。"
          : d.steps === 0
            ? "A 应进礼盒，却被送去散装。从两项输入沿箭头往下算，再沿原路往回看店员的反馈。"
            : d.steps === 1 && d.selected === "A"
              ? "对照两路权重，再选 B 走一次计算图：这回反馈会走哪条路？"
              : "对照刚学的这颗与整盘损失。可以暂停轮训，沿两路查看这一步的更新。"}
      </p>
      <div className="bp-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>一次更新怎样传回去</h2>
            <Guide id="trace" text="读信号图" />
          </div>
          <div className="bp-controls">
            <label>
              追踪{" "}
              <select
                aria-label="追踪训练果"
                value={f.id}
                disabled={running || !!batch}
                onChange={(e) => change({ ...d, selected: e.target.value })}
              >
                {training.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} 果 · 个头 {v.size} / 橙色 {v.color}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" onClick={reset}>
              重新开始训练
            </Button>
          </div>
          <NetworkDiagram
            key={`${restart}-${f.id}-${d.steps}`}
            net={d.net}
            previous={previous}
            f={f}
            rate={d.rate}
            blocked={running || !!batch}
            onApply={() => change(learn(d, false))}
          />
        </section>
        <div className="bp-side">
          {batch ? (
            <TrayAudit
              key={d.seed}
              fruit={batch}
              predictsGift={(f) => forward(d.net, f).gift}
              heading="新果验收"
              summary={`锁定于第 ${d.steps} 步`}
              animate={animate === d.seed}
              again={lock}
              unlock={() => change({ ...d, seed: null })}
            />
          ) : (
            <section className="panel">
              <div className="panel-heading">
                <h2>训练盘的分箱图</h2>
                <span>分对 {hits} / 12</span>
              </div>
              <FruitMap
                fruit={training}
                selected={f.id}
                predictsGift={(v) => forward(d.net, v).gift}
                onSelect={running ? undefined : (selected) => change({ ...d, selected })}
              />
            </section>
          )}
          <section className="panel">
            <div className="panel-heading">
              <h2>整盘轮训</h2>
              <Guide id="tray" text="训练说明" />
            </div>
            <div className="bp-tray-controls">
              <label>
                学习率{" "}
                <select
                  disabled={running || !!batch}
                  value={d.rate}
                  onChange={(e) => change({ ...d, rate: Number(e.target.value) })}
                >
                  {rates.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <span>
                已轮训 {Math.floor(d.traySteps / 12)} 盘 · 本盘 {slot}/12
              </span>
            </div>
            <History steps={d.steps} values={d.history} />
            {!batch && (
              <div className="bp-actions">
                <Button
                  variant={running ? "outline" : "default"}
                  onClick={() => setEnd(running ? null : d.traySteps + 12 - slot)}
                >
                  {running ? "暂停" : slot ? "继续本盘" : "训练一盘"}
                </Button>
                <Button variant="outline" onClick={lock}>
                  锁定，验 100 颗
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default function Experiment() {
  const { draft, change, runs, ready, save, saving, notice } = useLessonNotebook(start, validDraft);
  return (
    <LabShell
      title={lesson.title}
      code="07"
      topic="机器学习入门"
      description="沿一颗错分果子的反馈回看两条信号，再让机器从整盘样果中学习。"
      documents={documents}
      notice={notice}
      recordCount={runs.length}
      action={
        <Button onClick={save} disabled={!ready || saving}>
          <Save />
          保存记录
        </Button>
      }
      workbench={ready ? <Workbench d={draft} change={change} /> : <p>正在读取训练草稿…</p>}
      records={
        <section className="panel">
          <div className="panel-heading">
            <h2>训练快照</h2>
            <span>{runs.length} 条</span>
          </div>
          {!runs.length && <p className="bp-note">学一颗果子后保存，即可回来查看当时的反馈。</p>}
          {runs.map((r) => (
            <div key={r.id} className="bp-record">
              <div>
                <strong>
                  第 {r.draft.steps} 步 · 平均损失 {r.draft.history.at(-1)?.toFixed(3)}
                </strong>
                <small>
                  {new Date(r.at).toLocaleString("zh-CN")} ·{" "}
                  {r.draft.seed === null ? "训练盘" : "新果验收"}
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
