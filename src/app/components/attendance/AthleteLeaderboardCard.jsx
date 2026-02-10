"use client";

import { useMemo } from "react";
import { Badge } from "@tremor/react";
import { Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Single athlete row with detailed stats
function AthleteRow({ athlete, rank }) {
  const rate = athlete.avgCompletionRate || 0;
  const sessions = athlete.totalSessions || 0;
  const displayName = athlete.name || `Athlete ${rank}`;

  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: "bg-amber-400", text: "text-amber-900", ring: "ring-amber-200" };
    if (rank === 2) return { bg: "bg-gray-300", text: "text-gray-700", ring: "ring-gray-200" };
    if (rank === 3) return { bg: "bg-amber-600", text: "text-amber-100", ring: "ring-amber-300" };
    return { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-100" };
  };

  const getPerformanceIcon = (rate) => {
    if (rate >= 80) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (rate >= 50) return <Minus className="w-4 h-4 text-amber-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const rankStyle = getRankStyle(rank);

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-emerald-50/50 rounded-xl transition-all hover:shadow-sm">
      {/* Rank */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${rankStyle.bg} ${rankStyle.text} ring-2 ${rankStyle.ring}`}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700 shrink-0">
        {displayName[0]?.toUpperCase() || "A"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 truncate">{displayName}</span>
          {getPerformanceIcon(rate)}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{sessions} sessions</span>
          <span>•</span>
          <span>{athlete.sessionDates?.length || 0} active days</span>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="text-right shrink-0">
        <p className={`text-2xl font-bold ${rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-red-500"}`}>
          {rate}%
        </p>
        <p className="text-xs text-gray-500">completion</p>
      </div>
    </div>
  );
}

export default function AthleteLeaderboardCard({ athletes }) {
  const sortedAthletes = useMemo(() => {
    if (!athletes?.length) return [];
    return [...athletes]
      .sort((a, b) => (b.avgCompletionRate || 0) - (a.avgCompletionRate || 0))
      .slice(0, 10);
  }, [athletes]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!athletes?.length) return { avg: 0, top: 0, low: 0 };
    const rates = athletes.map(a => a.avgCompletionRate || 0);
    return {
      avg: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
      top: Math.max(...rates),
      low: Math.min(...rates),
    };
  }, [athletes]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Athlete Leaderboard</h3>
            <p className="text-sm text-gray-500">Ranked by completion rate</p>
          </div>
        </div>
        <Badge size="sm" color="emerald">{athletes?.length || 0} athletes</Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{summaryStats.avg}%</p>
          <p className="text-xs text-gray-500">Avg Rate</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{summaryStats.top}%</p>
          <p className="text-xs text-gray-500">Highest</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-amber-600">{summaryStats.low}%</p>
          <p className="text-xs text-gray-500">Lowest</p>
        </div>
      </div>

      {/* Athlete List */}
      {sortedAthletes.length > 0 ? (
        <div className="space-y-3">
          {sortedAthletes.map((athlete, i) => (
            <AthleteRow key={athlete.id || i} athlete={athlete} rank={i + 1} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Award className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No athletes found</p>
        </div>
      )}
    </div>
  );
}
