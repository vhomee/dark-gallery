'use client';

import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import ExifReader from 'exifreader';
//import heic2any from 'heic2any'; // 引入转换工具

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

    // 如果是 HEIC，先显示一个临时 loading 状态，因为转换需要一点时间
    let heic2any;
    if (selectedFile.name.toLowerCase().endsWith('.heic')) {
       // ✅ 魔法在这里：按需加载
       const module = await import('heic2any');
       heic2any = module.default;
       
       setStatus('正在处理 HEIC 格式...');
    }

    setFile(selectedFile);
    
    // 生成预览图 (如果是 HEIC，浏览器无法直接预览，这里尝试转换后预览，或者直接用 FileReader)
    if (selectedFile.name.toLowerCase().endsWith('.heic')) {
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
        setPreview(URL.createObjectURL(selectedFile));
    }
    setStatus('');
  };

  const handleUpload = async () => {
    if (!file) return alert('请先选择一张照片');
    setLoading(true);
    setStatus('正在分析照片信息...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('请先登录');

      // 1. 读取原始文件的 EXIF (即使是 HEIC，ExifReader 也能读)
      const tags = await ExifReader.load(file);
      const exifData = {
        camera: tags['Model']?.description || 'Unknown Camera',
        lens: tags['LensModel']?.description || '',
        iso: tags['ISOSpeedRatings']?.description || '',
        fstop: tags['FNumber']?.description || '',
        shutter: tags['ExposureTime']?.description || '',
        date: tags['DateTimeOriginal']?.description || new Date().toISOString(),
      };

      // 2. 格式转换逻辑
      let fileToUpload = file;
      let fileExt = file.name.split('.').pop().toLowerCase();
      
      // 如果是 heic，转换成 jpeg
      if (fileExt === 'heic') {
        setStatus('正在转换 HEIC 格式...');
        const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8 // 压缩质量 0.8，既清晰又省流量
        });
        // 把 Blob 变成 File 对象
        fileToUpload = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), {
            type: "image/jpeg"
        });
        fileExt = 'jpg';
      }

      setStatus('正在上传图片到云端...');

      // 3. 上传处理后的文件
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
            title: title || '无题',
            url: publicUrl,
            user_id: user.id,
            user_email: user.email,
            exif_data: exifData,
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
          <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center bg-gray-900 relative">
            {/* 加一个 Loading 提示，因为 HEIC 转换需要几秒钟 */}
            {status && status.includes('处理') && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 text-purple-400 font-bold">
                    {status}
                </div>
            )}
            
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-[400px] mx-auto rounded shadow-lg" />
            ) : (
              <div className="text-gray-500 py-12">
                <p>点击下方选择图片</p>
                <p className="text-xs mt-2">支持 JPG, PNG, HEIC (iPhone)</p>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*,.heic" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700"
          />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">作品标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给这张照片起个名字..."
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