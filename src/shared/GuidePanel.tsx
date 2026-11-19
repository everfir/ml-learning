import { BookOpen, ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LessonDocument, type LessonDocuments } from "./LessonDocument";
import {
  type Destination,
  isInteractive,
  labels,
  lessonHref,
  type Section,
  sections,
} from "./lesson-route";
import { Button } from "./ui/button";

export function GuidePanel({
  page,
  target,
  documents,
}: {
  page: Destination;
  target: Destination;
  documents: LessonDocuments;
}) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const progress = useRef<{ documentKey: string; fraction: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeHref = lessonHref(page);
  const documentKey = `${target.section}/${target.anchor ?? ""}`;
  const sizeLabel = expanded ? "还原侧栏" : "全屏放大";
  function toggleSize() {
    const article = dialog.current?.querySelector("article");
    if (article) {
      const range = article.scrollHeight - article.clientHeight;
      if (range > 0 || !expanded || progress.current?.documentKey !== documentKey) {
        progress.current = { documentKey, fraction: range > 0 ? article.scrollTop / range : 0 };
      }
    }
    setExpanded(!expanded);
  }
  useLayoutEffect(() => {
    const trigger = document.activeElement;
    return () => {
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus({ preventScroll: true });
    };
  }, []);
  useLayoutEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const narrow = matchMedia("(max-width: 759px)");
    function position() {
      if (!d) return;
      const modal = expanded || narrow.matches;
      if (d.open && d.matches(":modal") === modal) return;
      const focused = document.activeElement;
      if (d.open) d.close();
      if (modal) d.showModal();
      else d.show();
      if (focused instanceof HTMLElement && d.contains(focused))
        focused.focus({ preventScroll: true });
      if (!d.contains(document.activeElement)) closeRef.current?.focus({ preventScroll: true });
    }
    position();
    setVisible(true);
    narrow.addEventListener("change", position);
    return () => {
      narrow.removeEventListener("change", position);
    };
  }, [expanded]);
  useLayoutEffect(() => {
    const article = dialog.current?.querySelector("article");
    const saved = progress.current;
    if (!expanded || saved?.documentKey !== documentKey) progress.current = null;
    if (article && saved?.documentKey === documentKey) {
      article.scrollTop = saved.fraction * (article.scrollHeight - article.clientHeight);
    }
  }, [documentKey, expanded]);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !dialog.current?.matches(":modal")) {
        event.preventDefault();
        location.hash = closeHref;
      }
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [closeHref]);
  return (
    <dialog
      ref={dialog}
      className="guide-dock"
      data-expanded={expanded}
      aria-labelledby="guide-title"
      onCancel={(e) => {
        e.preventDefault();
        if (expanded) toggleSize();
        else location.hash = closeHref;
      }}
    >
      <div className="dock-header">
        <h2 id="guide-title">
          <BookOpen size={18} />
          资料侧栏
        </h2>
        <div className="dock-actions">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={sizeLabel}
            title={sizeLabel}
            aria-pressed={expanded}
            onClick={toggleSize}
          >
            {expanded ? <Minimize2 /> : <Maximize2 />}
          </Button>
          <Button
            ref={closeRef}
            variant="ghost"
            size="icon-sm"
            aria-label="关闭资料侧栏"
            onClick={() => {
              location.hash = closeHref;
            }}
          >
            <X />
          </Button>
        </div>
      </div>
      <div className="dock-select">
        <label htmlFor="guide-document">阅读章节</label>
        <select
          id="guide-document"
          value={target.section}
          onChange={(e) => {
            location.hash = lessonHref(page, { section: e.target.value as Section });
          }}
        >
          {sections.map((s) => (
            <option key={s} value={s}>
              {labels[s]}
            </option>
          ))}
        </select>
      </div>
      {visible && (
        <LessonDocument
          key={target.section}
          documents={documents}
          target={target}
          page={page}
          side
        />
      )}
      <a
        className="open-chapter"
        href={lessonHref(isInteractive(target.section) ? { section: target.section } : target)}
      >
        <ExternalLink size={15} />
        {isInteractive(target.section) ? `前往${labels[target.section]}` : "在正文中阅读"}
      </a>
    </dialog>
  );
}
