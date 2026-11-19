export const sections = ["introduction", "theory", "workbench", "records", "appendix"] as const;
export type Section = (typeof sections)[number];
export const labels: Record<Section, string> = {
  introduction: "前言",
  theory: "理论与概念",
  workbench: "实验工作台",
  records: "实验记录",
  appendix: "附录",
};
export type Destination = { section: Section; anchor?: string };
export type LessonRoute = { page: Destination; guide?: Destination };
const start: Destination = { section: "introduction" };
function destination(path: string): Destination | undefined {
  const [section, anchor, ...rest] = path.split("/");
  if (
    !sections.includes(section as Section) ||
    rest.length ||
    (anchor !== undefined && !/^[a-z][a-z0-9-]*$/.test(anchor))
  )
    return;
  return anchor ? { section: section as Section, anchor } : { section: section as Section };
}
export function isInteractive(section: Section) {
  return section === "workbench" || section === "records";
}
export function shortLessonHash(hash: string, id: string) {
  const legacyPrefix = `#/${id}/`;
  return hash.startsWith(legacyPrefix) ? `#/${hash.slice(legacyPrefix.length)}` : hash;
}
export function parseRoute(hash: string, id: string): LessonRoute {
  const [path, query] = shortLessonHash(hash, id).split("?");
  if (!path.startsWith("#/")) return { page: start };
  const page = destination(path.slice(2));
  if (!page) return { page: start };
  const guide = destination(new URLSearchParams(query).get("guide") ?? "");
  if (page.anchor && isInteractive(page.section)) {
    return { page: { section: page.section }, guide: guide ?? page };
  }
  return guide ? { page, guide } : { page };
}
function targetPath({ section, anchor }: Destination) {
  return anchor ? `${section}/${anchor}` : section;
}
export function lessonHref(page: Destination, guide?: Destination) {
  return `#/${targetPath(page)}${guide ? `?guide=${targetPath(guide)}` : ""}`;
}
export function guideHref(section: Section, anchor?: string) {
  return lessonHref(parseRoute(location.hash, __EXPERIMENT_ID__).page, { section, anchor });
}
