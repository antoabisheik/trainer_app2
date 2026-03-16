"use client";

import { useState, useEffect } from "react";
import SmplModelViewer from "./SmplModelViewer";
import { useMultiFrameSingleFrame, useMultiFrameMetadata, useSmplFaces } from "../../hooks/useSmplMeshLoader";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

/**
 * SMPL Animation Viewer
 * Loads and plays back multi-frame SMPL animations with GLB model and textures
 *
 * @param {Object} props
 * @param {string} props.userId - User ID
 * @param {string} props.sessionId - Session ID
 * @param {string} props.filename - Multi-frame SMPL filename
 * @param {string} props.apiBaseUrl - API base URL
 * @param {string} props.jwtToken - JWT token for authentication
 * @param {string} props.modelPath - Path to GLB model
 * @param {string} props.texturePath - Path to texture
 * @param {boolean} props.autoPlay - Auto-play on load
 * @param {string} props.className - Additional CSS classes
 */
export default function SmplAnimationViewer({
  userId,
  sessionId,
  filename,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  jwtToken = null,
  modelPath = "/src/app/models/mesh.glb",
  texturePath = "/src/app/components/textures/Ch31_1001_Diffuse.png",
  autoPlay = false,
  className = "",
}) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Fetch SMPL face indices from backend (static data, cached globally)
  const { faceIndices, loading: facesLoading, error: facesError } =
    useSmplFaces(apiBaseUrl, jwtToken);

  // Fetch metadata to get frame count and FPS
  const { metadata, loading: metadataLoading, error: metadataError } =
    useMultiFrameMetadata(userId, sessionId, filename, apiBaseUrl, jwtToken);

  // Load current frame
  const { vertices, loading: frameLoading, error: frameError } =
    useMultiFrameSingleFrame(userId, sessionId, filename, currentFrame, apiBaseUrl, jwtToken);

  // Animation playback
  useEffect(() => {
    if (!isPlaying || !metadata) return;

    const fps = metadata.fps || 15;
    const frameInterval = 1000 / fps;

    const intervalId = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        return next >= metadata.frameCount ? 0 : next;
      });
    }, frameInterval);

    return () => clearInterval(intervalId);
  }, [isPlaying, metadata]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePreviousFrame = () => {
    setIsPlaying(false);
    setCurrentFrame((prev) => (prev > 0 ? prev - 1 : (metadata?.frameCount || 1) - 1));
  };

  const handleNextFrame = () => {
    setIsPlaying(false);
    setCurrentFrame((prev) => {
      const next = prev + 1;
      return next >= (metadata?.frameCount || 1) ? 0 : next;
    });
  };

  const handleRestart = () => {
    setCurrentFrame(0);
    setIsPlaying(true);
  };

  const handleSeek = (e) => {
    const value = parseInt(e.target.value, 10);
    setCurrentFrame(value);
    setIsPlaying(false);
  };

  const loading = metadataLoading || frameLoading || facesLoading;
  const error = metadataError || frameError || facesError;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 3D Viewer */}
      <div className="flex-1 min-h-[400px]">
        <SmplModelViewer
          vertices={vertices}
          faceIndices={faceIndices}
          loading={loading}
          error={error}
          modelPath={modelPath}
          texturePath={texturePath}
          useGLBModel={true}
          className="h-full"
        />
      </div>

      {/* Playback Controls */}
      {metadata && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {/* Timeline Slider */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={Math.max(0, metadata.frameCount - 1)}
              value={currentFrame}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Frame {currentFrame + 1}</span>
              <span>{metadata.frameCount} frames</span>
              <span>{metadata.fps} FPS</span>
              <span>{metadata.duration?.toFixed(1)}s</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleRestart}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Restart"
            >
              <SkipBack className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={handlePreviousFrame}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Previous Frame"
            >
              <SkipBack className="w-4 h-4 text-gray-600" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={handleNextFrame}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Next Frame"
            >
              <SkipForward className="w-4 h-4 text-gray-600" />
            </button>

            <button
              onClick={() => setCurrentFrame(metadata.frameCount - 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="End"
            >
              <SkipForward className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
