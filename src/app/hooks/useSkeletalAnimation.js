"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Animation format constants
 * The .bin files may contain either:
 * - Quaternion format: 24 joints × 4 floats (xyzw) = 96 floats per frame
 * - Axis-angle format: 24 joints × 3 floats (xyz) = 72 floats per frame
 */
const JOINTS_PER_FRAME = 24;
const FLOATS_PER_JOINT_QUAT = 4; // quaternion x, y, z, w
const FLOATS_PER_JOINT_AA = 3;   // axis-angle x, y, z
const FLOATS_PER_FRAME_QUAT = JOINTS_PER_FRAME * FLOATS_PER_JOINT_QUAT; // 96 floats
const FLOATS_PER_FRAME_AA = JOINTS_PER_FRAME * FLOATS_PER_JOINT_AA;     // 72 floats

// Default to quaternion format
const FLOATS_PER_FRAME = FLOATS_PER_FRAME_QUAT;
const FLOATS_PER_JOINT = FLOATS_PER_JOINT_QUAT;

/**
 * SMPL-24 joint indices mapped to Mixamo bone names
 * Standard SMPL joint ordering must be followed exactly!
 *
 * SMPL uses this specific ordering:
 * 0: Pelvis, 1: L_Hip, 2: R_Hip, 3: Spine1, 4: L_Knee, 5: R_Knee,
 * 6: Spine2, 7: L_Ankle, 8: R_Ankle, 9: Spine3, 10: L_Foot, 11: R_Foot,
 * 12: Neck, 13: L_Collar, 14: R_Collar, 15: Head, 16: L_Shoulder, 17: R_Shoulder,
 * 18: L_Elbow, 19: R_Elbow, 20: L_Wrist, 21: R_Wrist, 22: L_Hand, 23: R_Hand
 */
export const JOINT_TO_BONE_MAP = [
  "mixamorig9:Hips",           // 0 - Pelvis
  "mixamorig9:LeftUpLeg",      // 1 - L_Hip (left thigh)
  "mixamorig9:RightUpLeg",     // 2 - R_Hip (right thigh)
  "mixamorig9:Spine",          // 3 - Spine1 (lower spine)
  "mixamorig9:LeftLeg",        // 4 - L_Knee (left shin)
  "mixamorig9:RightLeg",       // 5 - R_Knee (right shin)
  "mixamorig9:Spine1",         // 6 - Spine2 (mid spine)
  "mixamorig9:LeftFoot",       // 7 - L_Ankle (left foot)
  "mixamorig9:RightFoot",      // 8 - R_Ankle (right foot)
  "mixamorig9:Spine2",         // 9 - Spine3 (upper spine)
  "mixamorig9:LeftToeBase",    // 10 - L_Foot (left toe)
  "mixamorig9:RightToeBase",   // 11 - R_Foot (right toe)
  "mixamorig9:Neck",           // 12 - Neck
  "mixamorig9:LeftShoulder",   // 13 - L_Collar (left clavicle)
  "mixamorig9:RightShoulder",  // 14 - R_Collar (right clavicle)
  "mixamorig9:Head",           // 15 - Head
  "mixamorig9:LeftArm",        // 16 - L_Shoulder (left upper arm)
  "mixamorig9:RightArm",       // 17 - R_Shoulder (right upper arm)
  "mixamorig9:LeftForeArm",    // 18 - L_Elbow (left forearm)
  "mixamorig9:RightForeArm",   // 19 - R_Elbow (right forearm)
  "mixamorig9:LeftHand",       // 20 - L_Wrist (left hand)
  "mixamorig9:RightHand",      // 21 - R_Wrist (right hand)
  null,                        // 22 - L_Hand (fingers - unused)
  null,                        // 23 - R_Hand (fingers - unused)
];

/**
 * Common prefixes used in different rigging conventions
 * Note: Some exports use colon (mixamorig9:) and some don't (mixamorig9)
 */
const BONE_PREFIXES = [
  "mixamorig9:", "mixamorig9",  // With and without colon
  "mixamorig:", "mixamorig",
  "mixamorig1:", "mixamorig1",
  "mixamorig2:", "mixamorig2",
  "Armature_", "Armature|", "Character_", "Root_",
  "", // No prefix
];

