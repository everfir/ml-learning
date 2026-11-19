import { ArrowRight, BookOpen, ChartSpline } from "lucide-react";
import { useMemo, useState } from "react";
import { LinePlot } from "@/shared/charts/LinePlot";
import { guideHref } from "@/shared/lesson-route";
import { activate, fixed, formulas, forward, type Parameters } from "./model";
import { Surface } from "./Surface";
export function Response({ p }: { p: Parameters }) {
  const [view, setView] = useState<"curve" | "surface">("curve");
  const { z, a } = forward(p);
  const extent = Math.max(6, Math.ceil(Math.abs(z) / 3) * 3);
  const points = useMemo(
    () =>
      Array.from({ length: 241 }, (_, i) => {
        const v = extent * (i / 120 - 1);
        return { x: v, y: activate(p.activation, v) };
      }),
    [p.activation, extent],
  );
  const xTicks = Array.from({ length: 7 }, (_, i) => (extent * (i - 3)) / 3);
  const yTicks =
    p.activation === "Sigmoid"
      ? [0, 0.25, 0.5, 0.75, 1]
      : p.activation === "Tanh"
        ? [-1, -0.5, 0, 0.5, 1]
        : p.activation === "Linear"
          ? xTicks
          : [0, extent / 3, (2 * extent) / 3, extent];
  return (
    <section className="panel response-panel">
      <div className="panel-heading">
        <h2>
          <ChartSpline />
          激活响应{" "}
          <a
            className="read-link"
            aria-label={view === "curve" ? "阅读曲线讲解" : "阅读曲面讲解"}
            href={guideHref("workbench", view === "curve" ? "response" : "surface")}
          >
            <BookOpen size={14} />
          </a>
        </h2>
        <fieldset className="view-switch" aria-label="响应视图">
          {(["curve", "surface"] as const).map((v) => (
            <button type="button" key={v} aria-pressed={v === view} onClick={() => setView(v)}>
              {v === "curve" ? "响应曲线" : "参数曲面"}
            </button>
          ))}
        </fieldset>
      </div>
      <div className="plot-meta">
        <span>{view === "curve" ? "激活输出 a" : "输出高度 a"}</span>
        <span className="legend">
          <i />
          {p.activation}
        </span>
      </div>
      {view === "curve" ? (
        <div className="plot-body">
          <LinePlot
            points={points}
            current={{ x: z, y: a }}
            description={`${p.activation} 曲线，加权输入 ${fixed(z)}，输出 ${fixed(a, 3)}`}
            xTicks={xTicks}
            yTicks={yTicks}
            name={p.activation}
          />
          <div className="plot-x">
            加权输入 <em>z</em>
          </div>
        </div>
      ) : (
        <Surface p={p} />
      )}
      <div className="results">
        <div>
          <span>
            加权输入 <i>z</i>
          </span>
          <strong>{fixed(z)}</strong>
          <small>
            {fixed(p.w)} × {fixed(p.x)} {p.b < 0 ? "−" : "+"} {fixed(Math.abs(p.b))}
          </small>
        </div>
        <ArrowRight className="result-sign" aria-hidden="true" />
        <div>
          <span>
            激活输出 <i>a</i>
            <a
              className="read-link"
              aria-label="阅读计算结果讲解"
              href={guideHref("workbench", "result")}
            >
              <BookOpen size={13} />
            </a>
          </span>
          <strong className="accent-output">{fixed(a, 3)}</strong>
          <small>
            {p.activation}(z) = {formulas[p.activation]}
          </small>
        </div>
      </div>
    </section>
  );
}
