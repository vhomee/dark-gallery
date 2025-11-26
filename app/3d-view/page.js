'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const ModelViewer = dynamic(() => import('../../components/ModelViewer'), { 
  ssr: false,
  loading: () => (
    // 加载过程也是黑底紫字
    <div className="flex items-center justify-center w-screen h-screen bg-black text-purple-500 font-bold animate-pulse">
      正在加载 3D 引擎...
    </div>
  )
});

function ViewerContent() {
  const searchParams = useSearchParams();
  const modelUrl = searchParams.get('url');

  if (!modelUrl) {
    return <div className="w-screen h-screen bg-black text-white">Error: No URL</div>;
  }

  // 🔴 关键修复：给 ModelViewer 的容器强制加上黑色背景和全屏尺寸
  return (
    <div className="w-screen h-screen bg-black absolute inset-0 overflow-hidden">
      <ModelViewer url={modelUrl} />
    </div>
  );
}

export default function Mobile3DPage() {
  return (
    // 🔴 加了 style={{ backgroundColor: '#000' }}
    <div 
      className="w-screen h-screen bg-black overflow-hidden fixed inset-0 z-[9999]"
      style={{ backgroundColor: '#000000' }} 
    >
      <Suspense fallback={
        <div className="w-screen h-screen bg-black flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
          {/* 这里可以加个紫色的 Loading 文字，让用户知道没死机 */}
          <span className="text-purple-500 font-bold animate-pulse">Loading 3D Engine...</span>
        </div>
      }>
        <ViewerContent />
      </Suspense>
    </div>
  );
}