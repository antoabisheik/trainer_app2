"use client";

import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Loader2, Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  useQuaternionAnimation,
  useAnimationPlayback,
  JOINT_TO_BONE_MAP,
  findBoneByName,
  logSkeletonBones,
} from "../../hooks/useSkeletalAnimation";

/**
 * Animated skeleton mesh component
 * Loads GLB model and applies quaternion rotations to bones
 */
function AnimatedSkeleton({ modelPath, animation, currentFrame }) {
  const groupRef = useRef();
  const skinnedMeshRef = useRef(null);
  const [model, setModel] = useState(null);
  const [boneMapping, setBoneMapping] = useState(null);

  // Load GLB model
  const gltf = useGLTF(modelPath);

  // Setup model and skeleton
  useEffect(() => {
    if (!gltf || !gltf.scene) return;

    console.log("[AnimatedSkeleton] GLB loaded");

    // Use SkeletonUtils.clone for proper skinned mesh cloning
    const clonedScene = SkeletonUtils.clone(gltf.scene);

    // Find skinned mesh and skeleton
    let skinnedMesh = null;
    clonedScene.traverse((child) => {
      if (child.isSkinnedMesh && !skinnedMesh) {
        skinnedMesh = child;
        console.log("[AnimatedSkeleton] Found SkinnedMesh:", child.name);
      }
    });

    if (skinnedMesh && skinnedMesh.skeleton) {
      skinnedMeshRef.current = skinnedMesh;
      console.log("[AnimatedSkeleton] Skeleton bones:", skinnedMesh.skeleton.bones.length);

      // Log ALL bone names for debugging
      logSkeletonBones(skinnedMesh.skeleton);

      // Create bone mapping
      const mapping = {};
      let mappedCount = 0;

      JOINT_TO_BONE_MAP.forEach((boneName, jointIndex) => {
        if (!boneName) return;

        const bone = findBoneByName(skinnedMesh.skeleton, boneName);
        if (bone) {
          mapping[jointIndex] = bone;
          mappedCount++;
          console.log(`[AnimatedSkeleton] Mapped joint ${jointIndex} -> ${bone.name}`);
        } else {
          console.warn(`[AnimatedSkeleton] Bone not found: ${boneName}`);
        }
      });

      console.log(`[AnimatedSkeleton] Mapped ${mappedCount}/${JOINT_TO_BONE_MAP.filter(Boolean).length} joints`);
      setBoneMapping(mapping);
    } else {
      console.warn("[AnimatedSkeleton] No SkinnedMesh found in GLB");
    }

    setModel(clonedScene);
  }, [gltf]);

  // Track last applied frame for optimization
  const lastFrameRef = useRef(-1);

  // Apply frame rotations to bones using useFrame for smooth updates
  useFrame(() => {
    if (!animation || !boneMapping || !skinnedMeshRef.current) return;
    if (currentFrame >= animation.frameCount) return;

    // Only update if frame changed
    if (lastFrameRef.current === currentFrame) return;
    lastFrameRef.current = currentFrame;

    const frame = animation.frames[currentFrame];
    if (!frame) return;

    const skeleton = skinnedMeshRef.current.skeleton;
    const skinnedMesh = skinnedMeshRef.current;

    let appliedCount = 0;

    // Check if this is ANIM format (frame is a Map) or standard format (frame is an Array)
    const isAnimFormat = frame instanceof Map;

    if (isAnimFormat) {
      // ANIM format: apply quaternions directly by skeleton bone index
      if (currentFrame === 0) {
        console.log(`[AnimatedSkeleton] ANIM format frame 0 - ${frame.size} bone quaternions`);
        console.log(`[AnimatedSkeleton] Animated bone indices:`, Array.from(frame.keys()));
      }

      frame.forEach((quat, skeletonBoneIdx) => {
        // Get bone directly from skeleton by index
        const bone = skeleton.bones[skeletonBoneIdx];
        if (bone && quat) {
          const len = Math.sqrt(quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w);
          if (len > 0.001) {
            bone.quaternion.set(
              quat.x / len,
              quat.y / len,
              quat.z / len,
              quat.w / len
            );
            appliedCount++;

            if (currentFrame === 0 && appliedCount <= 3) {
              console.log(`[AnimatedSkeleton] Bone ${skeletonBoneIdx} (${bone.name}): quat=(${(quat.x/len).toFixed(3)}, ${(quat.y/len).toFixed(3)}, ${(quat.z/len).toFixed(3)}, ${(quat.w/len).toFixed(3)})`);
            }
          }
        }
      });

      // Apply root translation if present
      if (frame.rootTranslation && skeleton.bones[0]) {
        const hipsBone = skeleton.bones[0];
        hipsBone.position.set(
          frame.rootTranslation.x,
          frame.rootTranslation.y,
          frame.rootTranslation.z
        );
        if (currentFrame === 0) {
          console.log(`[AnimatedSkeleton] Root translation: (${frame.rootTranslation.x.toFixed(3)}, ${frame.rootTranslation.y.toFixed(3)}, ${frame.rootTranslation.z.toFixed(3)})`);
        }
      }
    } else {
      // Standard SMPL format: use JOINT_TO_BONE_MAP
      if (currentFrame === 0) {
        console.log(`[AnimatedSkeleton] Standard format frame 0 - ${frame.length} joint entries`);
        const jointsWithData = [];
        frame.forEach((quat, idx) => {
          if (quat) {
            const bone = boneMapping[idx];
            jointsWithData.push(`${idx}:${bone?.name || 'unmapped'}`);
          }
        });
        console.log(`[AnimatedSkeleton] Joints with data: ${jointsWithData.join(', ')}`);
      }

      frame.forEach((quat, jointIndex) => {
        const bone = boneMapping[jointIndex];
        if (bone && quat) {
          const len = Math.sqrt(quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w);
          if (len > 0.001) {
            bone.quaternion.set(
              quat.x / len,
              quat.y / len,
              quat.z / len,
              quat.w / len
            );
            appliedCount++;

            if (currentFrame === 0 && jointIndex < 3) {
              console.log(`[AnimatedSkeleton] Joint ${jointIndex} (${bone.name}): quat=(${(quat.x/len).toFixed(3)}, ${(quat.y/len).toFixed(3)}, ${(quat.z/len).toFixed(3)}, ${(quat.w/len).toFixed(3)})`);
            }
          }
        }
      });

      // Apply root translation if present
      if (frame.rootTranslation) {
        const hipsBone = boneMapping[0];
        if (hipsBone) {
          hipsBone.position.set(
            frame.rootTranslation.x,
            frame.rootTranslation.y,
            frame.rootTranslation.z
          );
          if (currentFrame === 0) {
            console.log(`[AnimatedSkeleton] Root translation: (${frame.rootTranslation.x.toFixed(3)}, ${frame.rootTranslation.y.toFixed(3)}, ${frame.rootTranslation.z.toFixed(3)})`);
          }
        }
      }
    }

    // Update skeleton - this recalculates bone matrices
    skeleton.update();

    // Force update world matrices
    skinnedMesh.updateMatrixWorld(true);

    // Debug frame application count
    if (currentFrame < 3) {
      console.log(`[AnimatedSkeleton] Frame ${currentFrame}: applied ${appliedCount} quaternions`);
    }
  });

  // Debug logging and test rotation
  useEffect(() => {
    if (!boneMapping || !skinnedMeshRef.current) return;

    // Test: Apply a small rotation to a bone to verify skeleton works
    // With SMPL ordering: 0=Hips, 3=Spine, 6=Spine1, 9=Spine2
    const testBone = boneMapping[3]; // Lower spine in SMPL ordering
    if (testBone && !animation) {
      console.log("[AnimatedSkeleton] Testing skeleton with manual rotation on:", testBone.name);
      // Apply a 15 degree rotation around X axis using proper Three.js Vector3
      testBone.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 12);
      skinnedMeshRef.current.skeleton.update();
      skinnedMeshRef.current.updateMatrixWorld(true);
    }
  }, [boneMapping, animation]);

  // Debug logging for first frame
  useEffect(() => {
    if (!animation || !boneMapping || currentFrame !== 0) return;

    const frame = animation.frames[0];
    if (frame) {
      const isAnimFormat = frame instanceof Map;
      if (isAnimFormat) {
        const entries = Array.from(frame.entries()).slice(0, 3);
        console.log("[AnimatedSkeleton] First frame quaternions (ANIM format):",
          entries.map(([idx, q]) => `[${idx}]=(${q.x.toFixed(3)}, ${q.y.toFixed(3)}, ${q.z.toFixed(3)}, ${q.w.toFixed(3)})`));
        console.log(`[AnimatedSkeleton] Total bones in frame: ${frame.size}`);
      } else {
        console.log("[AnimatedSkeleton] First frame quaternions:",
          frame.slice(0, 3).map(q => q ? `(${q.x.toFixed(3)}, ${q.y.toFixed(3)}, ${q.z.toFixed(3)}, ${q.w.toFixed(3)})` : 'null'));
        console.log(`[AnimatedSkeleton] Total joints in frame: ${frame.length}`);
      }
    }
  }, [animation, boneMapping, currentFrame]);

  if (!model) return null;

  return (
    <group ref={groupRef} rotation={[0, 0, 0]} position={[0, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

/**
 * Scene setup with lighting
 */
function SceneSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.2, 3);
    camera.lookAt(0, 1, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 3, -3]} intensity={0.4} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f0f0f0" opacity={0.8} transparent />
      </mesh>

      {/* Grid */}
      <gridHelper args={[6, 30, "#d0d0d0", "#e0e0e0"]} position={[0, 0.01, 0]} />
    </>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton({ message = "Loading animation..." }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

/**
 * Error display
 */
function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <p className="text-sm text-gray-700 font-medium mb-1">Failed to load animation</p>
        <p className="text-xs text-gray-500 mb-4 max-w-xs">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Playback controls component
 */
function PlaybackControls({
  isPlaying,
  currentFrame,
  frameCount,
  fps,
  duration,
  onPlayPause,
  onPrevFrame,
  onNextFrame,
  onRestart,
  onSeek,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Timeline Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={Math.max(0, frameCount - 1)}
          value={currentFrame}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Frame {currentFrame + 1} / {frameCount}</span>
          <span>{fps} FPS</span>
          <span>{duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onRestart}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Restart"
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={onPrevFrame}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Previous Frame"
        >
          <SkipBack className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={onPlayPause}
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
          onClick={onNextFrame}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Next Frame"
        >
          <SkipForward className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

/**
 * Main Skeletal Animation Viewer component
 * Loads GLB model and applies quaternion-based skeletal animation
 *
 * @param {Object} props
 * @param {string} props.userId - User ID
 * @param {string} props.sessionId - Session ID
 * @param {string} props.filename - Animation filename (.bin)
 * @param {string} props.apiBaseUrl - API base URL
 * @param {string} props.jwtToken - JWT token for authentication
 * @param {string} props.modelPath - Path to GLB model
 * @param {boolean} props.autoPlay - Auto-play on load
 * @param {string} props.className - Additional CSS classes
 */
export default function SkeletalAnimationViewer({
  userId,
  sessionId,
  filename,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  jwtToken = null,
  modelPath = "/models/mesh.glb",
  autoPlay = false,
  className = "",
}) {
  // Load animation data
  const { animation, loading, error } = useQuaternionAnimation(
    userId,
    sessionId,
    filename,
    apiBaseUrl,
    jwtToken
  );

  // Playback controls
  const playback = useAnimationPlayback(animation, autoPlay);

  // Show loading state
  if (loading) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex-1 min-h-[400px] relative rounded-xl overflow-hidden">
          <LoadingSkeleton message="Loading animation..." />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex-1 min-h-[400px] relative rounded-xl overflow-hidden">
          <ErrorDisplay error={error} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 3D Viewer */}
      <div className="flex-1 min-h-[400px] relative rounded-xl overflow-hidden bg-gray-50">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false
          }}
          onCreated={({ gl }) => {
            gl.getContext().canvas.addEventListener('webglcontextlost', (e) => {
              console.warn('[SkeletalAnimationViewer] WebGL context lost', e);
              e.preventDefault();
            });
          }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 1.2, 3]} fov={50} />
            <SceneSetup />

            <AnimatedSkeleton
              modelPath={modelPath}
              animation={animation}
              currentFrame={playback.currentFrame}
            />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={10}
              target={[0, 1, 0]}
            />
          </Suspense>
        </Canvas>

        {/* Frame counter overlay */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
          Frame {playback.currentFrame + 1} / {playback.frameCount}
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-3 left-3 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
          Drag to rotate • Scroll to zoom
        </div>
      </div>

      {/* Playback Controls */}
      {animation && (
        <div className="mt-4">
          <PlaybackControls
            isPlaying={playback.isPlaying}
            currentFrame={playback.currentFrame}
            frameCount={playback.frameCount}
            fps={playback.fps}
            duration={playback.duration}
            onPlayPause={playback.togglePlayPause}
            onPrevFrame={playback.prevFrame}
            onNextFrame={playback.nextFrame}
            onRestart={playback.restart}
            onSeek={playback.goToFrame}
          />
        </div>
      )}
    </div>
  );
}

// Preload the default model
useGLTF.preload("/models/mesh.glb");
