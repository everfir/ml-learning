import { useEffect, useRef, useState } from "react";
import { listRecords, readRecord, writeRecord } from "@/shared/storage";
import { type Draft, start, validDraft } from "./model";

type Snapshot = { id: string; at: number; draft: Draft };
function validSnapshot(value: unknown): value is Snapshot {
  const r = value as Partial<Snapshot> | null;
  return (
    typeof r?.id === "string" &&
    typeof r.at === "number" &&
    Number.isFinite(r.at) &&
    validDraft(r.draft)
  );
}
export function useNotebook() {
  const [draft, setDraft] = useState<Draft>(start);
  const [runs, setRuns] = useState<Snapshot[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    Promise.all([readRecord("draft:v1"), listRecords("run:")])
      .then(([d, r]) => {
        if (!active) return;
        if (validDraft(d)) setDraft(d);
        setRuns(r.filter(validSnapshot).sort((a, b) => b.at - a.at));
      })
      .catch(() => {
        if (active) setNotice("本地记录暂不可用，仍可调线和验果。");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  function change(next: Draft) {
    setDraft(next);
    writes.current = writes.current
      .then(() => writeRecord("draft:v1", next))
      .catch(() => setNotice("进度保留在当前页面，浏览器未能写入草稿。"));
  }
  async function save() {
    setSaving(true);
    try {
      const run = {
        id: crypto.getRandomValues(new Uint32Array(4)).join("-"),
        at: Date.now(),
        draft,
      };
      await writeRecord(`run:${run.id}`, run);
      setRuns((prev) => [run, ...prev]);
      setNotice("已保存，可从实验记录载入。");
    } catch {
      setNotice("保存失败，请检查浏览器的存储权限。");
    } finally {
      setSaving(false);
    }
  }
  return { draft, change, runs, ready, saving, save, notice };
}
