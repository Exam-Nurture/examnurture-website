"use client";

import { FileText, Target, Layers, ListChecks } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BentoGrid, BentoCell } from "./BentoGrid";
import CommandDeck from "./CommandDeck";
import {
  StatWidget, TrendPanel, ActivityFeed, FocusPanel, SeriesRail, QuickLaunch,
  type StatSpec,
} from "./widgets";
import { useHubData } from "./useHubData";

export default function Overview() {
  const { user } = useAuth();
  const { loading, data, isDemo } = useHubData();

  const stats: StatSpec[] = [
    {
      key: "attempts",
      label: "Tests attempted",
      value: data.attempts,
      icon: <FileText size={16} />,
      tone: "blue",
      caption: data.attempts > 0 ? "Mocks, papers & quizzes" : "Nothing attempted yet",
      direction: data.attempts > 0 ? "up" : undefined,
      href: "/dashboard/series",
    },
    {
      key: "accuracy",
      label: "Average accuracy",
      value: data.accuracy,
      suffix: data.accuracy !== null ? "%" : undefined,
      icon: <Target size={16} />,
      tone: data.accuracy !== null && data.accuracy >= 70 ? "green" : "amber",
      caption: "Mean score across attempts",
      direction:
        data.accuracy === null ? undefined : data.accuracy >= 60 ? "up" : "down",
      lockedHint: "Finish a test",
    },
    {
      key: "pyq",
      label: "Papers solved",
      value: data.pyqAttended,
      icon: <Layers size={16} />,
      tone: "violet",
      caption: "Previous-year papers completed",
      direction: data.pyqAttended > 0 ? "up" : undefined,
      href: "/dashboard/pyq",
    },
    {
      key: "pending",
      label: "Pending today",
      value: data.pending,
      icon: <ListChecks size={16} />,
      tone: data.pending > 0 ? "amber" : "green",
      caption: data.pending > 0 ? "Tasks waiting for you" : "All caught up",
      direction: "flat",
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4">
      {isDemo && (
        <div
          className="flex items-center gap-2.5 rounded-full px-4 py-2 text-[11.5px] font-medium"
          style={{
            background: "var(--amber-soft)",
            color: "var(--amber)",
            border: "1px solid rgba(232,169,60,0.3)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--amber)" }} />
          Showing sample data — the dashboard API is unreachable right now.
        </div>
      )}

      <BentoGrid>
        {/* Hero: greeting + next action + consistency, in one dense unit */}
        <BentoCell span={12}>
          <CommandDeck
            name={user?.name ?? "Student"}
            target={data.resume}
            week={data.week}
            weekActiveDays={data.weekActiveDays}
            streak={data.streak}
            bestStreak={data.bestStreak}
            loading={loading}
          />
        </BentoCell>

        {/* Metric row */}
        {stats.map((spec) => (
          <BentoCell key={spec.key} span={3} tablet={3}>
            <StatWidget spec={spec} loading={loading} />
          </BentoCell>
        ))}

        {/* Asymmetric analysis row */}
        <BentoCell span={7}>
          <TrendPanel trend={data.trend} accuracy={data.accuracy} loading={loading} />
        </BentoCell>
        <BentoCell span={5}>
          <ActivityFeed items={data.activity} loading={loading} />
        </BentoCell>

        {/* Library + focus, mirrored asymmetry */}
        <BentoCell span={8}>
          <SeriesRail series={data.series} loading={loading} />
        </BentoCell>
        <BentoCell span={4}>
          <FocusPanel topics={data.weakTopics} loading={loading} />
        </BentoCell>

        <BentoCell span={12}>
          <QuickLaunch />
        </BentoCell>
      </BentoGrid>
    </div>
  );
}