/**
 * Find a bone by trying multiple name patterns
 */
export function findBoneByName(skeleton, baseName) {
  if (!skeleton || !baseName) return null;

  // Try the exact name first
  let bone = skeleton.getBoneByName(baseName);
  if (bone) return bone;

  // Extract the suffix (e.g., "Hips" from "mixamorig9:Hips")
  let suffix = baseName;
  for (const prefix of BONE_PREFIXES) {
    if (baseName.startsWith(prefix)) {
      suffix = baseName.substring(prefix.length);
      break;
    }
  }

  // Try all prefix combinations
  for (const prefix of BONE_PREFIXES) {
    bone = skeleton.getBoneByName(prefix + suffix);
    if (bone) return bone;
  }

  // Try case-insensitive search as last resort
  const lowerSuffix = suffix.toLowerCase();
  for (const b of skeleton.bones) {
    if (b.name.toLowerCase().includes(lowerSuffix)) {
      return b;
    }
  }

  return null;
}

/**
 * Debug function to log all bone names in a skeleton
 */
export function logSkeletonBones(skeleton) {
  if (!skeleton) {
    console.log("[logSkeletonBones] No skeleton provided");
    return;
  }
  console.log("[logSkeletonBones] All bones in skeleton:");
  skeleton.bones.forEach((bone, idx) => {
    console.log(`  [${idx}] ${bone.name}`);
  });
}

/**
 * Parse animation header from binary buffer
 * Attempts to detect header size and extract metadata
 */
