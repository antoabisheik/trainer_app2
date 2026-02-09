"use client";

import { Users, Zap, Target, AlertTriangle, TrendingUp } from "lucide-react";

// Single KPI Card - Emerald theme with larger fonts
function KPICard({ title, value, icon: Icon, trend, trendValue }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-emerald-50">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        {trend && (
          <span className="text-sm font-medium flex items-center gap-1 text-emerald-600">
            <TrendingUp className={`w-3.5 h-3.5 ${trend === "down" ? "rotate-180" : ""}`} />
            {trendValue}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  );
}

export default function AttendanceKPI({ summary, analytics }) {
  const activePercent = summary?.totalAthletes > 0
    ? ((summary.activeAthletes / summary.totalAthletes) * 100).toFixed(0)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Total Athletes" value={summary?.totalAthletes || 0} icon={Users} />
      <KPICard title="Active Athletes" value={summary?.activeAthletes || 0} icon={Zap} trend="up" trendValue={`${activePercent}%`} />
      <KPICard title="Avg Completion" value={`${analytics?.avgCompletion || 0}%`} icon={Target} />
      <KPICard title="High Risk" value={analytics?.highRisk || 0} icon={AlertTriangle} />
    </div>
  );
}
