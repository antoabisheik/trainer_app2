"use client";

import { useMemo } from "react";
import { ProgressBar, Badge } from "@tremor/react";
import { Award } from "lucide-react";

// Single athlete row - Emerald theme with larger fonts
function AthleteRow({ athlete, rank }) {
  const rate = athlete.avgCompletionRate || 0;
  const displayName = athlete.name || `Athlete ${rank}`;

  const getIntensity = (rate) => {
    if (rate >= 80) return { bg: "bg-emerald-100", text: "text-emerald-700" };
    if (rate >= 50) return { bg: "bg-emerald-50", text: "text-emerald-600" };
    return { bg: "bg-gray-100", text: "text-gray-600" };
  };

  const intensity = getIntensity(rate);

  return (
    <div className="flex items-center gap-3 p-2.5 hover:bg-emerald-50/50 rounded-lg transition-colors">
      <span className="text-sm font-medium text-gray-400 w-6">#{rank}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 ${intensity.bg} ${intensity.text}`}>
        {displayName[0]?.toUpperCase() || "A"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-medium text-gray-900 text-sm truncate">{displayName}</span>
          <span className="text-sm font-semibold text-emerald-600 shrink-0">{rate}%</span>
        </div>
        <ProgressBar value={rate} color="emerald" className="h-1.5" />
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-96 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Leaderboard</h3>
            <p className="text-sm text-gray-500">By completion rate</p>
          </div>
        </div>
        <Badge size="sm" color="emerald">{athletes?.length || 0}</Badge>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3">
        {sortedAthletes.length > 0 ? (
          <div className="space-y-1">
            {sortedAthletes.map((athlete, i) => (
              <AthleteRow key={athlete.id} athlete={athlete} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No athletes found
          </div>
        )}
      </div>
    </div>
  );
}