function parseAnimationHeader(buffer) {
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);
  const totalBytes = buffer.byteLength;

  // First, check if the data is raw quaternion data with NO header
  // by checking if the total size is exactly divisible by FLOATS_PER_FRAME * 4
  const bytesPerFrame = FLOATS_PER_FRAME * 4; // 96 floats * 4 bytes = 384 bytes
  if (totalBytes % bytesPerFrame === 0) {
    const frameCount = totalBytes / bytesPerFrame;
    if (frameCount > 0 && frameCount < 10000) {
      console.log(`[parseAnimationHeader] Raw quaternion data detected: ${frameCount} frames, no header`);
      return {
        headerSize: 0,
        fps: 30, // Default FPS for raw data
        frameCount,
        metadata: null,
      };
    }
  }

  // Check for JSON header (starts with '{')
  if (uint8[0] === 0x7B) { // '{'
    // Find the end of JSON header
    let depth = 0;
    let headerEnd = 0;
    for (let i = 0; i < Math.min(buffer.byteLength, 2000); i++) {
      if (uint8[i] === 0x7B) depth++;
      if (uint8[i] === 0x7D) depth--;
      if (depth === 0) {
        headerEnd = i + 1;
        break;
      }
    }
    if (headerEnd > 0) {
      const headerStr = new TextDecoder().decode(uint8.slice(0, headerEnd));
      try {
        const header = JSON.parse(headerStr);
        return {
          headerSize: headerEnd,
          fps: header.fps || 30,
          frameCount: header.frames || header.frame_count || null,
          metadata: header,
        };
      } catch (e) {
        // Not valid JSON, continue
      }
    }
  }

  // Check for "ANIM" magic bytes (viewer.js format)
  // Binary format (little-endian):
  //   Header (16 bytes): "ANIM"(4) | version(u16) | n_frames(u16) | n_bones_anim(u16) | fps(f32) | hips_idx(u16)
  //   Bone indices:      n_bones_anim × u16
  //   Timestamps:        n_frames × f32
  //   Root translations: n_frames × 3 × f32
  //   Quaternions:       n_frames × n_bones_anim × 4 × f32
  const magic = String.fromCharCode(uint8[0], uint8[1], uint8[2], uint8[3]);

  if (magic === "ANIM") {
    const version = view.getUint16(4, true);
    const nFrames = view.getUint16(6, true);
    const nBones = view.getUint16(8, true);
    const fps = view.getFloat32(10, true);
    const hipsIdx = view.getUint16(14, true);

    console.log(`[parseAnimationHeader] ANIM format detected: v${version}, ${nFrames} frames, ${nBones} bones, ${fps.toFixed(1)} fps, hips=${hipsIdx}`);

    // Calculate total header size (fixed header + variable sections before quaternions)
    const fixedHeaderSize = 16;
    const boneIndicesSize = nBones * 2;
    const timestampsSize = nFrames * 4;
    const rootTransSize = nFrames * 3 * 4;
    const totalHeaderSize = fixedHeaderSize + boneIndicesSize + timestampsSize + rootTransSize;

    // Parse bone indices
    const boneIndices = [];
    let offset = fixedHeaderSize;
    for (let i = 0; i < nBones; i++) {
      boneIndices.push(view.getUint16(offset, true));
      offset += 2;
    }

    // Parse timestamps
    const timestamps = [];
    for (let i = 0; i < nFrames; i++) {
      timestamps.push(view.getFloat32(offset, true));
      offset += 4;
    }

    // Parse root translations
    const rootTranslations = [];
    for (let i = 0; i < nFrames; i++) {
      rootTranslations.push({
        x: view.getFloat32(offset, true),
        y: view.getFloat32(offset + 4, true),
        z: view.getFloat32(offset + 8, true),
      });
      offset += 12;
    }

    console.log(`[parseAnimationHeader] ANIM total header: ${totalHeaderSize} bytes, bone indices:`, boneIndices.slice(0, 5));

    // Validate fps and frameCount
    if (fps > 0 && fps < 1000 && nFrames > 0 && nFrames < 10000) {
      return {
        headerSize: totalHeaderSize,
        fps,
        frameCount: nFrames,
        isAnimFormat: true,
        nBones,
        boneIndices,
        timestamps,
        rootTranslations,
        hipsIdx,
        metadata: { magic, version },
      };
    }
  }

  // Try different header sizes to find one that gives whole frames
  // Common header sizes: 0 (raw), 16 (simple), 32 (standard), 48, 56, 64 (extended)
  const headerSizesToTry = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96, 128, 256, 512];

  // Try both quaternion (96 floats/frame) and axis-angle (72 floats/frame) formats
  for (const floatsPerFrame of [FLOATS_PER_FRAME_QUAT, FLOATS_PER_FRAME_AA]) {
    for (const headerSize of headerSizesToTry) {
      const dataBytes = totalBytes - headerSize;
      if (dataBytes <= 0) continue;
      const dataFloats = dataBytes / 4;
      if (dataFloats % floatsPerFrame === 0) {
        const frameCount = dataFloats / floatsPerFrame;
        if (frameCount > 0 && frameCount < 10000) {
          const formatName = floatsPerFrame === FLOATS_PER_FRAME_QUAT ? 'quaternion' : 'axis-angle';
          console.log(`[parseAnimationHeader] Detected ${formatName} format: header=${headerSize} bytes, frames=${frameCount}`);

          // Debug: Log header contents to understand format
          if (headerSize > 0) {
            const headerBytes = new Uint8Array(buffer, 0, Math.min(headerSize, 64));
            const headerHex = Array.from(headerBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
            console.log(`[parseAnimationHeader] Header hex (first ${Math.min(headerSize, 64)} bytes):`, headerHex);

            // Try to interpret header as potential format info
            if (headerSize >= 8) {
              const possibleFps = view.getFloat32(4, true);
              const possibleFrameCount = view.getUint32(0, true);
              console.log(`[parseAnimationHeader] Header interpretation: frameCount=${possibleFrameCount}, fps=${possibleFps.toFixed(2)}`);
            }
          }

          return {
            headerSize,
            fps: 30, // Default FPS
            frameCount,
            floatsPerFrame, // Include detected format
            isAxisAngle: floatsPerFrame === FLOATS_PER_FRAME_AA,
            metadata: null,
          };
        }
      }
    }
  }

  // Fallback: assume no header and calculate frame count
  const totalFloats = totalBytes / 4;
  const frameCount = Math.floor(totalFloats / FLOATS_PER_FRAME);
  console.warn(`[parseAnimationHeader] Could not detect header format, using defaults. Frames: ${frameCount}`);
  return {
    headerSize: 0,
    fps: 30,
    frameCount,
    metadata: null,
  };
}

