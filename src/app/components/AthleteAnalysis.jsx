"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiChevronDown, FiChevronUp, FiActivity, FiTarget, FiTrendingUp,
  FiUser, FiCalendar, FiArrowUp, FiArrowDown, FiChevronLeft, FiChevronRight,
  FiZap, FiPercent, FiSearch,
} from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Mini Sparkline Component
function Sparkline({ data, color = "#10b981", height = 36, width = 90 }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Metric Card
function MetricCard({ title, value, previousValue, unit = "", sparklineData, icon: Icon }) {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  const numPrev = typeof previousValue === "string" ? parseFloat(previousValue) : previousValue;

  const change = numPrev && numPrev > 0 ? ((numValue - numPrev) / numPrev * 100).toFixed(1) : null;
  const isPositive = change && parseFloat(change) > 0;
  const isNegative = change && parseFloat(change) < 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-emerald-600" />
            </div>
          )}
          <span className="text-sm text-gray-500">{title}</span>
        </div>
        {change && (
          <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
            isPositive ? "bg-emerald-100 text-emerald-700" :
            isNegative ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
          }`}>
            {isPositive ? <FiArrowUp className="w-3 h-3" /> : isNegative ? <FiArrowDown className="w-3 h-3" /> : null}
            {isPositive ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900">
          {typeof value === "number" ? value.toLocaleString() : value}
          {unit && <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>}
        </p>
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} color="#10b981" height={32} width={70} />
        )}
      </div>
    </div>
  );
}

// Radar Chart for Muscle Distribution
function RadarChart({ data, size = 220 }) {
  const center = size / 2;
  const radius = size / 2 - 35;

  const muscleGroups = ["Arms", "Chest", "Legs", "Back", "Shoulders", "Core"];
  const angleStep = (2 * Math.PI) / muscleGroups.length;

  const values = muscleGroups.map((muscle) => {
    const found = data.find((d) => d.muscleName === muscle);
    return found ? found.percentage : 0;
  });

  const maxValue = Math.max(...values, 1);

  const points = values.map((value, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} className="mx-auto">
      {gridLevels.map((level) => (
        <circle key={level} cx={center} cy={center} r={radius * level} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {muscleGroups.map((muscle, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);
        const labelX = center + (radius + 20) * Math.cos(angle);
        const labelY = center + (radius + 20) * Math.sin(angle);
        const value = values[i];
        return (
          <g key={muscle}>
            <line x1={center} y1={center} x2={x2} y2={y2} stroke="#e5e7eb" strokeWidth="1" />
            <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-500 font-medium">
              {muscle}
            </text>
            {value > 0 && (
              <text x={labelX} y={labelY + 14} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-emerald-600 font-bold">
                {value.toFixed(0)}%
              </text>
            )}
          </g>
        );
      })}
      <path d={polygonPath} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
      ))}
    </svg>
  );
}

// Timeline Chart
function TimelineChart({ data, height = 160 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  if (!data || data.length === 0) return null;

  const maxReps = Math.max(...data.map(d => d.totalReps || 0));
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 500;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (i) => padding.left + (i / (data.length - 1)) * chartWidth;
  const getY = (value) => padding.top + chartHeight - (value / (maxReps || 1)) * chartHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.totalReps || 0)}`).join(" ");
  const areaPath = linePath + ` L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {[0, 0.5, 1].map((pct) => (
          <line key={pct} x1={padding.left} y1={padding.top + chartHeight * (1 - pct)} x2={width - padding.right} y2={padding.top + chartHeight * (1 - pct)} stroke="#f3f4f6" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#greenGradient)" />
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={getX(i)} cy={getY(d.totalReps || 0)} r={hoveredIndex === i ? 6 : 4} fill="#10b981" stroke="white" strokeWidth="2" className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} />
        ))}
        {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d) => {
          const originalIndex = data.indexOf(d);
          return (
            <text key={originalIndex} x={getX(originalIndex)} y={height - 6} textAnchor="middle" className="text-xs fill-gray-400">
              {d.date?.slice(5) || ""}
            </text>
          );
        })}
        <defs>
          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none z-10" style={{ left: `${(hoveredIndex / (data.length - 1)) * 100}%`, top: "0", transform: "translateX(-50%)" }}>
          <p className="font-medium">{data[hoveredIndex].date}</p>
          <p>{data[hoveredIndex].totalReps} reps · {data[hoveredIndex].completionRate?.toFixed(0)}%</p>
        </div>
      )}
    </div>
  );
}

// Muscle Accordion
function MuscleAccordion({ muscle, exercises }) {
  const [open, setOpen] = useState(false);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.totalSets, 0);
  const totalReps = exercises.reduce((sum, ex) => sum + ex.totalReps, 0);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-medium text-base text-gray-800">{muscle}</span>
          <span className="text-xs text-gray-400">{exercises.length} exercises</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-emerald-600 font-medium">{totalSets}s / {totalReps}r</span>
          {open ? <FiChevronUp className="text-gray-400 w-4 h-4" /> : <FiChevronDown className="text-gray-400 w-4 h-4" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {exercises.map((ex, i) => {
            const maxSets = Math.max(...exercises.map((e) => e.totalSets));
            const barWidth = (ex.totalSets / maxSets) * 100;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{ex.name}</span>
                    <span className="text-gray-400">{ex.totalSets}s / {ex.totalReps}r</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Athlete Row Component
function AthleteRow({ athlete, onClick }) {
  return (
    <tr onClick={onClick} className="hover:bg-gray-50 transition cursor-pointer">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <FiUser className="text-emerald-600 text-base" />
          </div>
          <div>
            <span className="font-medium text-gray-900 text-base block">{athlete.name || "Unnamed"}</span>
            <span className="text-sm text-gray-400">{athlete.email}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
          {athlete.batch || "General"}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <FiChevronRight className="text-gray-400 inline w-5 h-5" />
      </td>
    </tr>
  );
}

// Athletes List View
function AthletesListView({ athletes, loading, searchTerm, setSearchTerm, onSelectAthlete, range, setRange }) {
  const ranges = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
    { value: "all", label: "All" },
  ];

  const filteredAthletes = athletes.filter((a) =>
    (a.name || a.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Athlete Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Select an athlete to view training insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
            <FiCalendar className="ml-3 text-gray-400 w-4 h-4" />
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  range === r.value ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search athletes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Athletes Table */}
      {loading ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAthletes.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-200">
          <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-base">{searchTerm ? "No athletes found" : "No athletes assigned"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Athlete</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Batch</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAthletes.map((athlete) => (
                <AthleteRow key={athlete.id} athlete={athlete} onClick={() => onSelectAthlete(athlete)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Analytics Detail View
function AnalyticsDetailView({ athlete, analytics, loading, error, range, setRange, onBack }) {
  const ranges = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
    { value: "all", label: "All" },
  ];

  const comparisonMetrics = useMemo(() => {
    if (!analytics?.intensityTimeline || analytics.intensityTimeline.length < 2) {
      return { current: {}, previous: {}, sparklines: {} };
    }

    const timeline = analytics.intensityTimeline;
    const midPoint = Math.floor(timeline.length / 2);
    const firstHalf = timeline.slice(0, midPoint);
    const secondHalf = timeline.slice(midPoint);

    const calcAvg = (arr, key) => arr.length > 0 ? arr.reduce((sum, d) => sum + (d[key] || 0), 0) / arr.length : 0;
    const calcSum = (arr, key) => arr.reduce((sum, d) => sum + (d[key] || 0), 0);

    return {
      current: {
        sessions: secondHalf.length,
        reps: calcSum(secondHalf, "totalReps"),
        completion: calcAvg(secondHalf, "completionRate"),
        exercises: calcSum(secondHalf, "exerciseCount"),
      },
      previous: {
        sessions: firstHalf.length,
        reps: calcSum(firstHalf, "totalReps"),
        completion: calcAvg(firstHalf, "completionRate"),
        exercises: calcSum(firstHalf, "exerciseCount"),
      },
      sparklines: {
        reps: timeline.map(d => d.totalReps),
        completion: timeline.map(d => d.completionRate),
        exercises: timeline.map(d => d.exerciseCount),
      },
    };
  }, [analytics]);

  const mostTrainedMuscle = useMemo(() => {
    if (!analytics || !analytics.muscleDistribution?.length) return null;
    return analytics.muscleDistribution[0];
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900">
          <FiChevronLeft className="w-5 h-5" /> Back to Athletes
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-base">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900">
          <FiChevronLeft className="w-5 h-5" /> Back to Athletes
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-base">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <FiChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <FiUser className="text-emerald-600 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{athlete.name || "Athlete"}</h1>
              <p className="text-sm text-gray-500">{athlete.batch || "General"} · {athlete.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
          <FiCalendar className="ml-3 text-gray-400 w-4 h-4" />
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                range === r.value ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Sessions" value={analytics.totalSessions} previousValue={comparisonMetrics.previous.sessions} sparklineData={comparisonMetrics.sparklines.exercises} icon={FiCalendar} />
        <MetricCard title="Reps Done" value={analytics.totalRepsCompleted || 0} previousValue={comparisonMetrics.previous.reps} sparklineData={comparisonMetrics.sparklines.reps} icon={FiZap} />
        <MetricCard title="Avg Completion" value={analytics.averageCompletionRate?.toFixed(1) || 0} unit="%" previousValue={comparisonMetrics.previous.completion?.toFixed(1)} sparklineData={comparisonMetrics.sparklines.completion} icon={FiPercent} />
        <MetricCard title="Exercises" value={analytics.totalExercises} previousValue={comparisonMetrics.previous.exercises} sparklineData={comparisonMetrics.sparklines.exercises} icon={FiActivity} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Muscle Focus */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Muscle Focus</h2>
            {mostTrainedMuscle && (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                Top: {mostTrainedMuscle.muscleName}
              </span>
            )}
          </div>
          <RadarChart data={analytics.muscleDistribution} size={200} />
          {analytics.topExercises?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">TOP EXERCISES</p>
              <div className="flex flex-wrap gap-1.5">
                {analytics.topExercises.slice(0, 4).map((ex, i) => (
                  <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                    {ex.name} ({ex.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Exercise Breakdown */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Exercise Breakdown</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {Object.entries(analytics.exercisesByMuscle || {}).map(([muscle, exercises]) => (
              <MuscleAccordion key={muscle} muscle={muscle} exercises={exercises} />
            ))}
            {Object.keys(analytics.exercisesByMuscle || {}).length === 0 && (
              <p className="text-gray-400 text-center py-8 text-base">No exercise data</p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {analytics.intensityTimeline?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Training Intensity</h2>
            <span className="text-sm text-gray-500">Reps per session</span>
          </div>
          <TimelineChart data={analytics.intensityTimeline} height={140} />
        </div>
      )}

      {/* Weekly Progress */}
      {analytics.weeklyProgress?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Weekly Progress</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {analytics.weeklyProgress.slice(-6).map((week) => {
              const weekDate = new Date(week.weekStart);
              return (
                <div key={week.weekStart} className="p-3 bg-emerald-50 rounded-xl text-center">
                  <p className="text-xs text-emerald-600 mb-1">
                    {weekDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{week.completedReps.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{week.sessions} sessions</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Focus Areas */}
      {analytics.incompleteExercises?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiTarget className="text-amber-500 w-5 h-5" />
            <h2 className="text-base font-semibold text-gray-900">Focus Areas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analytics.incompleteExercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 text-base">{ex.name}</p>
                  <p className="text-sm text-gray-500">{ex.muscle} · {ex.totalAttempts} attempts</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  ex.avgCompletionPct >= 80 ? "bg-emerald-100 text-emerald-700" :
                  ex.avgCompletionPct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                }`}>
                  {ex.avgCompletionPct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
export default function AthleteAnalysis({ jwtToken, athletes = [] }) {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [range, setRange] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!selectedAthlete || !jwtToken) return;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE}/trainer-app/analytics/${selectedAthlete.id}?range=${range}`,
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch analytics");

        const data = await res.json();
        if (data.success) {
          setAnalytics(data.data);
        } else {
          throw new Error(data.error || "Failed to fetch analytics");
        }
      } catch (err) {
        setError(err.message);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedAthlete, range, jwtToken]);

  const handleSelectAthlete = (athlete) => {
    setSelectedAthlete(athlete);
    setAnalytics(null);
    setError(null);
  };

  const handleBack = () => {
    setSelectedAthlete(null);
    setAnalytics(null);
    setError(null);
  };

  if (selectedAthlete) {
    return (
      <AnalyticsDetailView
        athlete={selectedAthlete}
        analytics={analytics}
        loading={loading}
        error={error}
        range={range}
        setRange={setRange}
        onBack={handleBack}
      />
    );
  }

  return (
    <AthletesListView
      athletes={athletes}
      loading={false}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      onSelectAthlete={handleSelectAthlete}
      range={range}
      setRange={setRange}
    />
  );
}
