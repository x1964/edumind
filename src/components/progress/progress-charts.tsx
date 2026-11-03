"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppMessages } from "@/lib/i18n/app";

const TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  color: "#1a1a1a",
  fontSize: 12,
  boxShadow: "0 10px 30px -12px rgba(15,23,42,0.2)",
} as const;

const GRID = "#e5e7eb";
const TICK = "#6b7280";
const LABEL = "#4b5563";
const ACCENT = "#059669";

export function WeeklyStudyChart({
  data,
  dict,
}: {
  data: Array<{ label: string; minutes: number }>;
  dict: AppMessages;
}) {
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: TICK, fontSize: 10 }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: LABEL }}
            formatter={(value) => [
              `${value} ${dict.progress.minutesShort}`,
              dict.progress.weeklyMinutes,
            ]}
          />
          <Area
            type="monotone"
            dataKey="minutes"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#studyGradient)"
            dot={{ r: 2.5, fill: ACCENT, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QuizScoreChart({
  data,
  dict,
}: {
  data: Array<{ label: string; score: number }>;
  dict: AppMessages;
}) {
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: TICK, fontSize: 10 }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: TICK, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: LABEL }}
            formatter={(value) => [`${value}%`, dict.quizzes.score]}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={38}>
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.score >= 70 ? ACCENT : entry.score >= 40 ? "#ca8a04" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MaterialsTypeChart({ data }: { data: Array<{ label: string; count: number }> }) {
  const COLORS = ["#059669", "#0d9488", "#10b981"];
  return (
    <div className="h-48 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: TICK, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "#4b5563", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