/**
 * Parse quaternion animation frames from binary buffer
 * @param {ArrayBuffer} buffer - Raw animation data
 * @returns {Object} Parsed animation with frames array
 */
/**
 * Convert axis-angle rotation to quaternion
 * @param {number} ax - X component of axis-angle
 * @param {number} ay - Y component of axis-angle
 * @param {number} az - Z component of axis-angle
 * @returns {Object} Quaternion {x, y, z, w}
 */
function axisAngleToQuaternion(ax, ay, az) {
  const angle = Math.sqrt(ax * ax + ay * ay + az * az);
  if (angle < 0.0001) {
    // Near-zero rotation, return identity quaternion
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  const halfAngle = angle / 2;
  const s = Math.sin(halfAngle) / angle;
  return {
    x: ax * s,
    y: ay * s,
    z: az * s,
    w: Math.cos(halfAngle),
  };
}

/**
 * Parse ANIM format quaternions (viewer.js compatible)
 * Binary layout after header:
 *   Quaternions: n_frames × n_bones × 4 × f32
 *
 * IMPORTANT: ANIM format uses skeleton bone indices (0-64 for Mixamo),
 * NOT SMPL joint indices (0-23). We store quaternions indexed by skeleton bone index.
 */
function parseAnimFormatQuaternions(buffer, header) {
  const { frameCount, fps, nBones, boneIndices, rootTranslations, hipsIdx } = header;

  // Extract quaternion data after the computed header
  const frameData = new Float32Array(buffer, header.headerSize);

  console.log(`[parseAnimFormatQuaternions] ANIM format: ${frameCount} frames, ${nBones} bones, ${fps} fps`);
  console.log(`[parseAnimFormatQuaternions] Bone indices (all):`, boneIndices);

  // Sample first quaternion
  if (frameData.length >= 4) {
    console.log("[parseAnimFormatQuaternions] First quaternion raw values:",
      frameData[0].toFixed(4), frameData[1].toFixed(4),
      frameData[2].toFixed(4), frameData[3].toFixed(4));
  }

  const frames = [];

  // Parse quaternions: layout is (frame × bone × 4 floats)
  // Store as Map of skeletonBoneIndex -> quaternion for each frame
  for (let f = 0; f < frameCount; f++) {
    // Use a Map to store skeleton bone index -> quaternion
    // This allows applying directly to skeleton bones by index
    const boneQuaternions = new Map();

    for (let b = 0; b < nBones; b++) {
      const srcOffset = (f * nBones + b) * 4;
      const skeletonBoneIdx = boneIndices[b];

      boneQuaternions.set(skeletonBoneIdx, {
        x: frameData[srcOffset + 0],
        y: frameData[srcOffset + 1],
        z: frameData[srcOffset + 2],
        w: frameData[srcOffset + 3],
      });
    }

    // Attach root translation if available
    if (rootTranslations && rootTranslations[f]) {
      boneQuaternions.rootTranslation = rootTranslations[f];
    }

    frames.push(boneQuaternions);
  }

  // Debug first frame
  if (frames.length > 0) {
    const firstFrame = frames[0];
    console.log(`[parseAnimFormatQuaternions] First frame has ${firstFrame.size} bone quaternions`);
    console.log(`[parseAnimFormatQuaternions] Animated skeleton bone indices:`, Array.from(firstFrame.keys()));
    const hipsQuat = firstFrame.get(0);
    if (hipsQuat) {
      console.log("[parseAnimFormatQuaternions] Sample bone 0 (hips):", hipsQuat);
    }
  }

  return {
    frameCount: frames.length,
    fps,
    duration: frames.length / fps,
    frames,
    isAnimFormat: true,
    boneIndices,
    rootTranslations,
    hipsIdx,
    metadata: header.metadata,
  };
}

export function parseQuaternionAnimation(buffer) {
  const header = parseAnimationHeader(buffer);

  // Handle ANIM format (from viewer.js)
  if (header.isAnimFormat) {
    return parseAnimFormatQuaternions(buffer, header);
  }

  // Extract frame data after header
  const frameDataStart = header.headerSize;
  const frameData = new Float32Array(buffer, frameDataStart);

  // Use detected format or default to quaternion
  const floatsPerFrame = header.floatsPerFrame || FLOATS_PER_FRAME_QUAT;
  const isAxisAngle = header.isAxisAngle || false;
  const floatsPerJoint = isAxisAngle ? FLOATS_PER_JOINT_AA : FLOATS_PER_JOINT_QUAT;

  // Recalculate frame count from actual data
  const actualFrameCount = Math.floor(frameData.length / floatsPerFrame);

  const formatName = isAxisAngle ? 'axis-angle' : 'quaternion';
  console.log(`[parseQuaternionAnimation] Format: ${formatName}, Header: ${header.headerSize} bytes, ` +
              `Data: ${frameData.length} floats, Frames: ${actualFrameCount}`);

  const frames = [];

  // Sample first quaternion for debugging
  if (frameData.length >= 4) {
    console.log("[parseQuaternionAnimation] First quaternion raw values:",
      frameData[0].toFixed(4), frameData[1].toFixed(4),
      frameData[2].toFixed(4), frameData[3].toFixed(4));
  }

  // Validate quaternion data looks reasonable (values should be between -1 and 1)
  // If first values are outside this range, the header detection probably failed
  if (frameData.length >= 4) {
    const firstFour = [frameData[0], frameData[1], frameData[2], frameData[3]];
    const hasInvalidValues = firstFour.some(v => Math.abs(v) > 2.0);
    if (hasInvalidValues) {
      console.error("[parseQuaternionAnimation] First quaternion has invalid values (outside -2 to 2 range).",
        "This suggests incorrect header size detection. Raw values:", firstFour);
    }
  }

  // Detect quaternion format by checking first VALID frame
  // SMPL usually stores as WXYZ, Three.js expects XYZW
  // Only do detection if values look like valid quaternions
  let isWXYZFormat = false;
  if (frameData.length >= 4) {
    const v0 = frameData[0], v1 = frameData[1], v2 = frameData[2], v3 = frameData[3];
    // Only try format detection if values are in valid quaternion range
    if (Math.abs(v0) <= 1.5 && Math.abs(v1) <= 1.5 && Math.abs(v2) <= 1.5 && Math.abs(v3) <= 1.5) {
      // Check if data looks more like WXYZ by seeing if first float is close to 1.0 (identity w)
      if (Math.abs(v0) > 0.9 && Math.abs(v3) < 0.5) {
        isWXYZFormat = true;
        console.log("[parseQuaternionAnimation] Detected WXYZ quaternion format");
      } else {
        console.log("[parseQuaternionAnimation] Using XYZW quaternion format");
      }
    } else {
      console.log("[parseQuaternionAnimation] Skipping format detection due to invalid values, using XYZW");
    }
  }

  for (let f = 0; f < actualFrameCount; f++) {
    const joints = [];

    for (let j = 0; j < JOINTS_PER_FRAME; j++) {
      const offset = f * floatsPerFrame + j * floatsPerJoint;

      let quat;
      if (isAxisAngle) {
        // Axis-angle format: convert to quaternion
        const ax = frameData[offset];
        const ay = frameData[offset + 1];
        const az = frameData[offset + 2];
        quat = axisAngleToQuaternion(ax, ay, az);
      } else if (isWXYZFormat) {
        // WXYZ format (SMPL style) -> convert to Three.js XYZW
        quat = {
          x: frameData[offset + 1],
          y: frameData[offset + 2],
          z: frameData[offset + 3],
          w: frameData[offset],
        };
      } else {
        // XYZW format (standard)
        quat = {
          x: frameData[offset],
          y: frameData[offset + 1],
          z: frameData[offset + 2],
          w: frameData[offset + 3],
        };
      }

      joints.push(quat);
    }

    frames.push(joints);
  }

  // Debug: check if we have any non-identity rotations
  if (frames.length > 0) {
    let hasNonIdentity = false;
    for (const quat of frames[0]) {
      const isIdentity = Math.abs(quat.w - 1.0) < 0.01 &&
                         Math.abs(quat.x) < 0.01 &&
                         Math.abs(quat.y) < 0.01 &&
                         Math.abs(quat.z) < 0.01;
      if (!isIdentity) {
        hasNonIdentity = true;
        break;
      }
    }
    console.log("[parseQuaternionAnimation] Has non-identity rotations:", hasNonIdentity);
    console.log("[parseQuaternionAnimation] Sample joint 0 quat:", frames[0][0]);
    console.log("[parseQuaternionAnimation] Sample joint 1 quat:", frames[0][1]);
  }

  return {
    frameCount: frames.length,
    fps: header.fps,
    duration: frames.length / header.fps,
    frames,
    metadata: header.metadata,
  };
}

/**
 * Hook to load and parse quaternion animation from backend
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {string} filename - Animation filename
 * @param {string} apiBaseUrl - API base URL
 * @param {string} jwtToken - JWT token for authentication
 * @returns {Object} Animation data and loading state
 */
export function useQuaternionAnimation(userId, sessionId, filename, apiBaseUrl, jwtToken = null) {
  const [animation, setAnimation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!userId || !sessionId || !filename || !apiBaseUrl) {
      setAnimation(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function loadAnimation() {
      setLoading(true);
      setError(null);

      try {
        // Construct URL for animation file - use the new raw endpoint
        const folder = filename.replace('.bin', '');
        const url = `${apiBaseUrl}/trainer-app/smpl/animation/raw/${userId}/${sessionId}/${folder}/${filename}`;

        console.log("[useQuaternionAnimation] Loading animation from:", url);

        const headers = {};
        if (jwtToken) {
          headers["Authorization"] = `Bearer ${jwtToken}`;
        }

        const response = await fetch(url, {
          signal: controller.signal,
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log("[useQuaternionAnimation] Loaded buffer:", arrayBuffer.byteLength, "bytes");

        const parsed = parseQuaternionAnimation(arrayBuffer);
        console.log("[useQuaternionAnimation] Parsed animation:", parsed.frameCount, "frames @", parsed.fps, "fps");

        setAnimation(parsed);
        setError(null);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[useQuaternionAnimation] Error loading animation:", err);
          setError(err.message || "Failed to load animation");
          setAnimation(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAnimation();

    return () => {
      controller.abort();
    };
  }, [userId, sessionId, filename, apiBaseUrl, jwtToken]);

  return { animation, loading, error };
}

/**
 * Hook to manage animation playback state
 * @param {Object} animation - Parsed animation data
 * @param {boolean} autoPlay - Start playing automatically
 * @returns {Object} Playback state and controls
 */
export function useAnimationPlayback(animation, autoPlay = false) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef(null);

  // Reset frame when animation changes
  useEffect(() => {
    setCurrentFrame(0);
  }, [animation]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || !animation || animation.frameCount === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const fps = animation.fps || 30;
    const frameInterval = 1000 / fps;

    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        return next >= animation.frameCount ? 0 : next;
      });
    }, frameInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, animation]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlayPause = useCallback(() => setIsPlaying((p) => !p), []);

  const goToFrame = useCallback((frame) => {
    if (!animation) return;
    const clampedFrame = Math.max(0, Math.min(frame, animation.frameCount - 1));
    setCurrentFrame(clampedFrame);
  }, [animation]);

  const nextFrame = useCallback(() => {
    if (!animation) return;
    setCurrentFrame((prev) => (prev + 1) % animation.frameCount);
  }, [animation]);

  const prevFrame = useCallback(() => {
    if (!animation) return;
    setCurrentFrame((prev) => (prev - 1 + animation.frameCount) % animation.frameCount);
  }, [animation]);

  const restart = useCallback(() => {
    setCurrentFrame(0);
    setIsPlaying(true);
  }, []);

  return {
    currentFrame,
    isPlaying,
    play,
    pause,
    togglePlayPause,
    goToFrame,
    nextFrame,
    prevFrame,
    restart,
    frameCount: animation?.frameCount || 0,
    fps: animation?.fps || 30,
    duration: animation?.duration || 0,
  };
}

export default useQuaternionAnimation;
