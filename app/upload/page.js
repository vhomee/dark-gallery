'use client';

import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import ExifReader from 'exifreader';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  // 🆕 新增：封面图文件
  const [coverFile, setCoverFile] = useState(null); 
  const [preview, setPreview] = useState(null);
  // 🆕 新增：封面图预览
  const [coverPreview, setCoverPreview] = useState(null);
  
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  // 处理主文件 (图片或模型)
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isModel = fileName.endsWith('.glb');
    const isHeic = fileName.endsWith('.heic');

    setFile(selectedFile);
    
    // 如果是模型，显示特定图标；如果是图片，显示预览
    if (isModel) {
      setPreview('3d-model');
    } else if (isHeic) {
       setStatus('正在加载转换引擎...');
       const module = await import('heic2any');
       const heic2any = module.default;
       setStatus('正在处理 HEIC...');
       try {
          const convertedBlob = await heic2any({ blob: selectedFile, toType: "image/jpeg", quality: 0.8 });
          setPreview(URL.createObjectURL(convertedBlob));
       } catch (err) { console.error(err); }
       setStatus('');
    } else {
       setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // 🆕 新增：处理封面图选择
  const handleCoverChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setCoverFile(selectedFile);
      setCoverPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('请先选择文件');
    // 🆕 如果是模型，强制要求传封面
    if (preview === '3d-model' && !coverFile) return alert('请为 3D 模型上传一张封面图');

    setLoading(true);
    setStatus('正在验证身份...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('请先登录');

      const fileNameLower = file.name.toLowerCase();
      const isModel = fileNameLower.endsWith('.glb');
      const isHeic = fileNameLower.endsWith('.heic');
      let exifData = {};

      // 1. 处理主文件
      let fileToUpload = file;
      let fileExt = fileNameLower.split('.').pop();

      if (!isModel) {
         // ... 读取 EXIF (省略重复代码，保持原有逻辑) ...
         try {
            const tags = await ExifReader.load(file);
            exifData = {
              camera: tags['Model']?.description || 'Unknown',
              iso: tags['ISOSpeedRatings']?.description || '',
              fstop: tags['FNumber']?.description || '',
              shutter: tags['ExposureTime']?.description || '',
            };
         } catch (e) {}
      }

      if (isHeic) {
        // ... HEIC 转换 (省略重复代码) ...
        const module = await import('heic2any');
        const heic2any = module.default;
        const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
        fileToUpload = new File([convertedBlob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
        fileExt = 'jpg';
      }

      // 2. 上传主文件
      setStatus('正在上传主文件...');
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, fileToUpload);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);

      // 3. 🆕 上传封面图 (如果有)
      let coverUrl = null;
      if (isModel && coverFile) {
        setStatus('正在上传封面图...');
        const coverName = `cover_${Date.now()}.jpg`;
        const coverPath = `${user.id}/${coverName}`;
        
        const { error: coverError } = await supabase.storage.from('photos').upload(coverPath, coverFile);
        if (coverError) throw coverError;
        
        const { data: { publicUrl: cUrl } } = supabase.storage.from('photos').getPublicUrl(coverPath);
        coverUrl = cUrl;
      }

      // 4. 写入数据库
      setStatus('正在保存...');
      const { error: dbError } = await supabase
        .from('photos')
        .insert([
          {
            title: title || (isModel ? '3D Model' : 'Untitled'),
            url: publicUrl, // 主文件地址
            thumbnail_url: coverUrl, // 🆕 封面图地址 (图片则是 null)
            user_id: user.id,
            user_email: user.email,
            exif_data: exifData,
            media_type: isModel ? 'model' : 'image',
          },
        ]);

      if (dbError) throw dbError;

      setStatus('发布成功！');
      setTimeout(() => router.push('/'), 1000);

    } catch (error) {
      console.error(error);
      setStatus(`出错: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">发布新作</h1>

        <div className="space-y-6">
          {/* 主文件选择区 */}
          <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center bg-gray-900 relative min-h-[200px] flex flex-col items-center justify-center">
            {preview === '3d-model' ? (
              <div className="text-purple-400 flex flex-col items-center">
                <span className="text-4xl mb-2">📦</span>
                <span className="font-bold">3D 模型已就绪</span>
                <span className="text-xs text-gray-500 mt-1">{file?.name}</span>
              </div>
            ) : preview ? (
              <img src={preview} alt="Preview" className="max-h-[300px] rounded" />
            ) : (
              <div className="text-gray-500">
                <p>点击选择 图片 或 3D模型(.glb)</p>
              </div>
            )}
            {/* 隐藏的 input，覆盖在上面 */}
            <input type="file" accept="image/*,.heic,.glb" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>

          {/* 🆕 封面图选择区 (只在选中模型时显示) */}
          {preview === '3d-model' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-400 mb-2">上传封面图 (必填)</label>
              <div className="border border-gray-800 rounded-lg p-4 flex items-center gap-4 bg-gray-900">
                {coverPreview ? (
                  <img src={coverPreview} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center text-gray-600">?</div>
                )}
                <input type="file" accept="image/*" onChange={handleCoverChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-gray-800 file:text-white" />
              </div>
            </div>
          )}

          {/* 标题输入 */}
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="作品标题..." className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white" />

          {/* 按钮 */}
          <button onClick={handleUpload} disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50">
            {loading ? status : '确认发布'}
          </button>
          
          <button onClick={() => router.back()} className="w-full text-center text-gray-500 text-sm mt-4">取消</button>
        </div>
      </div>
    </div>
  );
}