'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';

// 这是核心：加载并渲染 GLTF/GLB 模型
function Model({ url }) {
  const { scene } = useGLTF(url);
  // <primitive> 是 R3F 用来渲染原生 Three.js 对象的
  return <primitive object={scene} />;
}

export default function ModelViewer({ url }) {
  return (
    <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden relative">
      {/* 3D 画布 */}
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
        {/* Suspense 是 React 的等待机制，模型加载完之前显示 fallback */}
        <Suspense fallback={null}>
          {/* Stage 是 Drei 提供的“舞台”，自动帮你打光、居中模型，超好用 */}
          <Stage environment="city" intensity={0.6}>
            <Model url={url} />
          </Stage>
        </Suspense>
        
        {/* 轨道控制器：允许用户旋转、缩放 */}
        <OrbitControls autoRotate autoRotateSpeed={0.5} makeDefault />
      </Canvas>
      
      {/* 右下角加个 3D 标志 */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded border border-white/20">
        3D VIEW
      </div>
    </div>
  );
}