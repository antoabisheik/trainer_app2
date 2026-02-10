"use client";

export default function AttendanceKPI({ summary, analytics }) {
  const stats = [
    { label: "Total Athletes", value: summary?.totalAthletes || 0 },
    { label: "Active Athletes", value: summary?.activeAthletes || 0 },
    { label: "Avg Completion", value: `${analytics?.avgCompletion || 0}%` },
    { label: "High Risk", value: analytics?.highRisk || 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
