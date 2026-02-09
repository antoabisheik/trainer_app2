"use client";

import { useMemo } from "react";
import { Badge } from "@tremor/react";
import { CheckCircle, Bell, TrendingDown, Clock } from "lucide-react";

// Single alert item - Emerald theme with larger fonts
function AlertItem({ alert }) {
  const Icon = alert.icon;

  const intensityStyles = {
    high: "bg-emerald-50 border-emerald-200",
    medium: "bg-emerald-50/50 border-emerald-100",
    success: "bg-emerald-50 border-emerald-200",
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${intensityStyles[alert.intensity] || intensityStyles.medium}`}>
      <div className="p-1.5 bg-emerald-100 rounded-lg shrink-0">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
        <p className="text-sm text-gray-500 truncate">{alert.message}</p>
      </div>
    </div>
  );
}

export default function ExecutionAlertsCard({ athletes, calendar }) {
  const alerts = useMemo(() => {
    const alertList = [];

    const recentDates = calendar?.slice(-7).map(c => c.date) || [];
    athletes?.forEach(a => {
      const athleteName = a.name || `Athlete`;
      const hasRecentSession = a.sessionDates?.some(d => recentDates.includes(d));
      if (!hasRecentSession && a.totalSessions > 0) {
        alertList.push({
          intensity: "medium",
          icon: Clock,
          title: "Needs Attention",
          message: `${athleteName} - no sessions in 7 days`,
        });
      }
    });

    athletes?.forEach(a => {
      const athleteName = a.name || `Athlete`;
      if ((a.avgCompletionRate || 0) < 50 && a.totalSessions > 0) {
        alertList.push({
          intensity: "high",
          icon: TrendingDown,
          title: "Low Completion",
          message: `${athleteName} - ${a.avgCompletionRate}% rate`,
        });
      }
    });

    const topPerformers = athletes?.filter(a => (a.avgCompletionRate || 0) >= 90 && a.totalSessions >= 5) || [];
    if (topPerformers.length > 0) {
      alertList.push({
        intensity: "success",
        icon: CheckCircle,
        title: "Top Performers",
        message: `${topPerformers.length} athlete(s) with 90%+ completion`,
      });
    }

    return alertList.slice(0, 6);
  }, [athletes, calendar]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 h-96 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Bell className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Alerts</h3>
        </div>
        <Badge size="sm" color="emerald">{alerts.length}</Badge>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto p-4">
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <AlertItem key={i} alert={alert} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="p-3 bg-emerald-50 rounded-full mb-3">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-base font-medium text-gray-600">All Clear</p>
            <p className="text-sm text-gray-400">No alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
