'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartIcon, CameraIcon, FilmIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

// ⚠️⚠️⚠️ 【重要】请把这里改成你自己的邮箱！
const ADMIN_EMAIL = 'michael_cup@outlook.com'; 

export default function Home() {
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [likedPhotos, setLikedPhotos] = useState(new Set()); // 记录我点过赞的照片ID
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 初始化
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // 1. 获取用户
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. 获取照片
      await fetchPhotos();
      
      // 3. 如果用户登录了，检查一下他点过哪些赞 (为了让红心亮起来)
      if (user) {
        const { data: likes } = await supabase.from('likes').select('photo_id').eq('user_id', user.id);
        if (likes) {
          setLikedPhotos(new Set(likes.map(l => l.photo_id)));
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // 重新拉取照片列表
  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setPhotos(data || []);
  };

  // 处理点赞逻辑
  const handleLike = async (photoId) => {
    if (!user) return alert('请先登录才能点赞哦！');
    if (likedPhotos.has(photoId)) return alert('你已经赞过这张照片啦！');

    // 1. 前端乐观更新 (先变红，反应更快)
    const newLiked = new Set(likedPhotos);
    newLiked.add(photoId);
    setLikedPhotos(newLiked);
    
    // 前端数字+1
    setPhotos(photos.map(p => p.id === photoId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));

    try {
      // 2. 调用数据库函数 +1
      await supabase.rpc('vote_photo', { row_id: photoId });
      // 3. 记录“我赞过这张图”
      await supabase.from('likes').insert({ user_id: user.id, photo_id: photoId });
    } catch (error) {
      console.error('点赞失败', error);
      // 如果失败了，这里应该回滚状态，但为了简单先略过
    }
  };

  // 处理删除逻辑
  const handleDelete = async (photoPath, photoId) => {
    const confirm = window.confirm('确定要永久删除这张照片吗？此操作不可恢复。');
    if (!confirm) return;

    try {
      // 1. 从 Storage 文件桶删除图片文件 (路径通常是 user_id/文件名)
      // 我们存储的 url 是完整链接，需要提取出相对路径。
      // 比如: .../photos/实际上/是/这/部分.jpg
      const path = photoPath.split('/photos/')[1]; 
      
      if (path) {
        const { error: storageError } = await supabase.storage.from('photos').remove([path]);
        if (storageError) console.warn('文件删除可能有误(但不影响数据库删除):', storageError);
      }

      // 2. 从数据库删除记录
      const { error: dbError } = await supabase.from('photos').delete().eq('id', photoId);
      if (dbError) throw dbError;

      // 3. 刷新列表
      alert('删除成功');
      fetchPhotos();

    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  // 选出 Hero 图片
  const heroPhoto = photos.length > 0 
    ? [...photos].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))[0] 
    : null;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      {/* 导航 */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center border-b border-gray-800/50 backdrop-blur-md z-50 bg-black/60">
        <div className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          DARK.GALLERY
        </div>
        <div className="flex items-center space-x-6 text-sm font-medium text-gray-400">
          {user && <Link href="/upload" className="hover:text-white transition-colors text-purple-400">+ 上传</Link>}
          {user ? (
            <button onClick={async () => { await supabase.auth.signOut(); setUser(null); window.location.reload(); }} className="hover:text-white">退出</button>
          ) : (
            <Link href="/login" className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200">登录</Link>
          )}
        </div>
      </nav>

      {/* 内容 */}
      <main className="pb-20">
        {/* Hero Section */}
        {heroPhoto && (
          <header className="relative h-[80vh] w-full overflow-hidden flex items-end mb-20">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            <img src={heroPhoto.url} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Hero" />
            <div className="relative z-20 p-8 max-w-7xl mx-auto w-full">
              <div className="inline-block px-3 py-1 mb-4 text-xs font-bold text-black bg-white rounded-full uppercase">最佳作品</div>
              <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-white drop-shadow-lg">{heroPhoto.title}</h1>
              <div className="flex items-center gap-4 text-gray-300 text-sm">
                <span>by {heroPhoto.user_email?.split('@')[0]}</span>
                <span className="flex items-center gap-1"><HeartIconSolid className="w-4 h-4 text-pink-500"/> {heroPhoto.likes_count || 0}</span>
              </div>
            </div>
          </header>
        )}

        {/* 照片墙 */}
        <div className="max-w-7xl mx-auto px-6 masonry-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-20 md:pt-0">
            {photos.map((photo) => (
                <div key={photo.id} className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all hover:-translate-y-1">
                    <div className="aspect-[4/5] overflow-hidden bg-gray-950 relative">
                         <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                         
                         {/* 管理员删除按钮 (只有你是管理员，或者你是作者时显示) */}
                         {(user?.email === ADMIN_EMAIL || user?.id === photo.user_id) && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(photo.url, photo.id); }}
                              className="absolute top-3 right-3 bg-red-500/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              title="删除照片"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                         )}
                    </div>

                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-white truncate pr-4">{photo.title}</h3>
                                <p className="text-xs text-gray-500">@{photo.user_email?.split('@')[0]}</p>
                            </div>
                            {/* 点赞按钮 */}
                            <button 
                              onClick={() => handleLike(photo.id)}
                              className="transition-transform active:scale-125"
                            >
                                {likedPhotos.has(photo.id) ? (
                                  <HeartIconSolid className="w-6 h-6 text-pink-500" />
                                ) : (
                                  <HeartIcon className="w-6 h-6 text-gray-500 hover:text-pink-500" />
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 bg-black/30 p-3 rounded-lg border border-gray-800/50">
                            <div className="flex items-center gap-2 truncate"><CameraIcon className="w-3 h-3" /> <span>{photo.exif_data?.camera || 'Unknown'}</span></div>
                            <div className="flex items-center gap-2"><FilmIcon className="w-3 h-3" /> <span>ISO {photo.exif_data?.iso || '-'}</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 border border-gray-500 rounded-full flex items-center justify-center text-[8px]">f</div> <span>{photo.exif_data?.fstop || '-'}</span></div>
                            <div className="flex items-center gap-2"><ClockIcon className="w-3 h-3" /> <span>{photo.exif_data?.shutter || '-'}</span></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}