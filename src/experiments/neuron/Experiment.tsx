import { Bookmark, ChevronRight, FolderClock, Lightbulb, Save } from "lucide-react";
import { LabShell } from "@/shared/LabShell";
import { guideHref, lessonHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { Controls } from "./Controls";
import { documents } from "./documents";
import { fixed, forward } from "./model";
import { Response } from "./Response";
import { useNotebook } from "./useNotebook";
import "./style.css";

const prompts = {
  Sigmoid: "从中间向两端调节输入 x。在哪一段，同样幅度的调节对输出影响最大？",
  ReLU: "让加权输入 z 穿过 0。观察曲线左半边，哪些不同的输入会得到相同的输出？",
  Tanh: "让加权输入 z 从负值变为正值。当 z 穿过 0 时，输出的符号发生了什么变化？",
  Linear: "保持权重不变，把输入 x 增加 1。输出的变化量和权重有什么关系？",
};
export default function Experiment() {
  const { p, change, records, save, ready, saving, notice } = useNotebook();
  return (
    <LabShell
      title="单个神经元与激活函数"
      code="01"
      topic="神经网络基础"
      description="调节输入、权重和偏置，观察一个神经元如何将信号转化为输出。"
      documents={documents}
      recordCount={records.length}
      notice={notice}
      action={
        <Button onClick={save} disabled={!ready || saving}>
          <Save />
          {saving ? "保存中" : "保存记录"}
        </Button>
      }
      workbench={
        <>
          {" "}
          <div className="instrument-grid" inert={!ready}>
            <Controls p={p} change={change} />
            <Response p={p} />
          </div>
          <section className="observation">
            <span className="bulb">
              <Lightbulb size={19} />
            </span>
            <div>
              <h2>观察提示</h2>
              <p>{prompts[p.activation]}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                location.hash = guideHref("workbench", "response");
              }}
            >
              对照讲解 <ChevronRight size={14} />
            </button>
          </section>
        </>
      }
      records={
        <section className="panel records">
          <div className="panel-heading">
            <h2>
              <Bookmark />
              已保存的实验
            </h2>
            <span>{records.length} 条记录</span>
          </div>
          {records.length === 0 ? (
            <div className="empty">
              <FolderClock size={30} />
              <h3>还没有实验记录</h3>
              <p>在工作台调好参数后，点击「保存记录」即可在这里对照和载入。</p>
            </div>
          ) : (
            <ul>
              {records.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.p.activation}</strong>
                    <time>{new Date(r.at).toLocaleString("zh-CN")}</time>
                    <p>
                      x = {fixed(r.p.x)}　w = {fixed(r.p.w)}　b = {fixed(r.p.b)}　a ={" "}
                      {fixed(forward(r.p).a, 3)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      change(r.p);
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
      }
    />
  );
}
