import { LabShell } from "@/shared/LabShell";
import { documents } from "./documents";
import "./style.css";
export default function Experiment() {
  return (
    <LabShell
      title="__ID__"
      code="—"
      topic="实验"
      description="在这里写下本课要验证的问题。"
      documents={documents}
      workbench={<section className="panel panel-heading">在这里接入实验控件与可视化。</section>}
      records={<section className="panel panel-heading">在这里展示本实验的本地记录。</section>}
    />
  );
}
