"use client";

import { useRef, useEffect, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Loader2 } from "lucide-react";

/**
 * SMPL Model with vertices applied to GLB mesh
 * Loads GLB model for UV coordinates and updates geometry with SMPL vertices
 * Face indices are provided from backend via useSmplFaces hook
 */
function SmplModelMesh({
  vertices,
  faceIndices,
  modelPath = "/src/app/models/mesh.glb",
  texturePath = null,
  wireframe = false
}) {
  const meshRef = useRef();
  const [model, setModel] = useState(null);

  // Load GLB model (for UV coordinates only)
  const gltf = useGLTF(modelPath);

  // Load texture if provided
  const texture = useTexture(
    texturePath || "/src/app/components/textures/Ch31_1001_Diffuse.png"
  );

  // Extract the mesh from the GLB (for UV coordinates)
  useEffect(() => {
    if (!gltf) return;

    console.log("[SmplModelMesh] GLB loaded");

    // Find the first mesh in the GLB
    let foundMesh = null;
    gltf.scene.traverse((child) => {
      if (child.isMesh && !foundMesh) {
        foundMesh = child;
        console.log("[SmplModelMesh] Found mesh:", child.name);
      }
    });

    if (foundMesh) {
      setModel(foundMesh);
    } else {
      console.warn("[SmplModelMesh] No mesh found in GLB");
    }
  }, [gltf]);

  // Update the mesh geometry with SMPL vertices
  useEffect(() => {
    if (!model || !vertices || !faceIndices) {
      if (vertices && !faceIndices) {
        console.log("[SmplModelMesh] Waiting for face indices...");
      }
      return;
    }

    console.log("[SmplModelMesh] Updating mesh with SMPL vertices:", vertices.length / 3, "vertices");

    // Create new geometry
    const newGeometry = new THREE.BufferGeometry();

    // Set SMPL vertices
    const positionAttribute = new THREE.BufferAttribute(vertices, 3);
    newGeometry.setAttribute("position", positionAttribute);

    // Set face indices from backend
    newGeometry.setIndex(new THREE.BufferAttribute(faceIndices, 1));

    // Copy UV coordinates from original geometry if available
    if (model.geometry.attributes.uv) {
      newGeometry.setAttribute("uv", model.geometry.attributes.uv.clone());
    }

    // Compute normals
    newGeometry.computeVertexNormals();
    newGeometry.computeBoundingSphere();

    // Update the mesh
    model.geometry.dispose(); // Clean up old geometry
    model.geometry = newGeometry;

    // Apply texture if available
    if (texture && model.material) {
      if (Array.isArray(model.material)) {
        model.material.forEach((mat) => {
          mat.map = texture;
          mat.needsUpdate = true;
        });
      } else {
        model.material.map = texture;
        model.material.needsUpdate = true;
      }
    }

    console.log("[SmplModelMesh] Mesh updated successfully with", faceIndices.length / 3, "faces");
  }, [model, vertices, faceIndices, texture]);

  // Gentle rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      // Keep X rotation at PI (180°) for correct orientation
      meshRef.current.rotation.x = Math.PI;
      // Subtle idle Y rotation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  if (!model || !vertices) return null;

  return (
    <group ref={meshRef} rotation={[Math.PI, 0, 0]}>
      <primitive
        object={model}
        castShadow
        receiveShadow
      />
    </group>
  );
}

/**
 * Alternative: Direct mesh with texture
 * Creates a mesh from scratch with SMPL vertices and applies texture
 * Face indices are provided from backend via useSmplFaces hook
 */
