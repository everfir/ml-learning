import { BookOpen, ChartScatter, Save, SlidersHorizontal } from "lucide-react";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { useLessonNotebook } from "@/shared/useLessonNotebook";
import { documents } from "./documents";
import lesson from "./lesson.json";
import {
  accepts,
  batchSize,
  bestSingle,
  type Draft,
  examples,
  hits,
  ordered,
  probes,
  type Rule,
  sample,
  stage,
  stages,
  start,
  validDraft,
} from "./model";
import { SortingMap } from "./SortingMap";
import "./style.css";

const bin = (gift: boolean) => (gift ? "礼盒" : "散装");
function Slider({
  label,
  value,
  tilt = false,
  change,
}: {
  label: string;
  value: number;
  tilt?: boolean;
  change: (n: number) => void;
}) {
  return (
    <label className="gift-slider">
      <span>{label}</span>
      <output>{value} mm</output>
      <input
        type="range"
        aria-label={label}
        min={tilt ? -10 : 50}
        max={tilt ? 10 : 80}
        value={value}
        onChange={(e) => change(e.target.valueAsNumber)}
      />
    </label>
  );
}
function Workbench({ draft, change }: { draft: Draft; change: (draft: Draft) => void }) {
  const { rule, audit } = draft;
  const step = stage(draft);
  const fruit = audit ? sample(audit.seed) : examples;
  const score = hits(rule, fruit);
  const edit = (next: Rule) => change({ ...draft, tried: true, rule: next });
  function inspectBatch() {
    change({
      ...draft,
      audit: {
        round: (audit?.round ?? 0) + 1,
        seed: crypto.getRandomValues(new Uint32Array(1))[0],
      },
    });
  }
  return (
    <div className="gift-lab">
      <ol className="gift-stages" aria-label="实验进度">
        {stages.map((name, i) => (
          <li key={name} aria-current={step === i ? "step" : undefined}>
            <b>0{i + 1}</b>
            {name}
          </li>
        ))}
      </ol>
      <div className="gift-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <ChartScatter />
              {audit ? `第 ${audit.round} 批新果` : "三颗样果与分箱线"}
            </h2>
            <span>{fruit.length} 颗 · 教学模拟</span>
          </div>
          <div className="gift-map-key">
            <span>● 礼盒样果</span>
            <span>◆ 散装样果</span>
            <span>虚圈为错分</span>
          </div>
          <SortingMap rule={rule} fruit={fruit} onChange={audit ? undefined : edit} />
          <div className="gift-caption">
            <i aria-hidden="true" />
            着色处进礼盒{rule.second !== null && " · 实线为第一道筛，虚线为第二道筛"}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <SlidersHorizontal />
              {["调一条分箱线", "给礼盒划出范围", "验收锁定的规则"][step]}
            </h2>
            <a
              className="gift-read"
              href={guideHref("workbench", ["single", "double", "inspect"][step])}
            >
              <BookOpen size={15} />
              操作说明
            </a>
          </div>
          <div className="gift-controls">
            <div className="gift-order">
              <strong>礼盒订单</strong>
              <span>果径 62–70 mm，含两端</span>
            </div>
            <div className="gift-score" role="status">
              <span>{audit ? "本批分对" : "样果分对"}</span>
              <b>
                {score}
                <small> / {fruit.length} 颗</small>
              </b>
            </div>
            {!audit && (
              <>
                {rule.second === null ? (
                  <label className="gift-direction">
                    哪一侧进礼盒
                    <select
                      value={rule.above ? "above" : "below"}
                      onChange={(e) => edit({ ...rule, above: e.target.value === "above" })}
                    >
                      <option value="above">线上及上方</option>
                      <option value="below">线上及下方</option>
                    </select>
                  </label>
                ) : (
                  <p>两道筛都放行才进礼盒。把两个把手分别移到想要的果径。</p>
                )}
                <Slider
                  label={
                    rule.second === null ? "中心高度" : `第一道筛 · ${rule.above ? "下限" : "上限"}`
                  }
                  value={rule.first}
                  change={(first) => edit({ ...rule, first })}
                />
                {rule.second !== null && (
                  <Slider
                    label={`第二道筛 · ${rule.above ? "上限" : "下限"}`}
                    value={rule.second}
                    change={(second) => edit({ ...rule, second })}
                  />
                )}
                <Slider
                  label={rule.second === null ? "右端相对中心的升降" : "两条线右端相对中心的升降"}
                  value={rule.tilt}
                  tilt
                  change={(tilt) => edit({ ...rule, tilt })}
                />
              </>
            )}
            {step === 0 && (
              <>
                <p>
                  {draft.tried
                    ? "看一眼带虚圈的果子。把它拨回正确的一侧，再看看哪一颗跟着换了箱。"
                    : "先试着让 66 mm 进礼盒，把 58 和 74 mm 留在散装。拖动图上的把手，或用滑杆调线。"}
                </p>
                <div className="gift-actions">
                  <Button variant="outline" onClick={() => edit(bestSingle(rule))}>
                    让机器试最佳单线
                  </Button>
                  <Button
                    disabled={!draft.tried}
                    onClick={() => edit({ ...rule, second: rule.above ? 76 : 56 })}
                  >
                    加第二道筛
                  </Button>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <p>
                  {score === 3
                    ? "三颗都分对了。刚好 62 mm 和 70 mm 的果子也能进礼盒吗？"
                    : "对照下方装箱单，找出哪颗被错收或错拦。你可以随时锁线检验这套规则。"}
                </p>
                <div className="gift-actions">
                  <Button onClick={inspectBatch}>锁线验新果</Button>
                  <Button variant="ghost" onClick={() => edit({ ...rule, second: null })}>
                    回到单线
                  </Button>
                </div>
              </>
            )}
            {audit && (
              <>
                <p>
                  两道筛已锁定。在橙色面积为 50% 处，下限 {rule.above ? rule.first : rule.second}{" "}
                  mm，上限 {rule.above ? rule.second : rule.first} mm，右端相对中心升降 {rule.tilt}{" "}
                  mm。
                </p>
                <p>
                  下方装箱单的前四颗专查订单边界，其余八颗随机抽取。对照订单，看看有没有漏装或误收。
                </p>
                <div className="gift-actions">
                  <Button onClick={inspectBatch}>再验一批新果</Button>
                  <Button variant="outline" onClick={() => change({ ...draft, audit: null })}>
                    解锁并调筛
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
      <section className="panel gift-manifest">
        <div className="panel-heading">
          <h2>{audit ? "新果装箱单" : "样果装箱单"}</h2>
          <span>{audit ? "锁线后抽检" : "三颗果皮均为 50% 橙色"}</span>
        </div>
        <table>
          <thead>
            <tr>
              {["果径", "橙色面积", "订单要求", "机器分拣", "核对"].map((t) => (
                <th key={t} scope="col">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fruit.map((f, i) => {
              const actual = ordered(f);
              const prediction = accepts(rule, f);
              return (
                <tr key={f.id}>
                  <th scope="row">
                    {f.diameter} mm{audit && i < probes.length && <small>边界果</small>}
                  </th>
                  <td>{f.orange}%</td>
                  <td>{bin(actual)}</td>
                  <td>{bin(prediction)}</td>
                  <td className={actual === prediction ? undefined : "gift-miss"}>
                    {actual === prediction ? "正确" : prediction ? "误收" : "漏装"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
export default function Experiment() {
  const { draft, change, ready, save, saving, runs, notice } = useLessonNotebook(start, validDraft);
  return (
    <LabShell
      title={lesson.title}
      topic="机器学习入门"
      code="03"
      description="给柑橘礼盒挑尺寸。试试一条线能拦住哪些果子，再把自己的规则送去验收。"
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
        ready ? <Workbench draft={draft} change={change} /> : <p role="status">正在读取实验草稿…</p>
      }
      records={
        <section className="panel">
          <div className="panel-heading">
            <h2>礼盒分拣记录</h2>
            <span>{runs.length} 条</span>
          </div>
          {!ready ? (
            <p className="gift-record">正在读取记录…</p>
          ) : runs.length === 0 ? (
            <p className="gift-record">在工作台点击「保存记录」，可以留下当前的筛线和装箱单。</p>
          ) : (
            runs.map((r) => (
              <div key={r.id} className="gift-record">
                <div>
                  <strong>
                    {stages[stage(r.draft)]}
                    {r.draft.audit &&
                      ` · 第 ${r.draft.audit.round} 批分对 ${hits(r.draft.rule, sample(r.draft.audit.seed))}/${batchSize} 颗`}
                  </strong>
                  <p>
                    {new Date(r.at).toLocaleString("zh-CN")} · 第一道筛 {r.draft.rule.first} mm
                    {r.draft.rule.second !== null && `，第二道筛 ${r.draft.rule.second} mm`}
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
