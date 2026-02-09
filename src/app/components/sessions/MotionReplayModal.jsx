"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Calendar,
  Activity,
  ChevronDown,
  Play,
  Eye,
  Loader2,
} from "lucide-react";
import MotionReplayPlayer from "../smpl/MotionReplayPlayer";
import { useFrameFilenames } from "../../hooks/useSmplMeshLoader";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Exercise selector dropdown
 */
function ExerciseSelector({ exercises, selectedIndex, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!exercises || exercises.length === 0) {
    return null;
  }

  const selectedExercise = exercises[selectedIndex];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {selectedExercise?.name || "Select Exercise"}
            </p>
            <p className="text-xs text-gray-500">
              {selectedExercise?.gcs_folders?.length || 0} recordings
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto">
              {exercises.map((exercise, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect(idx);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${
                    selectedIndex === idx ? "bg-emerald-50" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedIndex === idx
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span className="text-sm font-medium">{idx + 1}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className={`text-sm font-medium ${
                        selectedIndex === idx ? "text-emerald-700" : "text-gray-900"
                      }`}
                    >
                      {exercise.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {exercise.muscle_name} • {exercise.gcs_folders?.length || 0} clips
                    </p>
                  </div>
                  {exercise.gcs_folders?.length > 0 && (
                    <Play className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Recording/clip selector for exercises with multiple GCS folders
 */
function RecordingSelector({ gcsFolders, selectedIndex, onSelect }) {
  if (!gcsFolders || gcsFolders.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {gcsFolders.map((folder, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            selectedIndex === idx
              ? "bg-emerald-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Clip {idx + 1}
          <span className="ml-1 text-xs opacity-75">({folder.frames} frames)</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Session metadata header
 */
function SessionHeader({ session, athleteName }) {
  const sessionDate = session?.date
    ? new Date(session.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown Date";

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
        <User className="w-6 h-6 text-emerald-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900">{athleteName || "Athlete"}</h3>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {sessionDate}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            {session?.exercises?.length || 0} exercises
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Motion Replay Modal Component
 * Opens when trainer clicks a session to view SMPL motion replay
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close callback
 * @param {Object} props.session - Session object from Firestore
 * @param {string} props.athleteName - Name of the athlete
 * @param {string} props.storageBaseUrl - Base API URL for frame endpoints
 * @param {string} props.jwtToken - JWT token for authenticated API requests
 */
export default function MotionReplayModal({
  isOpen,
  onClose,
  session,
  athleteName,
  storageBaseUrl = API_BASE,
  jwtToken = null,
}) {
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [selectedRecordingIndex, setSelectedRecordingIndex] = useState(0);
  const [viewMode, setViewMode] = useState("mesh"); // mesh, wireframe, points

  // Get exercises with SMPL data
  const exercisesWithMotion = useMemo(() => {
    if (!session?.exercises) return [];
    return session.exercises.filter(
      (ex) => ex.gcs_folders && ex.gcs_folders.length > 0
    );
  }, [session]);

  // Get current exercise
  const currentExercise = exercisesWithMotion[selectedExerciseIndex];

  // Get current recording folder
  const currentFolder = currentExercise?.gcs_folders?.[selectedRecordingIndex];

  // Fetch actual frame filenames from backend (more reliable than generating)
  const { filenames: frameFiles, loading: filesLoading } = useFrameFilenames(
    currentFolder?.path,
    storageBaseUrl,
    jwtToken
  );

  // Build frame URLs from actual filenames
  const frameUrls = useMemo(() => {
    if (!currentFolder?.path || frameFiles.length === 0) return [];

    // Parse the GCS path: smpl_data/userId/sessionId/folderName
    const pathParts = currentFolder.path.split("/");
    if (pathParts.length < 4 || pathParts[0] !== "smpl_data") {
      return [];
    }

    const [, userId, sessionId, folder] = pathParts;

    // Build URLs from actual filenames returned by backend
    return frameFiles.map(
      (filename) =>
        `${storageBaseUrl}/trainer-app/smpl/frame/${userId}/${sessionId}/${folder}/${filename}`
    );
  }, [currentFolder, frameFiles, storageBaseUrl]);

  // Reset recording selection when exercise changes
  useEffect(() => {
    setSelectedRecordingIndex(0);
  }, [selectedExerciseIndex]);

  // Don't render if not open
  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <Eye className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Motion Replay</h2>
                  <p className="text-sm text-gray-500">View training form analysis</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { id: "mesh", label: "Solid" },
                    { id: "wireframe", label: "Wire" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                        viewMode === mode.id
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Controls */}
              <div className="w-80 border-r border-gray-100 p-5 overflow-y-auto shrink-0">
                {/* Session Header */}
                <SessionHeader session={session} athleteName={athleteName} />

                {/* Exercise Selector */}
                {exercisesWithMotion.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Exercise
                      </label>
                      <ExerciseSelector
                        exercises={exercisesWithMotion}
                        selectedIndex={selectedExerciseIndex}
                        onSelect={setSelectedExerciseIndex}
                      />
                    </div>

                    {/* Recording Selector */}
                    {currentExercise?.gcs_folders?.length > 1 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Recording
                        </label>
                        <RecordingSelector
                          gcsFolders={currentExercise.gcs_folders}
                          selectedIndex={selectedRecordingIndex}
                          onSelect={setSelectedRecordingIndex}
                        />
                      </div>
                    )}

                    {/* Current Recording Info */}
                    {currentFolder && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Recording Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Frames</span>
                            <span className="font-medium text-gray-900">
                              {currentFolder.frames}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Duration</span>
                            <span className="font-medium text-gray-900">
                              {(currentFolder.frames / 24).toFixed(1)}s
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Exercise</span>
                            <span className="font-medium text-gray-900">
                              {currentExercise.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      No Motion Data
                    </p>
                    <p className="text-xs text-gray-500">
                      This session doesn't have SMPL recordings
                    </p>
                  </div>
                )}
              </div>

              {/* Right Panel - Player */}
              <div className="flex-1 bg-gray-50 p-5 flex flex-col overflow-hidden">
                {frameUrls.length > 0 ? (
                  <MotionReplayPlayer
                    frameUrls={frameUrls}
                    fps={24}
                    autoPlay={false}
                    loop={true}
                    wireframe={viewMode === "wireframe"}
                    meshColor="#10b981"
                    jwtToken={jwtToken}
                    className="flex-1 min-h-0"
                  />
                ) : filesLoading || (exercisesWithMotion.length > 0 && currentFolder) ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-gray-300 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        {filesLoading ? "Loading frame files..." : "Preparing motion data..."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-base text-gray-600 font-medium mb-1">
                        No Motion Recordings
                      </p>
                      <p className="text-sm text-gray-500">
                        Select a session with SMPL data to view motion replay
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage motion replay modal state
 */
export function useMotionReplayModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [athleteName, setAthleteName] = useState("");

  const openModal = (sessionData, name = "") => {
    setSession(sessionData);
    setAthleteName(name);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Delay clearing data for animation
    setTimeout(() => {
      setSession(null);
      setAthleteName("");
    }, 300);
  };

  return {
    isOpen,
    session,
    athleteName,
    openModal,
    closeModal,
  };
}
