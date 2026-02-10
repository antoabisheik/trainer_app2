"use client";

import { useMemo } from "react";

export default function TopPerformersCard({ athletes }) {
  const topAthletes = useMemo(() => {
    if (!athletes?.length) return [];
    return [...athletes]
      .sort((a, b) => (b.avgCompletionRate || 0) - (a.avgCompletionRate || 0))
      .slice(0, 5);
  }, [athletes]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
          <p className="text-xs text-gray-500">By completion rate</p>
        </div>
        <span className="text-xs text-gray-400">{athletes?.length || 0} total</span>
      </div>

      {topAthletes.length > 0 ? (
        <div className="space-y-3">
          {topAthletes.map((athlete, i) => {
            const rate = athlete.avgCompletionRate || 0;
            const name = athlete.name || athlete.athleteName || `Athlete ${i + 1}`;
            return (
              <div key={athlete.id || i} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-amber-100 text-amber-700" :
                  i === 1 ? "bg-gray-100 text-gray-600" :
                  i === 2 ? "bg-orange-50 text-orange-600" :
                  "bg-gray-50 text-gray-500"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400">{athlete.totalSessions || 0} sessions</p>
                </div>
                <span className={`text-sm font-semibold ${
                  rate >= 80 ? "text-emerald-600" :
                  rate >= 50 ? "text-amber-600" : "text-gray-500"
                }`}>
                  {rate}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-8">No athletes found</p>
      )}
    </div>
  );
}
