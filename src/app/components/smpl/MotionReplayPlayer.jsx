"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Loader2 } from "lucide-react";
import SmplMeshViewer from "./SmplMeshViewer";
import { useSmplFramePreloader } from "../../hooks/useSmplMeshLoader";

/**
 * Frame rate options
 */
const FRAME_RATES = [
  { label: "12 FPS", value: 12 },
  { label: "24 FPS", value: 24 },
  { label: "30 FPS", value: 30 },
];

/**
 * Motion Replay Player Component
 * Animates through SMPL mesh frames with playback controls
 *
 * @param {Object} props
 * @param {string[]} props.frameUrls - Array of .bin file URLs
 * @param {number} props.fps - Frames per second (default 24)
 * @param {boolean} props.autoPlay - Start playing automatically
 * @param {boolean} props.loop - Loop playback
 * @param {string} props.meshColor - Mesh color
 * @param {boolean} props.wireframe - Show wireframe
 * @param {Function} props.onFrameChange - Callback when frame changes
 * @param {string} props.jwtToken - JWT token for authenticated API requests
 * @param {string} props.className - Additional CSS classes
 */
export default function MotionReplayPlayer({
  frameUrls = [],
  fps = 24,
  autoPlay = false,
  loop = true,
  meshColor = "#10b981",
  wireframe = false,
  onFrameChange,
  jwtToken = null,
  className = "",
}) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playbackFps, setPlaybackFps] = useState(fps);
  const [showFpsMenu, setShowFpsMenu] = useState(false);

  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  // Preload all frames with JWT authentication
  const { frames, loading, progress, error, reload } = useSmplFramePreloader(frameUrls, jwtToken);

  // Get current frame vertices
  const currentVertices = useMemo(() => {
    if (frameUrls.length === 0 || !frames.has(frameUrls[currentFrame])) {
      return null;
    }
    return frames.get(frameUrls[currentFrame]);
  }, [frames, frameUrls, currentFrame]);

  // Frame count
  const totalFrames = frameUrls.length;

  // Animation loop
  const animate = useCallback((timestamp) => {
    if (!isPlaying) return;

    const frameInterval = 1000 / playbackFps;
    const elapsed = timestamp - lastFrameTimeRef.current;

    if (elapsed >= frameInterval) {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next >= totalFrames) {
          if (loop) {
            return 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return next;
      });
      lastFrameTimeRef.current = timestamp;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, playbackFps, totalFrames, loop]);

  // Start/stop animation
  useEffect(() => {
    if (isPlaying && totalFrames > 0) {
      lastFrameTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate, totalFrames]);

  // Notify parent of frame changes
  useEffect(() => {
    if (onFrameChange) {
      onFrameChange(currentFrame, totalFrames);
    }
  }, [currentFrame, totalFrames, onFrameChange]);

  // Playback controls
  const handlePlayPause = () => {
    if (totalFrames === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handlePrevFrame = () => {
    setIsPlaying(false);
    setCurrentFrame((prev) => Math.max(0, prev - 1));
  };

  const handleNextFrame = () => {
    setIsPlaying(false);
    setCurrentFrame((prev) => Math.min(totalFrames - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  const handleSliderChange = (e) => {
    setIsPlaying(false);
    setCurrentFrame(parseInt(e.target.value, 10));
  };

  const handleFpsChange = (newFps) => {
    setPlaybackFps(newFps);
    setShowFpsMenu(false);
  };

  // Calculate loaded frames percentage
  const loadedFramesCount = frames.size;
  const loadedPercentage = totalFrames > 0 ? (loadedFramesCount / totalFrames) * 100 : 0;

  // Loading state
  if (loading && loadedFramesCount === 0) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl min-h-[300px]">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm text-gray-600 font-medium mb-2">Loading motion data...</p>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{Math.round(progress)}% loaded</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && loadedFramesCount === 0) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl min-h-[300px]">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-1">Failed to load motion data</p>
          <p className="text-xs text-gray-500 mb-4">{error}</p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (totalFrames === 0) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl min-h-[300px]">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Play className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No motion data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 3D Viewer */}
      <div className="flex-1 min-h-[300px] relative">
        <SmplMeshViewer
          vertices={currentVertices}
          loading={loading && !currentVertices}
          meshColor={meshColor}
          wireframe={wireframe}
          className="h-full"
          apiBaseUrl={frameUrls.length > 0 ? frameUrls[0].split('/trainer-app')[0] : "http://localhost:5000"}
          jwtToken={jwtToken}
        />

        {/* Frame counter overlay */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
          Frame {currentFrame + 1} / {totalFrames}
        </div>

        {/* Loading indicator for progressive loading */}
        {loading && loadedPercentage < 100 && (
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading... {Math.round(loadedPercentage)}%</span>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="bg-white border-t border-gray-100 p-4 rounded-b-xl">
        {/* Timeline Slider */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={currentFrame}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentFrame / (totalFrames - 1)) * 100}%, #e5e7eb ${(currentFrame / (totalFrames - 1)) * 100}%, #e5e7eb 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0:00</span>
            <span>{((totalFrames / playbackFps)).toFixed(1)}s</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left: Reset */}
          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Center: Playback */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevFrame}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Previous frame"
              disabled={currentFrame === 0}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNextFrame}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Next frame"
              disabled={currentFrame === totalFrames - 1}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Right: FPS Selector */}
          <div className="relative">
            <button
              onClick={() => setShowFpsMenu(!showFpsMenu)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-1"
            >
              {playbackFps} FPS
            </button>

            {showFpsMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                {FRAME_RATES.map((rate) => (
                  <button
                    key={rate.value}
                    onClick={() => handleFpsChange(rate.value)}
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition ${
                      playbackFps === rate.value ? "text-emerald-600 bg-emerald-50" : "text-gray-600"
                    }`}
                  >
                    {rate.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version of the player for smaller spaces
 */
export function MotionReplayPlayerCompact({ frameUrls, ...props }) {
  return (
    <MotionReplayPlayer
      frameUrls={frameUrls}
      {...props}
      className="h-64"
    />
  );
}
