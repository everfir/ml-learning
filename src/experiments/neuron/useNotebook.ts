import { useEffect, useRef, useState } from "react";
import { listRecords, readRecord, writeRecord } from "@/shared/storage";
import { defaults, type Parameters, validParameters } from "./model";

type Snapshot = { version: 1; id: string; at: number; p: Parameters };
function isSnapshot(record: unknown): record is Snapshot {
  const r = record as Partial<Snapshot> | null;
  return (
    r?.version === 1 &&
    typeof r.id === "string" &&
    typeof r.at === "number" &&
    Number.isFinite(r.at) &&
    validParameters(r.p)
  );
}
export function useNotebook() {
  const [p, setP] = useState<Parameters>(defaults);
  const [records, setRecords] = useState<Snapshot[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    Promise.all([readRecord("draft:v1"), listRecords("sample:")])
      .then(([draft, items]) => {
        if (!active) return;
        if (validParameters(draft)) setP(draft);
        setRecords(items.filter(isSnapshot).sort((a, b) => b.at - a.at));
      })
      .catch(() => {
        if (active) setNotice("本地存储不可用，本次仍可操作实验。");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  function change(params: Parameters) {
    setP(params);
    // Serialize slider events so a slow commit cannot overwrite a newer edit.
    queue.current = queue.current
      .then(() => writeRecord("draft:v1", params))
      .catch(() => setNotice("参数暂存于本页，浏览器未能写入本地存储。"));
  }
  async function save() {
    setSaving(true);
    try {
      const id = crypto.getRandomValues(new Uint32Array(4)).join("-");
      const record: Snapshot = { id, at: Date.now(), version: 1, p };
      await writeRecord(`sample:${record.id}`, record);
      setRecords((prev) => [record, ...prev]);
      setNotice("记录已保存，可在「实验记录」中载入。");
    } catch {
      setNotice("保存失败，请检查浏览器的本地存储权限或剩余空间。");
    } finally {
      setSaving(false);
    }
  }
  return { p, change, records, save, ready, saving, notice };
}
