'use client';

import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import ExifReader from 'exifreader';
// 动态加载 heic2any
// import heic2any from 'heic2any'; 

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // 1. 检查文件类型
    const fileName = selectedFile.name.toLowerCase();
    const isModel = fileName.endsWith('.glb');
    const isHeic = fileName.endsWith('.heic');

    // 2. 如果是 HEIC，动态加载转换库
    let heic2any;
    if (isHeic) {
       setStatus('正在加载转换引擎...');
       const module = await import('heic2any');
       heic2any = module.default;
       setStatus('正在处理 HEIC 格式...');
    }

    setFile(selectedFile);
    
    // 3. 生成预览
    if (isModel) {
      // 📦 模型显示图标
      setPreview('3d-model');
    } else if (isHeic) {
        // HEIC 转换预览
        try {
            const convertedBlob = await heic2any({
                blob: selectedFile,
                toType: "image/jpeg",
                quality: 0.8
            });
            setPreview(URL.createObjectURL(convertedBlob));
        } catch (err) {
            console.error(err);
        }
    } else {
        // 普通图片直接预览
        setPreview(URL.createObjectURL(selectedFile));
    }
    setStatus('');
  };

  const handleUpload = async () => {
    if (!file) return alert('请先选择文件');
    setLoading(true);
    setStatus('正在分析文件...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('请先登录');

      const fileNameLower = file.name.toLowerCase();
      const isModel = fileNameLower.endsWith('.glb');
      const isHeic = fileNameLower.endsWith('.heic');

      // 🛑 【关键修复】如果是模型，跳过 EXIF 读取
      let exifData = {}; 
      
      if (!isModel) {
        try {
          const tags = await ExifReader.load(file);
          exifData = {
            camera: tags['Model']?.description || 'Unknown Camera',
            lens: tags['LensModel']?.description || '',
            iso: tags['ISOSpeedRatings']?.description || '',
            fstop: tags['FNumber']?.description || '',
            shutter: tags['ExposureTime']?.description || '',
            date: tags['DateTimeOriginal']?.description || new Date().toISOString(),
          };
        } catch (e) {
          console.warn('EXIF读取失败，可能是非标准图片', e);
        }
      }

      // 2. 格式转换逻辑 (仅针对 HEIC)
      let fileToUpload = file;
      let fileExt = fileNameLower.split('.').pop();
      
      if (isHeic) {
        const module = await import('heic2any');
        const heic2any = module.default;

        setStatus('正在转换 HEIC 格式...');
        const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8
        });
        fileToUpload = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
            type: "image/jpeg"
        });
        fileExt = 'jpg';
      }

      setStatus('正在上传到云端...');

      // 3. 上传
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      // 4. 获取链接
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      setStatus('正在保存数据库记录...');

      // 5. 写入数据库
      const { error: dbError } = await supabase
        .from('photos')
        .insert([
          {
            title: title || (isModel ? '未命名模型' : '无题'),
            url: publicUrl,
            user_id: user.id,
            user_email: user.email,
            exif_data: exifData, // 模型为空，图片有数据
            media_type: isModel ? 'model' : 'image', // 标记类型
          },
        ]);

      if (dbError) throw dbError;

      setStatus('发布成功！正在跳转...');
      setTimeout(() => router.push('/'), 1000);

    } catch (error) {
      console.error(error);
      setStatus(`出错了: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          发布新作
        </h1>

        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center bg-gray-900 relative min-h-[300px] flex flex-col items-center justify-center">
            {status && status.includes('处理') && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 text-purple-400 font-bold">
                    {status}
                </div>
            )}
            
            {preview === '3d-model' ? (
              <div className="text-purple-400 flex flex-col items-center animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                <span className="font-bold">3D 模型已就绪</span>
                <span className="text-xs text-gray-500 mt-2">{file?.name}</span>
              </div>
            ) : preview ? (
              <img src={preview} alt="Preview" className="max-h-[400px] mx-auto rounded shadow-lg" />
            ) : (
              <div className="text-gray-500 py-12">
                <p>点击下方选择 图片 或 3D模型(.glb)</p>
                <p className="text-xs mt-2">支持 JPG, PNG, HEIC, GLB</p>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*,.heic,.glb" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700"
          />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">作品标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给它起个名字..."
              className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? status : '确认发布'}
          </button>
          
          <div className="text-center">
             <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-gray-300">取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}