import Experiment from "@experiment";
import { createRoot } from "react-dom/client";

const root = document.getElementById("root");
if (!root) throw new Error("Missing experiment root");
root.addEventListener("dragstart", (event) => {
  if (!(event.target instanceof Element && event.target.closest('[draggable="true"]'))) {
    event.preventDefault();
  }
});
createRoot(root).render(<Experiment />);
