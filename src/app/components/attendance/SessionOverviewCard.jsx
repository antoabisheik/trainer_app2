"use client";

import { useMemo, useState } from "react";

export default function SessionOverviewCard({ calendar, athletes }) {
  const [metric, setMetric] = useState("completion");

  const sortedAthletes = useMemo(() => {
    if (!athletes?.length) return [];
    return [...athletes]
      .sort((a, b) => (b.avgCompletionRate || 0) - (a.avgCompletionRate || 0))
      .slice(0, 10);
  }, [athletes]);

  const stats = useMemo(() => {
    const totalSessions = calendar?.reduce((sum, d) => sum + (d.count || 0), 0) || 0;
    const activeDays = calendar?.filter(d => d.count > 0).length || 0;
    const avgCompletion = athletes?.length
      ? Math.round(athletes.reduce((sum, a) => sum + (a.avgCompletionRate || 0), 0) / athletes.length)
      : 0;
    return { totalSessions, activeDays, avgCompletion };
  }, [calendar, athletes]);

  const maxSessions = Math.max(...(sortedAthletes.map(a => a.totalSessions || 0) || [1]), 1);

  // SVG Graph dimensions
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calculate points
  const getX = (i) => padding.left + (i / Math.max(sortedAthletes.length - 1, 1)) * graphWidth;
  const getY = (value, max) => padding.top + ((max - value) / max) * graphHeight;

  // Create path for completion rate
  const completionPath = sortedAthletes.length > 0
    ? sortedAthletes.map((a, i) => {
        const x = getX(i);
        const y = getY(a.avgCompletionRate || 0, 100);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ')
    : '';

  // Create area path
  const areaPath = completionPath
    ? `${completionPath} L ${getX(sortedAthletes.length - 1)} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`
    : '';

  // Sessions path
  const sessionsPath = sortedAthletes.length > 0
    ? sortedAthletes.map((a, i) => {
        const x = getX(i);
        const y = getY(a.totalSessions || 0, maxSessions);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ')
    : '';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
          <p className="text-xs text-gray-500">Athlete comparison by {metric === "completion" ? "completion rate" : "sessions"}</p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <span className="text-xl font-bold text-gray-900">{stats.totalSessions}</span>
            <span className="text-sm text-gray-500 ml-1">Sessions</span>
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <div>
            <span className="text-xl font-bold text-emerald-600">{stats.avgCompletion}%</span>
            <span className="text-sm text-gray-500 ml-1">Avg</span>
          </div>
        </div>
      </div>

      {/* Metric Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">{sortedAthletes.length} athletes</p>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {["completion", "sessions"].map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                metric === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {m === "completion" ? "Completion %" : "Sessions"}
            </button>
          ))}
        </div>
      </div>

      {/* Graph */}
      {sortedAthletes.length > 0 ? (
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '220px' }}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = metric === "completion"
                ? getY(val, 100)
                : getY((val / 100) * maxSessions, maxSessions);
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#9ca3af"
                  >
                    {metric === "completion" ? `${val}%` : Math.round((val / 100) * maxSessions)}
                  </text>
                </g>
              );
            })}

            {/* Average line */}
            {metric === "completion" && (
              <>
                <line
                  x1={padding.left}
                  y1={getY(stats.avgCompletion, 100)}
                  x2={width - padding.right}
                  y2={getY(stats.avgCompletion, 100)}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.6"
                />
                <text
                  x={width - padding.right + 5}
                  y={getY(stats.avgCompletion, 100) + 4}
                  fontSize="9"
                  fill="#10b981"
                >
                  avg
                </text>
              </>
            )}

            {/* Area fill */}
            {metric === "completion" && areaPath && (
              <path
                d={areaPath}
                fill="url(#areaGradient)"
                opacity="0.3"
              />
            )}

            {/* Line */}
            <path
              d={metric === "completion" ? completionPath : sessionsPath}
              fill="none"
              stroke={metric === "completion" ? "#10b981" : "#3b82f6"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {sortedAthletes.map((athlete, i) => {
              const x = getX(i);
              const y = metric === "completion"
                ? getY(athlete.avgCompletionRate || 0, 100)
                : getY(athlete.totalSessions || 0, maxSessions);
              const value = metric === "completion" ? athlete.avgCompletionRate || 0 : athlete.totalSessions || 0;
              const name = athlete.name || athlete.athleteName || `Athlete ${i + 1}`;

              return (
                <g key={i} className="group">
                  {/* Point */}
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill={metric === "completion"
                      ? value >= 80 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444"
                      : "#3b82f6"
                    }
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer transition-transform hover:scale-150"
                  />

                  {/* Athlete name below */}
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6b7280"
                    className="pointer-events-none"
                  >
                    {name.split(" ")[0].substring(0, 5)}
                  </text>

                  {/* Tooltip on hover */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <rect
                      x={x - 40}
                      y={y - 45}
                      width="80"
                      height="35"
                      rx="4"
                      fill="#1f2937"
                    />
                    <text x={x} y={y - 28} textAnchor="middle" fontSize="10" fill="white" fontWeight="500">
                      {name}
                    </text>
                    <text x={x} y={y - 15} textAnchor="middle" fontSize="10" fill="#9ca3af">
                      {metric === "completion" ? `${value}%` : `${value} sessions`}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p>No athlete data available</p>
        </div>
      )}

      {/* Legend */}
      {sortedAthletes.length > 0 && (
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {metric === "completion" ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>≥80% Good</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>50-79% Average</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>&lt;50% Needs attention</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-500 rounded" />
              <span>Total sessions per athlete</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
