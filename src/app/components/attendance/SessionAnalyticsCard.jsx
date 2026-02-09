"use client";

import { useMemo } from "react";
import { ProgressBar, Badge } from "@tremor/react";
import { Clock, AlertTriangle, CheckCircle, Target, Dumbbell } from "lucide-react";

// Card wrapper
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

// SVG Sparkline for drop-off visualization
function DropOffSparkline({ exercises }) {
  if (!exercises?.length) return null;

  const data = exercises.map(e => e.completionRate || 0);
  const max = 100;
  const width = 200;
  const height = 50;
  const padding = 4;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - (val / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  const areaPath = `M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
      <path d={areaPath} fill="url(#emeraldGradient)" opacity="0.3" />
      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((val, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
        const y = height - padding - (val / max) * (height - padding * 2);
        const isLow = val < 50;
        return (
          <circle key={i} cx={x} cy={y} r={isLow ? 5 : 4} fill={isLow ? "#f87171" : "#10b981"} stroke="white" strokeWidth="2" />
        );
      })}
      <defs>
        <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Session Duration Badge
function DurationBadge({ minutes }) {
  if (minutes === null || minutes === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Clock className="w-4 h-4" />
        <span>No duration data</span>
      </div>
    );
  }

  const isShort = minutes < 15;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
      isShort ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
    }`}>
      <Clock className="w-4 h-4" />
      <span>{minutes} min</span>
      {isShort && <AlertTriangle className="w-4 h-4" />}
    </div>
  );
}

// Adherence Score Circle
function AdherenceScore({ score, completed, total }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
          <circle cx="28" cy="28" r={radius} fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{score}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">Adherence</p>
        <p className="text-xs text-gray-500">{completed}/{total} done</p>
      </div>
    </div>
  );
}

// Exercise Progress Row
function ExerciseRow({ exercise }) {
  const isSkipped = exercise.skipped;
  const rate = exercise.completionRate || 0;

  return (
    <div className={`p-2.5 rounded-lg ${isSkipped ? "bg-red-50/50" : "bg-gray-50/50"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-400 w-5">#{exercise.order}</span>
          <span className={`text-sm font-medium truncate ${isSkipped ? "text-red-700" : "text-gray-900"}`}>{exercise.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">{exercise.muscle_name}</span>
          <span className={`text-sm font-semibold ${isSkipped ? "text-red-600" : "text-emerald-600"}`}>{exercise.current_reps}/{exercise.reps}</span>
        </div>
      </div>
      <ProgressBar value={rate} color={isSkipped ? "red" : "emerald"} className="h-1.5" />
    </div>
  );
}

// Skipped Exercises Alert
function SkippedAlert({ skippedExercises }) {
  if (!skippedExercises?.length) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">All exercises attempted</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-sm font-semibold text-red-700">{skippedExercises.length} Skipped</span>
      </div>
      <div className="space-y-1">
        {skippedExercises.slice(0, 2).map((e, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-red-600 truncate">{e.name}</span>
            <span className="text-red-400 shrink-0">{e.muscle_name}</span>
          </div>
        ))}
        {skippedExercises.length > 2 && <p className="text-xs text-red-400">+{skippedExercises.length - 2} more</p>}
      </div>
    </div>
  );
}

export default function SessionAnalyticsCard({ sessionData, loading }) {
  const analytics = useMemo(() => {
    if (!sessionData?.length) return null;
    const session = sessionData[0];

    return {
      athleteName: session.name || "Athlete",
      exercises: session.exercises || [],
      skippedExercises: session.skippedExercises || [],
      adherenceScore: session.adherenceScore || 0,
      completedExercises: session.completedExercises || 0,
      totalExercises: session.exerciseCount || 0,
      durationMinutes: session.durationMinutes,
      completionRate: session.completionRate || 0,
    };
  }, [sessionData]);

  if (loading) {
    return (
      <Card className="p-5 h-96 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading session data...</p>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-5 h-96 flex flex-col items-center justify-center">
        <div className="p-3 bg-emerald-50 rounded-full mb-3">
          <Dumbbell className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-base font-medium text-gray-600">No Session Selected</p>
        <p className="text-sm text-gray-400 mt-1">Click a date on the heatmap to view details</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 h-96 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Target className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Session Analytics</h3>
            <p className="text-sm text-gray-500">{analytics.athleteName}</p>
          </div>
        </div>
        <DurationBadge minutes={analytics.durationMinutes} />
      </div>

      {/* Adherence Score + Drop-off Chart */}
      <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
        <div className="p-3 bg-gray-50 rounded-xl">
          <AdherenceScore score={analytics.adherenceScore} completed={analytics.completedExercises} total={analytics.totalExercises} />
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-2">Completion Drop-off</p>
          <DropOffSparkline exercises={analytics.exercises} />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Start</span>
            <span>End</span>
          </div>
        </div>
      </div>

      {/* Skipped Alert */}
      <div className="mb-3 shrink-0">
        <SkippedAlert skippedExercises={analytics.skippedExercises} />
      </div>

      {/* Exercise Progress List */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h4 className="text-sm font-semibold text-gray-700">Exercise Progress</h4>
          <Badge size="sm" color="emerald">{analytics.totalExercises} total</Badge>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {analytics.exercises.map((exercise, i) => (
            <ExerciseRow key={i} exercise={exercise} />
          ))}
        </div>
      </div>
    </Card>
  );
}
