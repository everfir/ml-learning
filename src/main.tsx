import { createRoot } from "react-dom/client";

const root = document.getElementById("root");
if (!root) throw new Error("Missing experiment root");
root.addEventListener("dragstart", (event) => {
  if (!(event.target instanceof Element && event.target.closest('[draggable="true"]'))) {
    event.preventDefault();
  }
});
const app = createRoot(root);
void import("@experiment").then(({ default: Experiment }) => app.render(<Experiment />));

if (__PAGES_BUILD__ && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((error: unknown) => {
    console.warn("课程离线缓存未能启用", error);
  });
}
