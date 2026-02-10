"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@tremor/react";
import { X, Calendar, Users, Clock, CheckCircle, XCircle, Activity } from "lucide-react";

// Stat box component
function StatBox({ value, label, icon: Icon, variant = "default" }) {
  const variants = {
    default: "bg-gray-50 text-gray-600",
    primary: "bg-emerald-50 text-emerald-600",
    success: "bg-emerald-50 text-emerald-600",
    muted: "bg-gray-100 text-gray-400",
    warning: "bg-amber-50 text-amber-600",
  };

  return (
    <div className={`text-center p-4 rounded-xl ${variants[variant]}`}>
      {Icon && (
        <div className="flex justify-center mb-2">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// Session card component
function SessionCard({ session, index }) {
  const completionRate = session.completionRate || 0;
  const athleteName = session.athleteName || session.name || `Athlete ${index + 1}`;
  const exerciseCount = session.exerciseCount || session.exercises?.length || 0;
  const completedExercises = session.completedExercises || 0;

  return (
    <div className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-emerald-100 text-emerald-700">
            {athleteName[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{athleteName}</p>
            <p className="text-xs text-gray-500">{session.batch || "General"}</p>
          </div>
        </div>
        <Badge
          size="sm"
          color={completionRate >= 80 ? "emerald" : completionRate >= 50 ? "amber" : "red"}
        >
          {completionRate}%
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Completion</span>
          <span>{completedExercises}/{exerciseCount} exercises</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              completionRate >= 80 ? "bg-emerald-500" :
              completionRate >= 50 ? "bg-amber-500" : "bg-red-400"
            }`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Session details */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>{exerciseCount} exercises</span>
        </div>
        {session.status && (
          <div className="flex items-center gap-1">
            {session.status === "Closed" ? (
              <CheckCircle className="w-3 h-3 text-emerald-500" />
            ) : (
              <Clock className="w-3 h-3 text-amber-500" />
            )}
            <span>{session.status}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Athlete row for present list
function AthleteRow({ athlete, index }) {
  const displayName = athlete.name || `Athlete ${index + 1}`;
  const rate = athlete.completionRate || 0;

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-emerald-50/50 rounded-xl">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 bg-emerald-100 text-emerald-700">
          {displayName[0]?.toUpperCase() || "A"}
        </div>
        <div className="min-w-0">
          <span className="text-gray-900 font-medium block truncate">{displayName}</span>
          {athlete.batch && (
            <span className="text-xs text-gray-500">{athlete.batch}</span>
          )}
        </div>
      </div>
      <Badge size="sm" color={rate >= 80 ? "emerald" : rate >= 50 ? "amber" : "red"}>
        {rate}%
      </Badge>
    </div>
  );
}

export default function DateSessionsDialog({ isOpen, date, data, loading, onClose }) {
  if (!isOpen) return null;

  const formattedDate = date ? new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }) : "";

  const present = data?.summary?.present || 0;
  const absent = data?.summary?.absent || 0;
  const total = present + absent;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  const sessions = data?.present || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-x-20 md:inset-y-10 lg:inset-x-40 lg:inset-y-16 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Session Details</h2>
                  <p className="text-sm text-gray-500">{formattedDate}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading session data...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatBox
                    value={present}
                    label="Present"
                    icon={CheckCircle}
                    variant="success"
                  />
                  <StatBox
                    value={absent}
                    label="Absent"
                    icon={XCircle}
                    variant="muted"
                  />
                  <StatBox
                    value={`${attendanceRate}%`}
                    label="Attendance Rate"
                    icon={Users}
                    variant="primary"
                  />
                  <StatBox
                    value={sessions.length}
                    label="Sessions"
                    icon={Activity}
                    variant="default"
                  />
                </div>

                {/* Sessions list */}
                {sessions.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Sessions</h3>
                      <Badge size="sm" color="emerald">{sessions.length} total</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sessions.map((session, i) => (
                        <SessionCard key={session.id || i} session={session} index={i} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-50 rounded-full inline-block mb-4">
                      <Users className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-1">No Sessions</h3>
                    <p className="text-gray-400">No training sessions recorded for this date</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
