"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * SMPL mesh has 6890 vertices, each with x, y, z coordinates
 * Total floats per frame: 6890 * 3 = 20670
 */
const SMPL_VERTEX_COUNT = 6890;
const FLOATS_PER_VERTEX = 3;
const EXPECTED_FLOATS = SMPL_VERTEX_COUNT * FLOATS_PER_VERTEX;

/**
 * Hook to load SMPL mesh vertices from a .bin file
 * @param {string} binUrl - URL to the .bin file containing float32 vertex data
 * @param {string} jwtToken - JWT token for authenticated API requests
 * @returns {{ vertices: Float32Array | null, loading: boolean, error: string | null }}
 */
export function useSmplMeshLoader(binUrl, jwtToken = null) {
  const [vertices, setVertices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!binUrl) {
      setVertices(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function loadMesh() {
      setLoading(true);
      setError(null);

      try {
        const headers = {};
        if (jwtToken) {
          headers["Authorization"] = `Bearer ${jwtToken}`;
        }

        const response = await fetch(binUrl, {
          signal: controller.signal,
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to load mesh: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const floatArray = new Float32Array(arrayBuffer);

        // Validate vertex count
        if (floatArray.length !== EXPECTED_FLOATS) {
          console.warn(
            `Unexpected vertex count: got ${floatArray.length / 3} vertices, expected ${SMPL_VERTEX_COUNT}`
          );
        }

        setVertices(floatArray);
        setError(null);
      } catch (err) {
        if (err.name === "AbortError") {
          // Request was aborted, ignore
          return;
        }
        console.error("Error loading SMPL mesh:", err);
        setError(err.message || "Failed to load mesh");
        setVertices(null);
      } finally {
        setLoading(false);
      }
    }

    loadMesh();

    return () => {
      controller.abort();
    };
  }, [binUrl, jwtToken]);

  return { vertices, loading, error };
}

/**
 * Hook to preload multiple frames for smooth playback
 * @param {string[]} frameUrls - Array of .bin file URLs
 * @param {string} jwtToken - JWT token for authenticated API requests
 * @returns {{ frames: Map<string, Float32Array>, loading: boolean, progress: number, error: string | null }}
 */
export function useSmplFramePreloader(frameUrls, jwtToken = null) {
  const [frames, setFrames] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const loadFrames = useCallback(async () => {
    if (!frameUrls || frameUrls.length === 0) {
      setFrames(new Map());
      setLoading(false);
      setProgress(0);
      return;
    }

    // Abort previous loading
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setProgress(0);
    setError(null);

    const loadedFrames = new Map();
    let loadedCount = 0;

    // Build headers with JWT token if provided
    const headers = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }

    try {
      // Load frames in batches to avoid overwhelming the network
      const batchSize = 5;
      for (let i = 0; i < frameUrls.length; i += batchSize) {
        if (controller.signal.aborted) break;

        const batch = frameUrls.slice(i, i + batchSize);
        const batchPromises = batch.map(async (url) => {
          try {
            const response = await fetch(url, {
              signal: controller.signal,
              headers,
            });
            if (!response.ok) {
              throw new Error(`Failed to load: ${url}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return { url, data: new Float32Array(arrayBuffer) };
          } catch (err) {
            if (err.name !== "AbortError") {
              console.warn(`Failed to load frame: ${url}`, err);
            }
            return { url, data: null };
          }
        });

        const results = await Promise.all(batchPromises);

        for (const result of results) {
          if (result.data) {
            loadedFrames.set(result.url, result.data);
          }
          loadedCount++;
          setProgress((loadedCount / frameUrls.length) * 100);
        }

        // Update frames progressively
        setFrames(new Map(loadedFrames));
      }

      if (loadedFrames.size === 0 && frameUrls.length > 0) {
        setError("Failed to load any frames");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to load frames");
      }
    } finally {
      setLoading(false);
    }
  }, [frameUrls, jwtToken]);

  useEffect(() => {
    loadFrames();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadFrames]);

  return { frames, loading, progress, error, reload: loadFrames };
}

/**
 * Utility to generate frame URLs from GCS folder metadata
 * Constructs URLs for the backend SMPL API endpoint
 * @param {Object} gcsFolder - GCS folder object with path, frames count, and optional filePrefix
 * @param {string} apiBaseUrl - Base API URL (e.g., http://localhost:5000/api)
 * @returns {string[]} Array of frame URLs
 */
export function generateFrameUrls(gcsFolder, apiBaseUrl) {
  if (!gcsFolder || !gcsFolder.path || !gcsFolder.frames) {
    return [];
  }

  // Parse the GCS path: smpl_data/userId/sessionId/folderName
  const pathParts = gcsFolder.path.split("/");
  if (pathParts.length < 4 || pathParts[0] !== "smpl_data") {
    console.warn("Invalid GCS folder path format:", gcsFolder.path);
    return [];
  }

  const [, userId, sessionId, folder] = pathParts;

  // Use filePrefix from gcsFolder if available, otherwise use default
  // Expected format: "cam_1_track1_entry0_frame" (without frame number)
  const filePrefix = gcsFolder.filePrefix || "cam_1_track1_entry0_frame";

  // Determine frame number padding (default 4 digits)
  const framePadding = gcsFolder.framePadding || 4;

  const urls = [];
  for (let i = 0; i < gcsFolder.frames; i++) {
    // Format: {filePrefix}{frameNumber}.bin
    const frameNumber = String(i + 1).padStart(framePadding, "0");
    const fileName = `${filePrefix}${frameNumber}.bin`;
    // Construct API URL: /api/trainer-app/smpl/frame/:userId/:sessionId/:folder/:filename
    const url = `${apiBaseUrl}/trainer-app/smpl/frame/${userId}/${sessionId}/${folder}/${fileName}`;
    urls.push(url);
  }

  return urls;
}

/**
 * Hook to fetch actual frame filenames from the backend
 * This is the REQUIRED method for getting frame filenames - never guess or generate filenames
 * @param {string} folderPath - GCS folder path (smpl_data/userId/sessionId/folder)
 * @param {string} apiBaseUrl - Base API URL
 * @param {string} jwtToken - JWT token for authentication
 * @returns {{ filenames: string[], loading: boolean, error: string | null }}
 */
export function useFrameFilenames(folderPath, apiBaseUrl, jwtToken = null) {
  const [filenames, setFilenames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!folderPath) {
      setFilenames([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Set loading immediately
    setLoading(true);
    setError(null);
    setFilenames([]); // Clear previous filenames to prevent stale data

    async function fetchFilenames() {
      try {
        // Parse path to get components
        const pathParts = folderPath.split("/");
        if (pathParts.length < 4 || pathParts[0] !== "smpl_data") {
          throw new Error(`Invalid folder path format: ${folderPath}`);
        }

        const [, userId, sessionId, folder] = pathParts;
        const url = `${apiBaseUrl}/trainer-app/smpl/frames/${userId}/${sessionId}/${folder}`;

        console.log("[useFrameFilenames] Fetching filenames from:", url);

        const headers = {};
        if (jwtToken) {
          headers["Authorization"] = `Bearer ${jwtToken}`;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch filenames: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data.success && data.data.files && Array.isArray(data.data.files)) {
          console.log("[useFrameFilenames] Received", data.data.files.length, "files from backend");
          if (data.data.files.length > 0) {
            console.log("[useFrameFilenames] First file:", data.data.files[0]);
            console.log("[useFrameFilenames] Last file:", data.data.files[data.data.files.length - 1]);
          }
          setFilenames(data.data.files);
        } else {
          console.warn("[useFrameFilenames] No files in response:", data);
          setFilenames([]);
        }
      } catch (err) {
        console.error("[useFrameFilenames] Error fetching frame filenames:", err);
        setError(err.message);
        setFilenames([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFilenames();
  }, [folderPath, apiBaseUrl, jwtToken]);

  return { filenames, loading, error };
}

/**
 * Utility to generate Firebase Storage download URL
 * @param {string} storagePath - Path in Firebase Storage
 * @param {string} bucket - Storage bucket name
 * @returns {string} Download URL
 */
export function getFirebaseStorageUrl(storagePath, bucket = "your-project.appspot.com") {
  const encodedPath = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}
