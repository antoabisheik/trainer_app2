"use client";

import { useMemo, useState } from "react";

export default function AttendanceHeatmapCard({ data, onDateClick, range }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const { weeks, months, totalSessions, activeDays, maxCount } = useMemo(() => {
    const calendar = data?.calendar || [];
    const dateMap = {};
    calendar.forEach(d => { dateMap[d.date] = d.count || 0; });

    const max = Math.max(...calendar.map(d => d.count || 0), 1);
    const total = calendar.reduce((sum, d) => sum + (d.count || 0), 0);
    const active = calendar.filter(d => d.count > 0).length;

    // Calculate date range
    const end = new Date();
    const start = new Date();
    if (range === "7d") start.setDate(start.getDate() - 28);
    else if (range === "30d") start.setDate(start.getDate() - 60);
    else start.setDate(start.getDate() - 120);

    // Build weeks array and track months
    const weeksArr = [];
    const monthsArr = [];
    const current = new Date(start);
    current.setDate(current.getDate() - current.getDay()); // Align to Sunday

    let lastMonth = -1;

    while (current <= end) {
      const week = [];

      for (let i = 0; i < 7; i++) {
        const dateStr = current.toISOString().split("T")[0];
        const month = current.getMonth();

        // Track month changes
        if (month !== lastMonth && i === 0) {
          monthsArr.push({
            name: current.toLocaleString('default', { month: 'short' }),
            weekIndex: weeksArr.length
          });
          lastMonth = month;
        }

        week.push({
          date: dateStr,
          count: dateMap[dateStr] || 0,
          inRange: current >= start && current <= end,
          isToday: dateStr === new Date().toISOString().split("T")[0]
        });
        current.setDate(current.getDate() + 1);
      }
      weeksArr.push(week);
    }

    return { weeks: weeksArr, months: monthsArr, totalSessions: total, activeDays: active, maxCount: max };
  }, [data, range]);

  const getColor = (count) => {
    if (!count) return "bg-gray-200";
    const ratio = count / maxCount;
    if (ratio >= 0.75) return "bg-emerald-600";
    if (ratio >= 0.5) return "bg-emerald-500";
    if (ratio >= 0.25) return "bg-emerald-400";
    return "bg-emerald-300";
  };

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-full">
      {/* Stats Row */}
      <div className="flex items-center gap-6 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{totalSessions}</span>
          <span className="text-sm text-gray-500">Sessions</span>
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{activeDays}</span>
          <span className="text-sm text-gray-500">Active days</span>
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-emerald-600">{range}</span>
          <span className="text-sm text-gray-500">Period</span>
        </div>
      </div>

      {/* Month Labels */}
      <div className="flex mb-1 ml-8">
        {months.map((month, i) => {
          const nextMonth = months[i + 1];
          const width = nextMonth
            ? (nextMonth.weekIndex - month.weekIndex) * 18
            : (weeks.length - month.weekIndex) * 18;
          return (
            <div
              key={i}
              className="text-xs text-gray-500"
              style={{ width: `${width}px` }}
            >
              {month.name}
            </div>
          );
        })}
      </div>

      {/* Heatmap Grid */}
      <div className="flex">
        {/* Day Labels */}
        <div className="flex flex-col gap-1 mr-2">
          {dayLabels.map((day, i) => (
            <div key={i} className="h-4 w-4 flex items-center justify-center text-xs text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks Grid */}
        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-4 h-4 rounded-md transition-all ${
                    day.inRange ? getColor(day.count) : "bg-gray-100"
                  } ${day.isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""} ${
                    day.inRange && day.count > 0 ? "cursor-pointer hover:scale-110" : ""
                  }`}
                  onClick={() => day.inRange && day.count > 0 && onDateClick(day.date)}
                  onMouseEnter={() => day.inRange && setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        {/* Hover Info */}
        <p className="text-sm text-gray-600">
          {hoveredDay ? (
            <>
              <span className="font-medium">{hoveredDay.date}</span>
              <span className="mx-2">·</span>
              <span className={hoveredDay.count > 0 ? "text-emerald-600 font-medium" : ""}>
                {hoveredDay.count} session{hoveredDay.count !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <span className="text-gray-400">Hover over a day</span>
          )}
        </p>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>No activity</span>
          <div className="w-3 h-3 bg-gray-200 rounded" />
          <span className="ml-2">Less</span>
          <div className="flex gap-0.5">
            {["bg-emerald-300", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600"].map((c, i) => (
              <div key={i} className={`w-3 h-3 ${c} rounded`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
