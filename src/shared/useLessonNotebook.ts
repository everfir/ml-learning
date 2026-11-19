import { useEffect, useRef, useState } from "react";
import { openRecordStore, writeRecord } from "@/shared/storage";

type Snapshot<Draft> = { id: string; at: number; draft: Draft };
function validSnapshot<Draft>(
  value: unknown,
  validDraft: (value: unknown) => value is Draft,
): value is Snapshot<Draft> {
  const r = value as Partial<Snapshot<Draft>> | null;
  return (
    typeof r?.id === "string" &&
    typeof r.at === "number" &&
    Number.isFinite(r.at) &&
    validDraft(r.draft)
  );
}
export function useLessonNotebook<Draft>(
  start: () => Draft,
  validDraft: (value: unknown) => value is Draft,
) {
  const [draft, setDraft] = useState<Draft>(start);
  const [runs, setRuns] = useState<Snapshot<Draft>[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const store = useRef<Awaited<ReturnType<typeof openRecordStore>> | null>(null);
  useEffect(() => {
    let active = true;
    openRecordStore()
      .then(async (db) => {
        if (!active) {
          db.close();
          return;
        }
        store.current = db;
        db.addEventListener("versionchange", () => {
          db.close();
          store.current = null;
        });
        return Promise.all([
          db.get("records", "draft:v1"),
          db.getAll("records", IDBKeyRange.bound("run:", "run:\uffff")),
        ]);
      })
      .then((records) => {
        if (!active || !records) return;
        const [d, r] = records;
        if (validDraft(d)) setDraft(d);
        setRuns(r.filter((item) => validSnapshot(item, validDraft)).sort((a, b) => b.at - a.at));
      })
      .catch(() => {
        if (active) setNotice("本地记录暂不可用，仍可调线和验果。");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      store.current?.close();
      store.current = null;
    };
  }, [validDraft]);
  async function change(next: Draft) {
    setDraft(next);
    try {
      const db = store.current;
      if (!db) {
        await writeRecord("draft:v1", next);
        return;
      }
      // Submit the commit before returning control to a reader who may immediately reload.
      const tx = db.transaction("records", "readwrite");
      const put = tx.store.put(next, "draft:v1");
      tx.commit?.();
      await Promise.all([put, tx.done]);
    } catch {
      setNotice("进度保留在当前页面，浏览器未能写入草稿。");
    }
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
