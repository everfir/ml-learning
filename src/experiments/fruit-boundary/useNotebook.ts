import { useLessonNotebook } from "@/shared/useLessonNotebook";
import { start, validDraft } from "./model";

export function useNotebook() {
  return useLessonNotebook(start, validDraft);
}
