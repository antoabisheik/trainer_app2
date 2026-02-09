"use client";

import { Badge } from "@tremor/react";
import { X, Calendar, Users } from "lucide-react";

// Stat box - Emerald theme with larger fonts
function StatBox({ value, label, variant = "default" }) {
  const variants = {
    default: "bg-gray-50 text-gray-600",
    primary: "bg-emerald-50 text-emerald-600",
    muted: "bg-gray-100 text-gray-400",
  };

  return (
    <div className={`text-center p-3 rounded-xl ${variants[variant]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// Athlete row - Emerald theme with larger fonts
function AthleteRow({ athlete, index }) {
  const displayName = athlete.name || `Athlete ${index + 1}`;
  const rate = athlete.completionRate || 0;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 bg-emerald-50/50 rounded-lg text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 bg-emerald-100 text-emerald-700">
          {displayName[0]?.toUpperCase() || "A"}
        </div>
        <span className="text-gray-700 truncate">{displayName}</span>
      </div>
      <span className="font-semibold shrink-0 text-emerald-600">{rate}%</span>
    </div>
  );
}

export default function DateDetailCard({ date, data, loading, onClose }) {
  if (!date) return null;

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const present = data?.summary?.present || 0;
  const absent = data?.summary?.absent || 0;
  const total = present + absent;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-96 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-emerald-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Details for</p>
            <h3 className="text-base font-semibold text-gray-900">{formattedDate}</h3>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBox value={present} label="Present" variant="primary" />
            <StatBox value={absent} label="Absent" variant="muted" />
            <StatBox value={`${attendanceRate}%`} label="Rate" variant="primary" />
          </div>

          {/* Athletes list */}
          {data?.present?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">Present Athletes</h4>
                <Badge size="sm" color="emerald">{data.present.length}</Badge>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {data.present.map((athlete, i) => (
                  <AthleteRow key={athlete.id} athlete={athlete} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* No data state */}
          {!data?.present?.length && !loading && (
            <div className="text-center py-6 text-gray-400">
              <div className="p-3 bg-emerald-50 rounded-full inline-block mb-2">
                <Users className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-sm">No attendance data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
