"use client";

import { useMemo } from "react";
import { Badge } from "@tremor/react";
import { Activity, TrendingUp, Calendar, Zap } from "lucide-react";

// Metric item - Emerald theme with larger fonts
function MetricItem({ icon: Icon, label, value, subtext }) {
  return (
    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-emerald-600" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
  );
}

export default function SessionOverviewCard({ summary, calendar }) {
  const avgDaily = useMemo(() => {
    if (!calendar?.length) return 0;
    const total = calendar.reduce((sum, d) => sum + (d.count || 0), 0);
    return (total / calendar.length).toFixed(1);
  }, [calendar]);

  const peakDay = useMemo(() => {
    if (!calendar?.length) return null;
    const max = calendar.reduce((a, b) => (a.count > b.count ? a : b));
    return {
      date: new Date(max.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      count: max.count,
    };
  }, [calendar]);

  const totalDays = useMemo(() => {
    if (!calendar?.length) return 0;
    return calendar.filter(d => d.count > 0).length;
  }, [calendar]);

  const avgPerAthlete = useMemo(() => {
    if (!summary?.totalAthletes || !summary?.totalSessions) return 0;
    return (summary.totalSessions / summary.totalAthletes).toFixed(1);
  }, [summary]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-96 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Session Overview</h3>
        </div>
        <Badge size="sm" color="emerald">Stats</Badge>
      </div>

      {/* Metrics grid */}
      <div className="flex-1 p-5">
        <div className="grid grid-cols-2 gap-3">
          <MetricItem icon={Activity} label="Avg Daily" value={avgDaily} subtext="sessions/day" />
          <MetricItem icon={TrendingUp} label="Peak Day" value={peakDay?.count || 0} subtext={peakDay?.date || "N/A"} />
          <MetricItem icon={Calendar} label="Active Days" value={totalDays} subtext="with sessions" />
          <MetricItem icon={Zap} label="Per Athlete" value={avgPerAthlete} subtext="avg sessions" />
        </div>

        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalSessions || 0}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{summary?.activeAthletes || 0}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400">{summary?.inactiveAthletes || 0}</p>
              <p className="text-sm text-gray-500">Inactive</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
