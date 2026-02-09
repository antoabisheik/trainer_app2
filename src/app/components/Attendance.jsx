"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import modular components
import AttendanceHeader from "./attendance/AttendanceHeader";
import AttendanceKPI from "./attendance/AttendanceKPI";
import AttendanceHeatmapCard from "./attendance/AttendanceHeatmapCard";
import SessionAnalyticsCard from "./attendance/SessionAnalyticsCard";
import AthleteLeaderboardCard from "./attendance/AthleteLeaderboardCard";
import ExecutionAlertsCard from "./attendance/ExecutionAlertsCard";
import SessionOverviewCard from "./attendance/SessionOverviewCard";
import DateDetailCard from "./attendance/DateDetailCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Loading Card
function LoadingCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
      <div className="w-8 h-8 border-3 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-500">Loading analytics...</p>
    </div>
  );
}

export default function Attendance({ jwtToken }) {
  const [range, setRange] = useState("30d");
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateDetail, setDateDetail] = useState(null);
  const [dateLoading, setDateLoading] = useState(false);

  // Fetch attendance data
  useEffect(() => {
    if (!jwtToken) return;
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/trainer-app/attendance?range=${range}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setAttendance(data.data);
      } catch (err) {
        console.error("Attendance error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [jwtToken, range]);

  // Fetch date details
  useEffect(() => {
    if (!jwtToken || !selectedDate) {
      setDateDetail(null);
      return;
    }
    const fetchDateDetail = async () => {
      setDateLoading(true);
      try {
        const res = await fetch(`${API_BASE}/trainer-app/attendance/by-date?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setDateDetail(data.data);
      } catch (err) {
        console.error("Date error:", err);
      } finally {
        setDateLoading(false);
      }
    };
    fetchDateDetail();
  }, [jwtToken, selectedDate]);

  // Calculate streak
  const streak = useMemo(() => {
    if (!attendance?.calendar?.length) return 0;
    const dates = [...attendance.calendar]
      .filter(d => d.count > 0)
      .map(d => d.date)
      .sort()
      .reverse();
    if (dates.length === 0) return 0;
    let count = 0;
    let check = new Date();
    for (let i = 0; i < 90; i++) {
      const str = check.toISOString().split("T")[0];
      if (dates.includes(str)) count++;
      else if (count > 0) break;
      check.setDate(check.getDate() - 1);
    }
    return count;
  }, [attendance]);

  // Computed analytics
  const analytics = useMemo(() => {
    if (!attendance) return null;

    const athletes = attendance.athletes || [];
    const avgCompletion = athletes.length > 0
      ? (athletes.reduce((sum, a) => sum + (a.avgCompletionRate || 0), 0) / athletes.length).toFixed(0)
      : 0;

    const highRisk = athletes.filter(a => (a.avgCompletionRate || 0) < 50).length;

    return { avgCompletion, highRisk };
  }, [attendance]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <AttendanceHeader streak={streak} range={range} setRange={setRange} />

      {loading ? (
        <LoadingCard />
      ) : (
        <>
          {/* Section A: KPI Cards */}
          <AttendanceKPI summary={attendance?.summary} analytics={analytics} />

          {/* Section B: Visual Analytics - 2 Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AttendanceHeatmapCard data={attendance} onDateClick={setSelectedDate} range={range} />
            <SessionAnalyticsCard sessionData={dateDetail?.present} loading={dateLoading} />
          </div>

          {/* Section C: Insights - 3 Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: Date Detail or Session Overview */}
            <AnimatePresence mode="wait">
              {selectedDate ? (
                <motion.div
                  key="date-detail"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <DateDetailCard
                    date={selectedDate}
                    data={dateDetail}
                    loading={dateLoading}
                    onClose={() => setSelectedDate(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="session-overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <SessionOverviewCard
                    summary={attendance?.summary}
                    calendar={attendance?.calendar}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Column 2: Execution Alerts */}
            <ExecutionAlertsCard
              athletes={attendance?.athletes}
              calendar={attendance?.calendar}
            />

            {/* Column 3: Athlete Leaderboard */}
            <AthleteLeaderboardCard
              athletes={attendance?.athletes}
            />
          </div>
        </>
      )}
    </div>
  );
}
