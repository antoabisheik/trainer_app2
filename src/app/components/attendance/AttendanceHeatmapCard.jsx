"use client";

import { useMemo } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { AreaChart } from "@tremor/react";
import { Badge } from "@tremor/react";

// Heatmap Component
function AttendanceHeatmap({ data, onDateClick }) {
  const calendarData = useMemo(() => {
    return data?.calendar?.map(d => ({ date: d.date, count: d.count })) || [];
  }, [data]);

  const maxCount = useMemo(() => {
    return Math.max(...calendarData.map(d => d.count || 0), 1);
  }, [calendarData]);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  return (
    <div className="flex-1">
      <style>{`
        .react-calendar-heatmap .color-empty { fill: #f3f4f6; }
        .react-calendar-heatmap .color-scale-1 { fill: #d1fae5; }
        .react-calendar-heatmap .color-scale-2 { fill: #6ee7b7; }
        .react-calendar-heatmap .color-scale-3 { fill: #34d399; }
        .react-calendar-heatmap .color-scale-4 { fill: #10b981; }
        .react-calendar-heatmap rect { rx: 3; cursor: pointer; }
        .react-calendar-heatmap rect:hover { stroke: #059669; stroke-width: 1.5; }
        .react-calendar-heatmap text { font-size: 9px; fill: #6b7280; }
      `}</style>

      <div className="overflow-x-auto max-w-full pb-2">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={calendarData}
          classForValue={(value) => {
            if (!value?.count) return "color-empty";
            const ratio = value.count / maxCount;
            if (ratio >= 0.75) return "color-scale-4";
            if (ratio >= 0.5) return "color-scale-3";
            if (ratio >= 0.25) return "color-scale-2";
            return "color-scale-1";
          }}
          showWeekdayLabels={true}
          onClick={(value) => value?.date && onDateClick(value.date)}
          gutterSize={3}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          {["bg-gray-100", "bg-emerald-100", "bg-emerald-300", "bg-emerald-500"].map((c, i) => (
            <div key={i} className={`w-3 h-3 ${c} rounded`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

// Weekly Trend Area Chart
function WeeklyTrendChart({ calendar }) {
  const trendData = useMemo(() => {
    if (!calendar?.length) return [];
    return calendar.slice(-14).map(d => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Sessions: d.count || 0,
    }));
  }, [calendar]);

  return (
    <div className="flex-1">
      {trendData.length > 0 ? (
        <div className="h-32">
          <AreaChart
            data={trendData}
            index="date"
            categories={["Sessions"]}
            colors={["emerald"]}
            className="h-full"
            showAnimation={true}
            showLegend={false}
            showGridLines={false}
            curveType="monotone"
          />
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
          No trend data
        </div>
      )}
    </div>
  );
}

export default function AttendanceHeatmapCard({ data, onDateClick, range }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Activity Heatmap</h3>
        <Badge size="sm" color="gray">Last {range}</Badge>
      </div>

      {/* Heatmap */}
      <AttendanceHeatmap data={data} onDateClick={onDateClick} />

      {/* Divider */}
      <div className="border-t border-gray-100 my-3" />

      {/* Header for Trend */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Weekly Trend</h3>
        <Badge size="sm" color="emerald">14 days</Badge>
      </div>

      {/* Trend Chart */}
      <WeeklyTrendChart calendar={data?.calendar} />
    </div>
  );
}
