"use client";

import { Flame } from "lucide-react";

// Streak Badge
function StreakBadge({ streak }) {
  if (!streak || streak === 0) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 text-sm font-medium rounded-lg border border-orange-100">
      <Flame className="w-4 h-4" />
      <span>{streak} day streak</span>
    </div>
  );
}

// Range Selector
function RangeSelector({ range, setRange, ranges }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => setRange(r.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            range === r.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export default function AttendanceHeader({ streak, range, setRange }) {
  const ranges = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Visual insights into athlete performance</p>
      </div>
      <div className="flex items-center gap-3">
        <StreakBadge streak={streak} />
        <RangeSelector range={range} setRange={setRange} ranges={ranges} />
      </div>
    </div>
  );
}