function SmplTexturedMesh({
  vertices,
  faceIndices,
  texturePath = "/src/app/components/textures/Ch31_1001_Diffuse.png",
  wireframe = false
}) {
  const meshRef = useRef();
  const geometryRef = useRef();

  // Load texture
  const texture = useTexture(texturePath);

  // Create geometry with vertices and face indices
  const geometry = useMemo(() => {
    if (!vertices || !faceIndices) {
      return new THREE.BufferGeometry();
    }

    console.log("[SmplTexturedMesh] Creating geometry with", vertices.length / 3, "vertices");
    const geo = new THREE.BufferGeometry();

    const positionAttribute = new THREE.BufferAttribute(vertices, 3);
    geo.setAttribute("position", positionAttribute);

    // Add face indices from backend
    geo.setIndex(new THREE.BufferAttribute(faceIndices, 1));

    // Generate UV coordinates (simple planar mapping)
    const uvs = new Float32Array(vertices.length / 3 * 2);
    for (let i = 0; i < vertices.length / 3; i++) {
      const x = vertices[i * 3];
      const z = vertices[i * 3 + 2];
      uvs[i * 2] = (x + 1) * 0.5; // Map x to [0, 1]
      uvs[i * 2 + 1] = (z + 1) * 0.5; // Map z to [0, 1]
    }
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    return geo;
  }, [vertices, faceIndices]);

  // Store ref
  useEffect(() => {
    geometryRef.current = geometry;
  }, [geometry]);

  // Update vertices for animation
  useEffect(() => {
    if (!vertices || !geometryRef.current || !faceIndices) return;

    const positionAttr = geometryRef.current.getAttribute("position");
    if (positionAttr && positionAttr.array !== vertices) {
      geometryRef.current.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometryRef.current.computeVertexNormals();
      geometryRef.current.computeBoundingSphere();
    }
  }, [vertices, faceIndices]);

  // Gentle rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.PI;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  if (!vertices || !faceIndices) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      castShadow
      receiveShadow
      rotation={[Math.PI, 0, 0]}
    >
      <meshStandardMaterial
        map={texture}
        wireframe={wireframe}
        side={THREE.DoubleSide}
        roughness={0.6}
        metalness={0.2}
      />
    </mesh>
  );
}

/**
 * Scene setup with camera and lighting
 */
function SceneSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1, 3);
    camera.lookAt(0, 0.8, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.6} />

      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <directionalLight position={[-3, 3, -3]} intensity={0.4} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f3f4f6" opacity={0.5} transparent />
      </mesh>

      {/* Grid helper */}
      <gridHelper args={[4, 20, "#e5e7eb", "#e5e7eb"]} position={[0, 0, 0]} />
    </>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
      <p className="text-sm text-gray-500">Loading 3D model...</p>
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
        <p className="text-sm text-gray-700 font-medium mb-1">Failed to load model</p>
        <p className="text-xs text-gray-500 mb-4">{error}</p>
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
 * Main SMPL Model Viewer component
 * Renders SMPL vertices with GLB model and textures
 * Face indices should be fetched from backend using useSmplFaces hook
 *
 * @param {Object} props
 * @param {Float32Array} props.vertices - SMPL vertex data
 * @param {Uint32Array} props.faceIndices - Face indices from useSmplFaces hook
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message if any
 * @param {Function} props.onRetry - Retry callback
 * @param {string} props.modelPath - Path to GLB model (default: /app/models/mesh.glb)
 * @param {string} props.texturePath - Path to texture (default: uses Ch31_1001_Diffuse.png)
 * @param {boolean} props.wireframe - Show wireframe mode
 * @param {boolean} props.useGLBModel - Use GLB model (true) or create mesh from scratch (false)
 * @param {string} props.className - Additional CSS classes
 */
export default function SmplModelViewer({
  vertices,
  faceIndices,
  loading = false,
  error = null,
  onRetry,
  modelPath = "/src/app/models/mesh.glb",
  texturePath = "/src/app/components/textures/Ch31_1001_Diffuse.png",
  wireframe = false,
  useGLBModel = true,
  className = "",
}) {
  // Show loading state
  if (loading) {
    return (
      <div className={`relative w-full h-full min-h-[300px] rounded-xl overflow-hidden ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`relative w-full h-full min-h-[300px] rounded-xl overflow-hidden ${className}`}>
        <ErrorDisplay error={error} onRetry={onRetry} />
      </div>
    );
  }

  // Show empty state if no vertices
  if (!vertices) {
    return (
      <div className={`relative w-full h-full min-h-[300px] rounded-xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-xl">3D</span>
            </div>
            <p className="text-sm text-gray-500">No mesh data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if we have vertices but no face indices yet
  if (!faceIndices) {
    return (
      <div className={`relative w-full h-full min-h-[300px] rounded-xl overflow-hidden ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-gray-50 ${className}`}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={50} />
          <SceneSetup />

          {useGLBModel ? (
            <SmplModelMesh
              vertices={vertices}
              faceIndices={faceIndices}
              modelPath={modelPath}
              texturePath={texturePath}
              wireframe={wireframe}
            />
          ) : (
            <SmplTexturedMesh
              vertices={vertices}
              faceIndices={faceIndices}
              texturePath={texturePath}
              wireframe={wireframe}
            />
          )}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={10}
            target={[0, 0.8, 0]}
          />
        </Suspense>
      </Canvas>

      {/* Controls hint */}
      <div className="absolute bottom-3 left-3 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

// Preload the GLB model for UV coordinates
useGLTF.preload("/src/app/models/mesh.glb");
