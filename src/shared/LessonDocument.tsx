import { Link2 } from "lucide-react";
import type { MDXContent } from "mdx/types";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";
import { type Destination, lessonHref, type Section } from "./lesson-route";
export type LessonDocuments = Record<Section, MDXContent>;
const Place = createContext<{ page: Destination; target: Destination; side: boolean } | null>(null);
function usePlace() {
  const place = useContext(Place);
  if (!place) throw new Error("Missing lesson document");
  return place;
}
function Heading({ id, children }: { id: string; children: ReactNode }) {
  const { page, target, side } = usePlace();
  const dest = { section: target.section, anchor: id };
  return (
    <h2 id={`${side ? "guide" : "page"}-${target.section}-${id}`} data-anchor={id} tabIndex={-1}>
      {children}
      <a
        className="permalink"
        href={side ? lessonHref(page, dest) : lessonHref(dest)}
        aria-label={`定位到${children}`}
      >
        <Link2 size={14} />
      </a>
    </h2>
  );
}
function Jump({
  section,
  anchor,
  children,
}: {
  section: Section;
  anchor?: string;
  children: ReactNode;
}) {
  const { page, side } = usePlace();
  const dest = { section, anchor };
  return <a href={side ? lessonHref(page, dest) : lessonHref(dest)}>{children}</a>;
}
function Citation({ href, children, ...props }: ComponentProps<"a">) {
  const external = /^https?:\/\//.test(href ?? "");
  return (
    <a
      {...props}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
const components = { Heading, Jump, a: Citation };
export function LessonDocument({
  documents,
  target,
  page,
  side = false,
}: {
  documents: LessonDocuments;
  target: Destination;
  page: Destination;
  side?: boolean;
}) {
  const node = useRef<HTMLElement>(null);
  const Content = documents[target.section];
  useLayoutEffect(() => {
    const article = node.current;
    if (!article) return;
    if (!target.anchor) {
      if (side) article.scrollTop = 0;
      return;
    }
    const heading = article.querySelector<HTMLElement>(
      `[data-anchor="${CSS.escape(target.anchor)}"]`,
    );
    if (!heading) return;
    heading.focus({ preventScroll: true });
    if (side)
      article.scrollTop +=
        heading.getBoundingClientRect().top - article.getBoundingClientRect().top - 18;
    else heading.scrollIntoView({ block: "start" });
  }, [side, target.anchor]);
  return (
    <Place.Provider value={{ page, target, side }}>
      <article className="lesson-prose" ref={node}>
        <Content components={components} />
      </article>
    </Place.Provider>
  );
}
