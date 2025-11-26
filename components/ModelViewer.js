// @ts-ignore
'use client';

import React, { useEffect } from 'react';

export default function ModelViewer({ url }) {
  
  useEffect(() => {
    // 动态引入 model-viewer 核心文件 (仅在客户端加载)
    import('@google/model-viewer');
  }, []);

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      
      {/* Google Model Viewer 组件 
        - src: 模型链接
        - camera-controls: 允许用户旋转缩放
        - auto-rotate: 自动旋转
        - ar: 开启 AR 模式 (Android/iOS 支持的话会出现 AR 按钮)
        - shadow-intensity: 阴影强度
        - touch-action="pan-y": 优化移动端触摸
      */}
      <model-viewer
        src={url}
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        shadow-intensity="1"
        camera-orbit="45deg 55deg 2.5m"
        field-of-view="30deg"
        style={{ width: '100%', height: '100%', backgroundColor: '#000000' }}
      >
        {/* 加载时的进度条插槽 */}
        <div slot="progress-bar" className="absolute top-0 left-0 w-full h-1 bg-gray-800">
          <div className="h-full bg-purple-500 progress-bar-value"></div>
        </div>

        {/* 加载失败时的提示 */}
        <div slot="error" className="absolute inset-0 flex items-center justify-center text-white/50">
           无法加载模型
        </div>
        
        {/* 自定义加载中海报 (可选) */}
        <div slot="poster" className="flex items-center justify-center w-full h-full bg-black text-purple-500 font-bold animate-pulse">
           Loading Model...
        </div>
      </model-viewer>
    </div>
  );
}