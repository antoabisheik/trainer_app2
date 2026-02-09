"use client";

import { useMemo } from "react";
import { DonutChart, BarChart, Badge } from "@tremor/react";

// Card wrapper
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// Completion Donut Chart - Emerald shades only
function CompletionDonutChart({ athletes }) {
  const completionData = useMemo(() => {
    if (!athletes?.length) return [];

    let excellent = 0, partial = 0, needsWork = 0;
    athletes.forEach(a => {
      const rate = a.avgCompletionRate || 0;
      if (rate >= 80) excellent++;
      else if (rate >= 50) partial++;
      else needsWork++;
    });

    return [
      { name: "80%+ Complete", value: excellent },
      { name: "50-79% Complete", value: partial },
      { name: "Below 50%", value: needsWork },
    ].filter(d => d.value > 0);
  }, [athletes]);

  // Emerald gradient shades
  const emeraldShades = ["#059669", "#10b981", "#6ee7b7"];

  return (
    <div className="flex-1">
      {completionData.length > 0 ? (
        <>
          <div className="h-40">
            <DonutChart
              data={completionData}
              category="value"
              index="name"
              colors={["emerald-600", "emerald-400", "emerald-200"]}
              className="h-full"
              showAnimation={true}
              showTooltip={true}
              variant="pie"
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {completionData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: emeraldShades[i] }}
                />
                <span className="text-gray-600">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          No completion data
        </div>
      )}
    </div>
  );
}

// Risk Distribution Bar Chart - Emerald only
function RiskDistributionChart({ athletes }) {
  const riskData = useMemo(() => {
    if (!athletes?.length) return [];

    let low = 0, medium = 0, high = 0;
    athletes.forEach(a => {
      const rate = a.avgCompletionRate || 0;
      if (rate >= 80) low++;
      else if (rate >= 50) medium++;
      else high++;
    });

    return [
      { category: "Low Risk", athletes: low },
      { category: "Medium", athletes: medium },
      { category: "High Risk", athletes: high },
    ];
  }, [athletes]);

  return (
    <div className="flex-1">
      {riskData.some(d => d.athletes > 0) ? (
        <div className="h-32">
          <BarChart
            data={riskData}
            index="category"
            categories={["athletes"]}
            colors={["emerald"]}
            className="h-full"
            showAnimation={true}
            showLegend={false}
            showGridLines={false}
            yAxisWidth={30}
          />
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
          No risk data
        </div>
      )}
    </div>
  );
}

export default function AttendanceChartsCard({ athletes }) {
  return (
    <Card className="p-5 h-[420px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Completion Distribution</h3>
        <Badge size="xs" color="emerald">By Rate</Badge>
      </div>

      {/* Donut Chart */}
      <CompletionDonutChart athletes={athletes} />

      {/* Divider */}
      <div className="border-t border-gray-100 my-4" />

      {/* Header for Risk */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Risk Distribution</h3>
        <Badge size="xs" color="emerald">Athletes</Badge>
      </div>

      {/* Risk Chart */}
      <RiskDistributionChart athletes={athletes} />
    </Card>
  );
}
