import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "../ui/chart";

interface Props {
  points: { x: number; y: number }[];
  current?: { x: number; y: number };
  description: string;
  xTicks: number[];
  yTicks: number[];
  name: string;
}
export function LinePlot({ points, current, description, xTicks, yTicks, name }: Props) {
  const fillId = useId();
  return (
    <ChartContainer
      config={{ series: { label: name, color: "var(--signal)" } }}
      className="function-plot"
      aria-label={description}
    >
      <AreaChart
        data={points}
        margin={{ left: 8, right: 18, top: 12, bottom: 4 }}
        accessibilityLayer
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.14} />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity={0.015} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="var(--grid)" />
        <XAxis
          dataKey="x"
          type="number"
          ticks={xTicks}
          domain={[xTicks[0], xTicks.at(-1) as number]}
          axisLine={false}
          tickLine={false}
          tickMargin={9}
          height={33}
        />
        <YAxis
          type="number"
          ticks={yTicks}
          domain={[yTicks[0], yTicks.at(-1) as number]}
          axisLine={false}
          tickLine={false}
          width={40}
          tickMargin={9}
        />
        <ReferenceLine x={0} stroke="#b7bfc5" />
        <ReferenceLine y={0} stroke="#b7bfc5" />
        <Area
          type="linear"
          dataKey="y"
          stroke="var(--color-series)"
          strokeWidth={3}
          fill={`url(#${fillId})`}
          isAnimationActive={false}
        />
        {current && (
          <ReferenceLine
            x={current.x}
            stroke="var(--signal)"
            strokeOpacity={0.7}
            strokeDasharray="4 4"
          />
        )}
        {current && (
          <ReferenceDot
            x={current.x}
            y={current.y}
            r={8}
            stroke="none"
            fill="var(--signal)"
            fillOpacity={0.18}
          />
        )}
        {current && (
          <ReferenceDot
            x={current.x}
            y={current.y}
            r={4.5}
            stroke="white"
            strokeWidth={2}
            fill="var(--signal)"
          />
        )}
      </AreaChart>
    </ChartContainer>
  );
}
