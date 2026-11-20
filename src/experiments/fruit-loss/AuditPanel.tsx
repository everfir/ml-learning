import { useMemo } from "react";
import { TrayAudit } from "@/shared/fruit/TrayAudit";
import { audit, type Draft, inspect } from "./model";

type Props = {
  seed: number;
  version: Draft["version"];
  weight: number;
  animate: boolean;
  again: () => void;
  unlock: () => void;
};
export function AuditPanel({ seed, version, weight, ...actions }: Props) {
  const fruit = useMemo(() => audit(seed, version), [seed, version]);
  return (
    <TrayAudit
      {...actions}
      fruit={fruit}
      predictsGift={(f) => inspect(weight, f).gift}
      heading={version === 1 ? "旧版验收" : "新果验收"}
      summary={`锁定权重 ${weight.toFixed(2)}`}
    />
  );
}
