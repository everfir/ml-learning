import { useEffect, useState } from "react";
import { listRecords, readRecord } from "@/shared/storage";
import { type Draft, phases, ranking, reading, tray, validDraft } from "./legacy";

type Entry = { id: string; label: string; draft: Draft };
export function LegacyRecords() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([readRecord("draft:v1"), listRecords("run:")])
      .then(([draft, runs]) => {
        const entries: Entry[] = [];
        if (validDraft(draft)) entries.push({ id: "draft", label: "上次草稿", draft });
        for (const v of runs) {
          const r = v as { id?: string; at?: number; draft?: unknown } | null;
          if (typeof r?.id === "string" && typeof r.at === "number" && validDraft(r.draft))
            entries.push({
              id: r.id,
              label: new Date(r.at).toLocaleString("zh-CN"),
              draft: r.draft,
            });
        }
        if (active) setEntries(entries);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  if (error) return <p>旧版展台记录暂时无法读取。</p>;
  if (!entries.length) return null;
  return (
    <section className="panel net-legacy">
      <div className="panel-heading">
        <h2>旧版展台实验</h2>
        <span>历史读数</span>
      </div>
      {entries.map(({ id, label, draft: d }) => {
        const r = reading(d, { ...tray[0], orange: d.orange });
        return (
          <details key={id}>
            <summary>
              {label} · {phases[d.phase]}
            </summary>
            <p>
              果径权重 {d.weights.size}，颜色权重 {d.weights.color}。
              {d.pick && `你先选了 ${d.pick} 果。`}
            </p>
            <p>
              按分数排序：
              {ranking(d)
                .map((v) => `${v.fruit.id}（${v.z}）`)
                .join("、")}
              。偏置 {d.biasPoints / 100}。
            </p>
            {d.phase === "activation" && (
              <p>
                A 果橙色面积 {d.orange}%，硬门槛 {r.hard}，Sigmoid {r.soft.toFixed(4)}。
              </p>
            )}
          </details>
        );
      })}
    </section>
  );
}
