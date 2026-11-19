import { BookOpen, GitBranch, Save } from "lucide-react";
import { useState } from "react";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { useLessonNotebook } from "@/shared/useLessonNotebook";
import { documents } from "./documents";
import lesson from "./lesson.json";
import {
  bin,
  type Draft,
  harvest,
  inBand,
  midpoint,
  type Node,
  names,
  order,
  pairs,
  predict,
  predictLeaf,
  question,
  route,
  start,
  training,
  trees,
  units,
  validDraft,
} from "./model";
import { Plot } from "./Plot";
import "./style.css";

type Props = { d: Draft; change: (next: Draft) => void };
const phases = { guess: "猜两组果", band: "重试筛带", tree: "学一棵树" };
function Guide({ anchor }: { anchor: keyof typeof phases }) {
  return (
    <a className="tree-read" href={guideHref("workbench", anchor)}>
      <BookOpen size={14} />
      操作说明
    </a>
  );
}
function Guesses({ d, change }: Props) {
  const offset = d.revealed === 0 ? 0 : 2;
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>只给果径，你会怎样装箱？</h2>
        <Guide anchor="guess" />
      </div>
      <div className="tree-body">
        <p>客户要小而橙、大而青的两种果。先给同尺寸的两颗各猜一个箱，猜完再掀开果皮读数。</p>
        <div className="tree-tickets">
          {pairs.slice(0, d.revealed === 0 ? 2 : 4).map((f, i) => {
            const shown = i < d.revealed * 2;
            const guess = d.guesses[i];
            return (
              <article key={f.id} className="tree-ticket">
                <header>
                  <strong>样果 {f.id}</strong>
                  <b>{f.diameter} mm</b>
                </header>
                <div className="tree-meter" aria-hidden="true">
                  {shown && <span style={{ width: `${f.orange}%` }} />}
                </div>
                <p>{shown ? `橙色面积 ${f.orange}%` : "橙色面积待揭晓"}</p>
                {shown ? (
                  <p>
                    你猜{bin(!!guess)} · 订单<strong>{bin(order(f))}</strong>
                  </p>
                ) : (
                  <div className="tree-actions">
                    {[true, false].map((b) => (
                      <Button
                        key={bin(b)}
                        size="sm"
                        variant={guess === b ? "default" : "outline"}
                        aria-pressed={guess === b}
                        aria-label={`样果 ${f.id} 猜${bin(b)}`}
                        onClick={() =>
                          change({ ...d, guesses: d.guesses.map((g, j) => (j === i ? b : g)) })
                        }
                      >
                        {bin(b)}
                      </Button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {d.revealed < 2 ? (
          <Button
            disabled={d.guesses.slice(offset, offset + 2).includes(null)}
            onClick={() => change({ ...d, revealed: d.revealed + 1 })}
          >
            揭晓{offset === 0 ? "小" : "大"}果的颜色
          </Button>
        ) : (
          <>
            <p>60 mm 的两颗里，橙色多的进礼盒。换成 72 mm，橙色多的反而走散装。</p>
            <Button onClick={() => change({ ...d, phase: "band" })}>拿上节的筛带来试</Button>
          </>
        )}
      </div>
    </section>
  );
}
function Legend() {
  return (
    <div className="tree-legend">
      <span>● 订单收礼盒</span>
      <span>◆ 订单走散装</span>
      <span>浅橙区域收礼盒</span>
    </div>
  );
}
function BandTrial({ d, change }: Props) {
  const accepted = [pairs[0], pairs[3]].every((f) => inBand(d.band, f));
  const fruit = d.middle ? [...pairs, midpoint] : pairs;
  return (
    <div className="tree-cols">
      <section className="panel">
        <div className="panel-heading">
          <h2>用一道直带同时收下 A、D</h2>
        </div>
        <Legend />
        <Plot fruit={fruit} band={d.band} />
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>调筛带</h2>
          <Guide anchor="band" />
        </div>
        <div className="tree-body">
          <p>A 是小橙果，D 是大青果。调节中心、倾斜和宽度，试着收下它们，把 B、C 留在外面。</p>
          {(
            [
              ["center", "中心高度（橙色 60% 处）", 54, 78],
              ["tilt", "橙色每增加 50 个百分点的升降", -16, 16],
              ["width", "中心到带边的距离", 1, 12],
            ] as const
          ).map(([k, label, min, max]) => (
            <label className="tree-range" key={k}>
              {label}
              <output>{d.band[k]} mm</output>
              <input
                aria-label={label}
                type="range"
                min={min}
                max={max}
                value={d.band[k]}
                onChange={(e) => change({ ...d, band: { ...d.band, [k]: e.target.valueAsNumber } })}
              />
            </label>
          ))}
          <p role="status">
            当前收进礼盒：
            {fruit
              .map((f) => (inBand(d.band, f) ? f.id : null))
              .filter(Boolean)
              .join("、") || "无"}
            。
          </p>
          <div className="tree-actions">
            <Button
              variant="outline"
              onClick={() => change({ ...d, band: { center: 66, tilt: -10, width: 3 } })}
            >
              沿 A、D 连线放带
            </Button>
            {!d.middle && (
              <Button disabled={!accepted} onClick={() => change({ ...d, middle: true })}>
                送入中点果
              </Button>
            )}
          </div>
          {d.middle && (
            <>
              <p>66 mm、60% 橙色的中点果应走散装。试着把它移出带子，再看看 A、D 能否同时留下。</p>
              <Button onClick={() => change({ ...d, phase: "tree" })}>让机器分支判断</Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
function Branch({ node, path, edge }: { node: Node; path: Node[]; edge?: string }) {
  return (
    <li>
      <div className={path.includes(node) ? "tree-node active" : "tree-node"}>
        {edge && <small>{edge}</small>}
        <strong>{node.split ? question(node.split) : bin(predictLeaf(node))}</strong>
        <span>
          {node.gifts} 礼盒 / {node.count - node.gifts} 散装
        </span>
      </div>
      {node.split && (
        <ul>
          <Branch node={node.split.left} path={path} edge="是" />
          <Branch node={node.split.right} path={path} edge="否" />
        </ul>
      )}
    </li>
  );
}
function TreeLab({ d, change }: Props) {
  const [selected, select] = useState(0);
  const tree = trees[d.step],
    locked = d.seed !== null,
    fruit = d.seed === null ? training : harvest(d.seed);
  const index = Math.min(selected, fruit.length - 1),
    f = fruit[index],
    { path } = route(tree, f);
  const score = fruit.filter((v) => predict(tree, v) === order(v)).length;
  function advance(seed: number | null) {
    select(0);
    change({ ...d, seed });
  }
  return (
    <div className="tree-cols">
      <section className="panel">
        <div className="panel-heading">
          <h2>{locked ? "锁树验新果" : "训练果与分箱区域"}</h2>
          <span>{fruit.length} 颗 · 模拟订单</span>
        </div>
        <Legend />
        <Plot tree={tree} fruit={fruit} selected={index} pick={select} />
        <div className="tree-body tree-inspect">
          <label>
            逐果追踪{" "}
            <select
              aria-label="选择追踪的果子"
              value={index}
              onChange={(e) => select(Number(e.target.value))}
            >
              {fruit.map((v, i) => (
                <option key={v.id} value={i}>
                  第 {i + 1} 颗 · {v.diameter} mm / {v.orange}%
                  {predict(tree, v) !== order(v) && " · 错分"}
                </option>
              ))}
            </select>
          </label>
          <p>
            {path
              .map((n) => {
                const s = n.split;
                if (!s) return bin(predictLeaf(n));
                return `${names[s.feature]} ${f[s.feature]}${units[s.feature]} ${f[s.feature] <= s.cut ? "≤" : ">"} ${s.cut}${units[s.feature]}`;
              })
              .join(" → ")}
            。订单为{bin(order(f))}。
          </p>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>
            <GitBranch />
            机器学出的树
          </h2>
          <Guide anchor="tree" />
        </div>
        <div className="tree-body">
          <div className="tree-score" role="status">
            {locked ? "新果" : "训练果"}分对{" "}
            <b>
              {score} / {fruit.length}
            </b>{" "}
            · 已分裂 {d.step} 次
          </div>
          <ul className="tree-diagram">
            <Branch node={tree} path={path} />
          </ul>
          <p>
            {locked
              ? "树已锁定。换一批来货，或者在图中选一颗错分的果子追踪它的判断路径。"
              : d.step === 0
                ? "起初只看整箱的多数票。长出第一个分支，看机器选了哪项测量。"
                : d.step === trees.length - 1
                  ? "每片叶子里的训练果已经同类。试试没见过的果子，尤其留意阈值附近。"
                  : "下一次只切开一个叶子。观察图上哪块区域改变了去向。"}
          </p>
          <div className="tree-actions">
            {!locked && (
              <>
                <Button
                  disabled={d.step === trees.length - 1}
                  onClick={() => change({ ...d, step: d.step + 1 })}
                >
                  长出一个分支
                </Button>
                <Button
                  variant="outline"
                  disabled={d.step === 0}
                  onClick={() => change({ ...d, step: d.step - 1 })}
                >
                  退回上一步
                </Button>
              </>
            )}
            <Button
              variant={locked ? "default" : "outline"}
              onClick={() => advance(crypto.getRandomValues(new Uint32Array(1))[0])}
            >
              {locked ? "再验一批" : "锁树验新果"}
            </Button>
            {locked && (
              <Button variant="outline" onClick={() => advance(null)}>
                返回训练
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
export default function Experiment() {
  const {
    draft: d,
    change,
    runs,
    ready,
    saving,
    save,
    notice,
  } = useLessonNotebook(start, validDraft);
  return (
    <LabShell
      title={lesson.title}
      code="04"
      topic="机器学习入门"
      description="给拼色礼盒挑果子。让机器从装箱记录中学会先问什么，再按答案分头判断。"
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
        !ready ? (
          <p>正在读取草稿…</p>
        ) : (
          <>
            <ol className="tree-stages" aria-label="实验进度">
              {Object.entries(phases).map(([key, label], i) => (
                <li key={key} aria-current={key === d.phase ? "step" : undefined}>
                  0{i + 1} {label}
                </li>
              ))}
            </ol>
            {d.phase === "guess" ? (
              <Guesses d={d} change={change} />
            ) : d.phase === "band" ? (
              <BandTrial d={d} change={change} />
            ) : (
              <TreeLab d={d} change={change} />
            )}
            {d.phase !== "guess" && (
              <Button
                className="tree-back"
                variant="ghost"
                onClick={() =>
                  change({ ...d, phase: d.phase === "tree" ? "band" : "guess", seed: null })
                }
              >
                返回上一阶段
              </Button>
            )}
          </>
        )
      }
      records={
        <section className="panel">
          <div className="panel-heading">
            <h2>已保存的分拣记录</h2>
            <span>{runs.length} 条</span>
          </div>
          {runs.length === 0 ? (
            <p className="tree-body">
              {ready ? "在工作台保存一次，可以回到当时的筛带、决策树和验收批次。" : "正在读取记录…"}
            </p>
          ) : (
            runs.map((r) => (
              <div key={r.id} className="tree-record">
                <div>
                  <strong>
                    {phases[r.draft.phase]}
                    {r.draft.phase === "tree" &&
                      ` · 分裂 ${r.draft.step} 次${r.draft.seed !== null ? " · 已锁树" : ""}`}
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
      }
    />
  );
}
