# SMPL Model Viewer - Usage Examples

This guide shows how to use the SMPL mesh loading hooks and viewers with GLB models and textures.

## Table of Contents
1. [Basic Setup](#basic-setup)
2. [Loading Multi-Frame Animations](#loading-multi-frame-animations)
3. [Using the Animation Viewer](#using-the-animation-viewer)
4. [Custom Textures](#custom-textures)
5. [Advanced Usage](#advanced-usage)

---

## Basic Setup

### 1. Load and Display Single Frame

```jsx
import { useSmplMeshLoader } from "@/app/hooks/useSmplMeshLoader";
import SmplModelViewer from "@/app/components/smpl/SmplModelViewer";

function MyComponent() {
  const frameUrl = `${process.env.NEXT_PUBLIC_API_URL}/trainer-app/smpl/pose/frame/userId/sessionId/folder/frame.bin`;

  const { vertices, loading, error } = useSmplMeshLoader(frameUrl, jwtToken);

  return (
    <SmplModelViewer
      vertices={vertices}
      loading={loading}
      error={error}
      modelPath="/app/models/mesh.glb"
      texturePath="/app/components/textures/Ch31_1001_Diffuse.png"
      apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
      jwtToken={jwtToken}
    />
  );
}
```

---

## Loading Multi-Frame Animations

### 2. Using Multi-Frame SMPL Files

Multi-frame SMPL files contain entire animations in a single binary file with this structure:
- Header: "SMPL" + frame count + vertex count + FPS (16 bytes)
- Body: All frames as Float32Arrays

#### Option A: Load Complete File (Best for Mobile)

```jsx
import { useMultiFrameFile } from "@/app/hooks/useSmplMeshLoader";

function DownloadAnimation() {
  const { arrayBuffer, metadata, loading, error, load } = useMultiFrameFile(
    userId,
    sessionId,
    "animation.bin",
    process.env.NEXT_PUBLIC_API_URL,
    jwtToken,
    false // Don't auto-load
  );

  const handleDownload = async () => {
    await load();

    if (arrayBuffer) {
      // Pass to mobile app or save locally
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'animation.bin';
      a.click();
    }
  };

  return (
    <div>
      <button onClick={handleDownload} disabled={loading}>
        {loading ? 'Downloading...' : 'Download Animation'}
      </button>

      {metadata && (
        <div>
          <p>Frames: {metadata.frameCount}</p>
          <p>FPS: {metadata.fps}</p>
          <p>Duration: {metadata.duration.toFixed(1)}s</p>
          <p>Size: {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  );
}
```

#### Option B: Stream Individual Frames (Best for Web)

```jsx
import { useMultiFrameSingleFrame } from "@/app/hooks/useSmplMeshLoader";
import SmplModelViewer from "@/app/components/smpl/SmplModelViewer";

function FrameByFramePlayer({ userId, sessionId, filename }) {
  const [frameIndex, setFrameIndex] = useState(0);

  const { vertices, loading, error } = useMultiFrameSingleFrame(
    userId,
    sessionId,
    filename,
    frameIndex,
    process.env.NEXT_PUBLIC_API_URL,
    jwtToken
  );

  return (
    <div>
      <SmplModelViewer
        vertices={vertices}
        loading={loading}
        error={error}
      />

      <input
        type="range"
        min="0"
        max="59"
        value={frameIndex}
        onChange={(e) => setFrameIndex(parseInt(e.target.value))}
      />
    </div>
  );
}
```

#### Option C: Preload All Frames (Best Performance)

```jsx
import { useMultiFramePreloader } from "@/app/hooks/useSmplMeshLoader";
import SmplModelViewer from "@/app/components/smpl/SmplModelViewer";

function PreloadedAnimation({ userId, sessionId, filename }) {
  const [currentFrame, setCurrentFrame] = useState(0);

  const { frames, loading, progress, error, frameCount } = useMultiFramePreloader(
    userId,
    sessionId,
    filename,
    process.env.NEXT_PUBLIC_API_URL,
    jwtToken
  );

  const vertices = frames.get(currentFrame);

  return (
    <div>
      {loading && <p>Loading frames: {progress.toFixed(0)}%</p>}

      <SmplModelViewer
        vertices={vertices}
        loading={loading}
        error={error}
      />

      <p>Frame {currentFrame + 1} / {frameCount}</p>
    </div>
  );
}
```

---

## Using the Animation Viewer

### 3. Complete Animation Playback with Controls

The easiest way to play animations is using the built-in `SmplAnimationViewer`:

```jsx
import SmplAnimationViewer from "@/app/components/smpl/SmplAnimationViewer";

function MyPage() {
  return (
    <SmplAnimationViewer
      userId="GGhs62idCsMFzC9eY3J4t5XTgtA2"
      sessionId="GGhs623310356690"
      filename="cam_1_track2_entryNone_bicep_curls_7.5_animation.bin"
      apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
      jwtToken={jwtToken}
      modelPath="/app/models/mesh.glb"
      texturePath="/app/components/textures/Ch31_1001_Diffuse.png"
      autoPlay={true}
      className="w-full h-[600px]"
    />
  );
}
```

This component includes:
- ✅ Automatic frame loading and playback
- ✅ Play/pause controls
- ✅ Frame-by-frame navigation
- ✅ Timeline scrubbing
- ✅ FPS and duration display

---

## Custom Textures

### 4. Switching Between Textures

Available textures in `/app/components/textures/`:
- `Ch31_1001_Diffuse.png` (default, 1 MB)
- `aCh31_1001_Diffuse.png` (1 MB)
- `aaCh31_1001_Diffuse.png` (352 KB)
- `aaCh31_1001_Diffuse55.png` (15.4 MB, high quality)
- `zzCh31_1002_Diffuse.png` (4.2 MB)

```jsx
import { useState } from "react";
import SmplModelViewer from "@/app/components/smpl/SmplModelViewer";

function TextureSwitcher({ vertices }) {
  const [texture, setTexture] = useState("Ch31_1001_Diffuse.png");

  const textures = [
    "Ch31_1001_Diffuse.png",
    "aCh31_1001_Diffuse.png",
    "aaCh31_1001_Diffuse.png",
    "aaCh31_1001_Diffuse55.png",
    "zzCh31_1002_Diffuse.png",
  ];

  return (
    <div>
      <SmplModelViewer
        vertices={vertices}
        texturePath={`/app/components/textures/${texture}`}
      />

      <select value={texture} onChange={(e) => setTexture(e.target.value)}>
        {textures.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}
```

---

## Advanced Usage

### 5. Custom Mesh without GLB Model

If you want to render SMPL vertices with texture but without loading the GLB model:

```jsx
<SmplModelViewer
  vertices={vertices}
  texturePath="/app/components/textures/Ch31_1001_Diffuse.png"
  useGLBModel={false} // Creates mesh from scratch
  wireframe={false}
/>
```

### 6. Wireframe Mode

```jsx
<SmplModelViewer
  vertices={vertices}
  wireframe={true}
/>
```

### 7. Get Multi-Frame Metadata Without Loading Frames

```jsx
import { useMultiFrameMetadata } from "@/app/hooks/useSmplMeshLoader";

function AnimationInfo({ userId, sessionId, filename }) {
  const { metadata, loading, error } = useMultiFrameMetadata(
    userId,
    sessionId,
    filename,
    process.env.NEXT_PUBLIC_API_URL,
    jwtToken
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3>Animation Info</h3>
      <p>Frames: {metadata.frameCount}</p>
      <p>Vertices per frame: {metadata.vertexCount}</p>
      <p>FPS: {metadata.fps}</p>
      <p>Duration: {metadata.duration}s</p>
      <p>File size: {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
      <p>Bytes per frame: {metadata.bytesPerFrame}</p>
    </div>
  );
}
```

### 8. Working with Pose Data from ZIP Files

The hooks automatically handle both storage formats:
- `smpl_data/` - Legacy per-frame files
- `pose_data/` - New zip-based storage (with multi-frame support)

```jsx
import { usePoseFrameUrls } from "@/app/hooks/useSmplMeshLoader";

function PoseDataExample() {
  // For pose_data/ (zip-based storage)
  const folderPath = "pose_data/userId/sessionId/bicep_curls_cam_1_2_0";

  const { frameUrls, loading, error, storageType, frameCount } = usePoseFrameUrls(
    folderPath,
    process.env.NEXT_PUBLIC_API_URL,
    jwtToken
  );

  console.log("Storage type:", storageType); // "pose_data"
  console.log("Frame count:", frameCount);
  console.log("Frame URLs:", frameUrls);

  // Use frameUrls with useSmplFramePreloader for animation
}
```

---

## API Endpoints Reference

### Multi-Frame Endpoints

```
GET /api/trainer-app/smpl/multi/:userId/:sessionId/:filename
    Returns: Complete multi-frame file
    Headers: X-Frame-Count, X-Vertex-Count, X-FPS

GET /api/trainer-app/smpl/multi/:userId/:sessionId/:filename/frame/:frameIndex
    Returns: Single frame as Float32Array

GET /api/trainer-app/smpl/multi/:userId/:sessionId/:filename/info
    Returns: Metadata only (frame count, FPS, size, etc.)
```

### Pose Data Endpoints (ZIP-based)

```
GET /api/trainer-app/smpl/pose/frames/:userId/:sessionId/:folder
    Returns: List of .bin filenames in the zip

GET /api/trainer-app/smpl/pose/frame/:userId/:sessionId/:folder/:filename
    Returns: Decompressed frame data
    Query param: ?frameIndex=N (if multi-frame file)
```

---

## Performance Tips

1. **For Web**: Use `useMultiFrameSingleFrame` to stream frames on-demand
2. **For Mobile**: Use `useMultiFrameFile` to download once and process locally
3. **For Smooth Playback**: Use `useMultiFramePreloader` to preload all frames
4. **Texture Size**: Use smaller textures (aaCh31_1001_Diffuse.png, 352KB) for faster loading
5. **Model Loading**: GLB models are cached by drei automatically

---

## Troubleshooting

### Issue: Mesh appears distorted
- Ensure face indices are loaded correctly
- Check that vertex count is 6890 (SMPL standard)

### Issue: Texture not applied
- Verify texture path is correct
- Check browser console for texture loading errors
- Try with `useGLBModel={false}` to create mesh from scratch

### Issue: Animation stutters
- Use `useMultiFramePreloader` to preload all frames
- Reduce FPS for smoother playback on slower devices
- Consider using lower resolution textures

---

## Complete Example: Production-Ready Animation Player

```jsx
"use client";

import { useState } from "react";
import SmplAnimationViewer from "@/app/components/smpl/SmplAnimationViewer";
import { useAuth } from "@/contexts/AuthContext";

export default function AnimationPlayerPage() {
  const { user, idToken } = useAuth();
  const [selectedTexture, setSelectedTexture] = useState("Ch31_1001_Diffuse.png");

  if (!user) {
    return <div>Please log in to view animations</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">SMPL Animation Player</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Select Texture
        </label>
        <select
          value={selectedTexture}
          onChange={(e) => setSelectedTexture(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="Ch31_1001_Diffuse.png">Default</option>
          <option value="aCh31_1001_Diffuse.png">Alternative 1</option>
          <option value="aaCh31_1001_Diffuse.png">Light (352KB)</option>
          <option value="aaCh31_1001_Diffuse55.png">High Quality (15MB)</option>
          <option value="zzCh31_1002_Diffuse.png">Alternative 2</option>
        </select>
      </div>

      <SmplAnimationViewer
        userId={user.uid}
        sessionId="GGhs623310356690"
        filename="cam_1_track2_entryNone_bicep_curls_7.5_animation.bin"
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
        jwtToken={idToken}
        modelPath="/app/models/mesh.glb"
        texturePath={`/app/components/textures/${selectedTexture}`}
        autoPlay={false}
        className="w-full h-[600px]"
      />
    </div>
  );
}
```

---

## Next Steps

- Add multiple camera angles
- Implement slow-motion playback
- Add frame export (as PNG/video)
- Implement comparison view (side-by-side animations)
- Add measurement tools (joint angles, distances)
