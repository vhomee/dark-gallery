'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// 1. 动态引入 3D 播放器 (关闭 SSR)
const ModelViewer = dynamic(() => import('../../components/ModelViewer'), { 
  ssr: false
});

// 2. 把“读取 URL”的逻辑剥离成一个内部组件
function ViewerContent() {
  const searchParams = useSearchParams();
  const modelUrl = searchParams.get('url');

  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-gray-500">
        未提供模型链接
      </div>
    );
  }

  return <ModelViewer url={modelUrl} />;
}

// 3. 主页面：只负责提供“安全气泡” (Suspense)
export default function Mobile3DPage() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* ⚠️ 关键修复：用 Suspense 包裹住使用 useSearchParams 的组件 */}
      <Suspense fallback={
        <div className="flex items-center justify-center w-screen h-screen bg-black text-purple-500 font-bold animate-pulse">
          正在加载 3D 引擎...
        </div>
      }>
        <ViewerContent />
      </Suspense>
      
      <div className="absolute top-4 left-4 z-50 text-white/50 text-xs pointer-events-none">
        Powered by Dark Gallery Web
      </div>
    </div>
  );
}