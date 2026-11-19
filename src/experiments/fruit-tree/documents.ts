import type { LessonDocuments } from "@/shared/LessonDocument";
import appendix from "./appendix.mdx";
import introduction from "./introduction.mdx";
import records from "./records.mdx";
import theory from "./theory.mdx";
import workbench from "./workbench.mdx";

export const documents = {
  introduction,
  theory,
  workbench,
  records,
  appendix,
} satisfies LessonDocuments;
