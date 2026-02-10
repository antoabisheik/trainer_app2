"use client";

export default function AttendanceHeader({ streak, range, setRange }) {
  const ranges = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
        <p className="text-sm text-gray-500">Track athlete activity & performance</p>
      </div>
      <div className="flex items-center gap-6">
        {streak > 0 && (
          <div className="text-right">
            <p className="text-xl font-bold text-orange-500">{streak}</p>
            <p className="text-[10px] text-gray-500 uppercase">Day Streak</p>
          </div>
        )}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
                range === r.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
