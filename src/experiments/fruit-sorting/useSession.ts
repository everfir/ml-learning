import { useEffect, useRef, useState } from "react";
import { listRecords, readRecord, writeRecord } from "@/shared/storage";
import { type Session, start, validSession } from "./model";

type SavedRun = { id: string; at: number; session: Session };
function validRun(value: unknown): value is SavedRun {
  const run = value as Partial<SavedRun> | null;
  return (
    typeof run?.id === "string" &&
    typeof run.at === "number" &&
    Number.isFinite(run.at) &&
    validSession(run.session)
  );
}
export function useSession() {
  const [session, setSession] = useState(start);
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    Promise.all([readRecord("draft:v1"), listRecords("run:")])
      .then(([draft, data]) => {
        if (!active) return;
        if (validSession(draft)) setSession(draft);
        setRuns(data.filter(validRun).sort((a, b) => b.at - a.at));
      })
      .catch(() => {
        if (active) setNotice("本地存储不可用，本次仍可完成分拣。");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  function change(next: Session) {
    setSession(next);
    setNotice("");
    writes.current = writes.current
      .then(() => writeRecord("draft:v1", next))
      .catch(() => setNotice("进度保留在当前页面，浏览器未能保存草稿。"));
  }
  async function save() {
    setSaving(true);
    try {
      const run = {
        id: crypto.getRandomValues(new Uint32Array(4)).join("-"),
        at: Date.now(),
        session,
      };
      await writeRecord(`run:${run.id}`, run);
      setRuns((prev) => [run, ...prev]);
      setNotice("本轮已保存，可从实验记录载入。");
    } catch {
      setNotice("保存失败，请检查浏览器的本地存储权限。");
    } finally {
      setSaving(false);
    }
  }
  return { session, change, runs, save, saving, ready, notice };
}
