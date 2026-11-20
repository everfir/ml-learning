import { useEffect, useMemo, useState } from "react";
import { guideHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { FruitMap } from "./Figures";
import { audit, auditSize, type Draft, inspect } from "./model";

type Props = {
  seed: number;
  version: Draft["version"];
  weight: number;
  animate: boolean;
  again: () => void;
  unlock: () => void;
};
export function AuditPanel({ seed, version, weight, animate, again, unlock }: Props) {
  const fruit = useMemo(() => audit(seed, version), [seed, version]);
  const total = fruit.length;
  const [count, show] = useState(() =>
    animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : total,
  );
  const done = count === total;
  useEffect(() => {
    if (done) return;
    const clock = window.setInterval(() => show((n) => Math.min(total, n + 1)), 65);
    return () => window.clearInterval(clock);
  }, [done, total]);
  const visible = fruit.slice(0, count);
  const hits = visible.filter((f) => inspect(weight, f).correct).length;
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{version === 1 ? "旧版验收" : "新果验收"}</h2>
        <span>锁定权重 {weight.toFixed(2)}</span>
      </div>
      <div className="loss-audit-readout">
        <span>
          已验{" "}
          <b>
            {count} / {total}
          </b>
        </span>
        <span>
          累计正确率 <b>{count ? `${Number(((hits / count) * 100).toFixed(1))}%` : "—"}</b>
        </span>
        <span>分对 {hits} 颗</span>
      </div>
      <progress className="loss-progress" aria-label="新果验收进度" value={count} max={total} />
      <FruitMap weight={weight} fruit={visible} />
      <div className="loss-pad loss-actions">
        {done ? (
          <Button onClick={again}>再验 {auditSize} 颗</Button>
        ) : (
          <Button variant="outline" onClick={() => show(total)}>
            直接看本批结果
          </Button>
        )}
        <Button variant="outline" onClick={unlock}>
          解锁调参
        </Button>
        <a className="loss-guide" href={guideHref("workbench", "audit")}>
          验收说明
        </a>
      </div>
    </section>
  );
}
