import { BookOpen, Check, ClipboardList, Save, ScanLine } from "lucide-react";
import { useRef } from "react";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { documents } from "./documents";
import lesson from "./lesson.json";
import { batch, bins, predict, type Session, start, type Trial } from "./model";
import { SampleMap } from "./SampleMap";
import photo from "./sorting.jpg";
import { useSession } from "./useSession";
import "./style.css";

function score(trials: Trial[]) {
  let human = 0,
    machine = 0;
  for (const [i, t] of trials.entries()) {
    const fruit = batch[i];
    if (t.guess === fruit.bin) human++;
    if (predict(fruit, t.k, t.withExtra).bin === fruit.bin) machine++;
  }
  return { human, machine };
}
function Review({ session }: { session: Session }) {
  const { trials } = session;
  const tally = score(trials);
  return (
    <section className="panel run-review">
      <div className="panel-heading">
        <h2>
          <ClipboardList />
          本轮抽检结果
        </h2>
        <span>
          {trials.length} / {batch.length} 颗
        </span>
      </div>
      {trials.length === 0 ? (
        <p>在工作台揭晓第一颗果子的抽检结果后，这里会出现分拣明细。</p>
      ) : (
        <>
          <p>
            已核对 {trials.length} 颗，你分对 {tally.human} 颗，机器分对 {tally.machine} 颗。
          </p>
          <div className="sample-scroll">
            <table>
              <thead>
                <tr>
                  <th>果样</th>
                  <th>你的判断</th>
                  <th>机器预测</th>
                  <th>抽检答案</th>
                  <th>机器设置</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((t, i) => {
                  const q = batch[i];
                  return (
                    <tr key={q.id}>
                      <th>{q.id}</th>
                      <td>{bins[t.guess]}</td>
                      <td>{bins[predict(q, t.k, t.withExtra).bin]}</td>
                      <td>{bins[q.bin]}</td>
                      <td>
                        {t.k} 票 · {t.withExtra ? 13 : 12} 例
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
export default function Experiment() {
  const { session: s, change, ready, saving, save, runs, notice } = useSession();
  const votePanel = useRef<HTMLElement>(null);
  const intake = useRef<HTMLElement>(null);
  const q = batch[s.index];
  const revealed = s.trials.length > s.index;
  const chosen = s.guess !== null;
  const result = predict(q, s.k, s.withExtra);
  const complete = s.trials.length === batch.length;
  function reveal() {
    if (!s.guess || revealed) return;
    change({ ...s, trials: [...s.trials, { guess: s.guess, k: s.k, withExtra: s.withExtra }] });
  }
  const tally = score(s.trials);
  return (
    <LabShell
      title={lesson.title}
      code="01"
      topic="机器学习入门"
      description="接手一条柑橘分拣线：从品控员尝过的果子中找线索，为下一颗选一个箱。"
      documents={documents}
      recordCount={runs.length}
      notice={notice}
      action={
        <Button disabled={!ready || saving} onClick={save}>
          <Save />
          {saving ? "保存中" : "保存记录"}
        </Button>
      }
      workbench={
        <div className="sorting-lab" inert={!ready}>
          <div className="sorting-columns">
            <section className="panel intake" ref={intake} tabIndex={-1}>
              <div className="panel-heading">
                <h2>
                  <ScanLine />
                  待分拣果样 {q.id}
                </h2>
                <span>
                  模拟抽检 · {s.index + 1} / {batch.length}
                </span>
              </div>
              <img
                className="sorting-photo"
                src={photo}
                alt="分拣滚筒上的一批柑橘，颜色和大小各异，场景示意"
              />
              <div className="intake-body">
                <div className="fruit-readouts">
                  <div>
                    <span>果皮橙色面积</span>
                    <strong>
                      {q.orange}
                      <small>%</small>
                    </strong>
                  </div>
                  <div>
                    <span>果径</span>
                    <strong>
                      {q.diameter}
                      <small>mm</small>
                    </strong>
                  </div>
                </div>
                <h3>你会把它放进哪个箱？</h3>
                <p>
                  这批订单把偏甜的放入鲜食箱，偏酸的送去加工。图中的彩色点是品控员已经尝过的果子。
                </p>
                <div className="bin-options">
                  {(["fresh", "juice"] as const).map((b) => (
                    <button
                      type="button"
                      key={b}
                      aria-pressed={s.guess === b}
                      disabled={chosen}
                      onClick={() => change({ ...s, guess: b })}
                    >
                      <i className={b === "fresh" ? "fresh-dot" : "juice-dot"} />
                      {bins[b]}
                      {s.guess === b && <Check size={15} />}
                    </button>
                  ))}
                </div>
                <div className="fruit-links">
                  {chosen && (
                    <button
                      className="fruit-read"
                      type="button"
                      onClick={() => votePanel.current?.focus()}
                    >
                      查看机器投票
                    </button>
                  )}
                  <a className="fruit-read" href={guideHref("introduction", "task")}>
                    <BookOpen size={14} />
                    第一次接班？读分拣任务
                  </a>
                </div>
              </div>
            </section>
            <SampleMap fruit={q} k={s.k} withExtra={s.withExtra} showVotes={chosen} />
          </div>
          {chosen && (
            <section className="panel vote-panel" ref={votePanel} tabIndex={-1}>
              <div className="panel-heading">
                <h2>机器参考了哪几颗？</h2>
                <a className="fruit-read" href={guideHref("theory", "distance")}>
                  距离怎么算？
                </a>
              </div>
              <div className="vote-layout">
                <div>
                  <fieldset disabled={revealed}>
                    <legend>让最近的几颗投票</legend>
                    <div className="k-options">
                      {([1, 3, 5] as const).map((k) => (
                        <button
                          type="button"
                          key={k}
                          aria-pressed={s.k === k}
                          onClick={() => change({ ...s, k })}
                        >
                          {k} 颗
                        </button>
                      ))}
                    </div>
                    <label className="extra-sample">
                      <input
                        type="checkbox"
                        checked={s.withExtra}
                        onChange={(e) => change({ ...s, withExtra: e.target.checked })}
                      />
                      补入样本 13：外皮很橙，尝起来偏酸
                    </label>
                  </fieldset>
                </div>
                <div className="vote-result" aria-live="polite">
                  <h3>机器预测 · {bins[result.bin]}</h3>
                  <p>
                    鲜食箱 {result.fresh} 票，加工箱 {result.juice} 票。
                  </p>
                  <div className="neighbor-chips">
                    {result.neighbors.map((n) => (
                      <span key={n.sample.id}>
                        <i className={n.sample.bin === "fresh" ? "fresh-dot" : "juice-dot"} />
                        {n.sample.id} · 距离 {n.distance.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="check-result" aria-live="polite">
                {revealed ? (
                  <>
                    <div>
                      <h3>抽检答案 · {bins[q.bin]}</h3>
                      <p>
                        {q.bin === "fresh" ? "品控员尝到偏甜。" : "品控员尝到偏酸。"}
                        {result.bin === q.bin
                          ? "机器这次分对了。"
                          : "机器分错了：外观相近的果子也会有不同口味。"}
                        {complete &&
                          ` 本轮四颗中，你分对 ${tally.human} 颗，机器分对 ${tally.machine} 颗。`}
                      </p>
                    </div>
                    {complete ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          change(start());
                          intake.current?.focus();
                        }}
                      >
                        用同批果样再试一轮
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          change({ ...s, index: s.index + 1, guess: null });
                          intake.current?.focus();
                        }}
                      >
                        分拣下一颗
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <p>调整投票数，观察连线和票数。确定后再和人工抽检对照。</p>
                    <Button onClick={reveal}>揭晓抽检结果</Button>
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      }
      records={
        <div className="sorting-lab">
          <Review session={s} />
          <section className="panel saved-runs">
            <div className="panel-heading">
              <h2>已保存的分拣轮次</h2>
              <span>{runs.length} 条</span>
            </div>
            {runs.length === 0 ? (
              <p>在工作台点击「保存记录」，可留下当前设置和已揭晓的判断。</p>
            ) : (
              <ul>
                {runs.map((run) => (
                  <li key={run.id}>
                    <div>
                      <strong>已核对 {run.session.trials.length} / 4 颗</strong>
                      <time>{new Date(run.at).toLocaleString("zh-CN")}</time>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        change(run.session);
                        location.hash = lessonHref({ section: "workbench" });
                      }}
                    >
                      载入
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      }
    />
  );
}
