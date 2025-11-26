'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// 动态引入之前的 ModelViewer 组件，关闭 SSR
const ModelViewer = dynamic(() => import('../../components/ModelViewer'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-black text-purple-500 font-bold animate-pulse">
      正在加载模型...
    </div>
  )
});

export default function Mobile3DPage() {
  const searchParams = useSearchParams();
  const modelUrl = searchParams.get('url');

  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-gray-500">
        未提供模型链接
      </div>
    );
  }

  return (
    // 强制铺满全屏，黑色背景
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <ModelViewer url={modelUrl} />
      
      {/* 可以在这里加一个返回按钮，或者提示文字 */}
      <div className="absolute top-4 left-4 z-50 text-white/50 text-xs pointer-events-none">
        Powered by Dark Gallery Web
      </div>
    </div>
  );
}