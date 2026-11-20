import { useEffect, useState } from "react";
import { type Fruit, ordered } from "../data/gift-order";
import { guideHref } from "../lesson-route";
import { Button } from "../ui/button";
import { FruitMap } from "./FruitMap";

type Props = {
  fruit: Fruit[];
  predictsGift: (f: Fruit) => boolean;
  animate: boolean;
  heading: string;
  summary: string;
  again: () => void;
  unlock: () => void;
};
export function TrayAudit({
  fruit,
  predictsGift,
  animate,
  heading,
  summary,
  again,
  unlock,
}: Props) {
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
  const hits = visible.filter((f) => predictsGift(f) === ordered(f)).length;
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{heading}</h2>
        <span>{summary}</span>
      </div>
      <div className="tray-audit-readout">
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
      <progress className="tray-progress" aria-label="新果验收进度" value={count} max={total} />
      <FruitMap predictsGift={predictsGift} fruit={visible} />
      <div className="tray-pad tray-actions">
        {done ? (
          <Button onClick={again}>再验 100 颗</Button>
        ) : (
          <Button variant="outline" onClick={() => show(total)}>
            直接看本批结果
          </Button>
        )}
        <Button variant="outline" onClick={unlock}>
          解锁调参
        </Button>
        <a className="tray-guide" href={guideHref("workbench", "audit")}>
          验收说明
        </a>
      </div>
    </section>
  );
}
