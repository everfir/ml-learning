import { BookOpen, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { CSSProperties } from "react";
import { guideHref } from "@/shared/lesson-route";
import { Button } from "@/shared/ui/button";
import { defaults, fixed, functions, type Parameters } from "./model";

const fields = [
  ["x", "输入"],
  ["w", "权重"],
  ["b", "偏置"],
] as const;
export function Controls({ p, change }: { p: Parameters; change: (p: Parameters) => void }) {
  return (
    <section className="panel control-panel" aria-label="参数控制">
      <div className="panel-heading">
        <h2>
          <SlidersHorizontal />
          参数控制
        </h2>
        <Button variant="ghost" size="sm" onClick={() => change({ ...defaults })}>
          <RotateCcw />
          重置
        </Button>
      </div>
      <div className="controls-body">
        <fieldset>
          <legend>
            激活函数{" "}
            <a
              className="read-link"
              aria-label="阅读激活函数讲解"
              href={guideHref("theory", "activation")}
            >
              <BookOpen size={14} />
            </a>
          </legend>
          <div className="fn-options">
            {functions.map((fn) => (
              <button
                type="button"
                key={fn}
                aria-pressed={p.activation === fn}
                onClick={() => change({ ...p, activation: fn })}
              >
                {fn}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="sliders">
          {fields.map(([key, label]) => (
            <div key={key} className="slider-row">
              <div className="slider-label">
                <label htmlFor={key}>
                  {label} <em>{key}</em>
                </label>
                <a
                  className="read-link"
                  aria-label={`阅读${label}讲解`}
                  href={guideHref("theory", "weights")}
                >
                  <BookOpen size={13} />
                </a>
                <output htmlFor={key}>{fixed(p[key])}</output>
              </div>
              <input
                id={key}
                type="range"
                min="-4"
                max="4"
                step=".05"
                value={p[key]}
                style={{ "--progress": `${((p[key] + 4) / 8) * 100}%` } as CSSProperties}
                onChange={(e) => change({ ...p, [key]: e.currentTarget.valueAsNumber })}
              />
              <div className="range-ends">
                <span>−4</span>
                <span>+4</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
