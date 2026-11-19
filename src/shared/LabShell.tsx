import {
  BookMarked,
  BookOpen,
  FolderClock,
  HardDrive,
  LibraryBig,
  PanelsTopLeft,
  ScrollText,
} from "lucide-react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import mark from "./assets/gradient-mark.png";
import { GuidePanel } from "./GuidePanel";
import { LessonDocument, type LessonDocuments } from "./LessonDocument";
import { isInteractive, labels, lessonHref, parseRoute, sections } from "./lesson-route";
import { Button } from "./ui/button";

const icons = {
  introduction: BookMarked,
  theory: ScrollText,
  workbench: PanelsTopLeft,
  records: FolderClock,
  appendix: LibraryBig,
};
function subscribe(fn: () => void) {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
}
function getHash() {
  return location.hash;
}

function followLessonLink(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  const hash = link?.getAttribute("href");
  if (
    !hash?.startsWith(`#/${__EXPERIMENT_ID__}/`) ||
    link?.hasAttribute("target") ||
    link?.hasAttribute("download")
  )
    return;

  // In srcdoc, a relative href can resolve against the preview host's URL.
  event.preventDefault();
  window.location.hash = hash;
}

interface ShellProps {
  title: string;
  description: string;
  code: string;
  topic: string;
  documents: LessonDocuments;
  workbench: ReactNode;
  records: ReactNode;
  action?: ReactNode;
  recordCount?: number;
  notice?: string;
}
export function LabShell({
  title,
  description,
  code,
  topic,
  documents,
  workbench,
  records,
  action,
  recordCount,
  notice,
}: ShellProps) {
  const hash = useSyncExternalStore(subscribe, getHash);
  const { page, guide } = parseRoute(hash, __EXPERIMENT_ID__);
  const section = page.section;
  const interactive = isInteractive(section);
  const previous = useRef(section);
  useEffect(() => {
    document.addEventListener("click", followLessonLink);
    return () => document.removeEventListener("click", followLessonLink);
  }, []);
  useLayoutEffect(() => {
    if (previous.current !== section && !page.anchor) window.scrollTo(0, 0);
    previous.current = section;
  }, [section, page.anchor]);
  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) favicon.href = mark;
    document.title = `${title} · ${labels[section]}`;
  }, [title, section]);
  const doc = <LessonDocument key={section} documents={documents} page={page} target={page} />;
  return (
    <>
      <main className={guide ? "course-floor reading-open" : "course-floor"}>
        <div className="shell course-main">
          <header className="lesson-intro">
            <div className="intro-meta">
              <div className="eyebrow">
                <img src={mark} width="16" height="16" alt="" /> EXPERIMENT {code}
                <span />
                {topic}
              </div>
              <span className="local-mode">
                <HardDrive size={14} />
                本地运行
              </span>
            </div>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          <div className="chapter-bar">
            <nav className="chapters" aria-label="课程章节">
              {sections.map((s) => {
                const Icon = icons[s];
                return (
                  <a
                    key={s}
                    aria-current={s === section ? "page" : undefined}
                    href={lessonHref({ section: s }, guide)}
                  >
                    <Icon size={16} />
                    {labels[s]}
                    {s === "records" && recordCount !== undefined && (
                      <span className="count">{recordCount}</span>
                    )}
                  </a>
                );
              })}
            </nav>
            <div className="chapter-actions">
              <Button
                variant="outline"
                aria-expanded={!!guide}
                onClick={() => {
                  location.hash = guide ? lessonHref(page) : lessonHref(page, page);
                }}
              >
                <BookOpen />
                翻阅资料
              </Button>
              {section === "workbench" && action}
            </div>
          </div>
          {interactive ? (
            section === "workbench" ? (
              workbench
            ) : (
              records
            )
          ) : (
            <div className="reading-page">{doc}</div>
          )}
          {notice && interactive && (
            <p className="save-status" role="status">
              {notice}
            </p>
          )}
        </div>
      </main>
      <footer className="page-footer">
        <div className="shell footer-inner">
          <span>
            梯度实验室 <small>Gradient Lab</small>
          </span>
          <span>
            {topic} / EXPERIMENT {code}
          </span>
        </div>
      </footer>
      {guide && <GuidePanel page={page} target={guide} documents={documents} />}
    </>
  );
}
