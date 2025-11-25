'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartIcon, CameraIcon, FilmIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

// --- 🆕 Swiper 相关引入 ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
// 引入 Swiper 的样式文件 (必须！)
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import '../app/swiper-custom.css'; // 稍后我们要创建这个自定义样式文件

const ADMIN_EMAIL = 'michael_cup@outlook.com'; // ⚠️ 记得改成你的邮箱

export default function Home() {
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [likedPhotos, setLikedPhotos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await fetchPhotos();
      if (user) {
        const { data: likes } = await supabase.from('likes').select('photo_id').eq('user_id', user.id);
        if (likes) setLikedPhotos(new Set(likes.map(l => l.photo_id)));
      }
    };
    init();
    const intervalId = setInterval(() => fetchPhotos(true), 5000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchPhotos = async (silent = false) => {
    if (!silent) setLoading(true);
    // 这里我们获取全部数据，然后在前端进行排序和筛选
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setPhotos(data || []);
    if (!silent) setLoading(false);
  };

  const handleLike = async (photoId) => {
    if (!user) return alert('请先登录才能点赞哦！');
    if (likedPhotos.has(photoId)) return alert('你已经赞过这张照片啦！');

    const newLiked = new Set(likedPhotos);
    newLiked.add(photoId);
    setLikedPhotos(newLiked);
    setPhotos(photos.map(p => p.id === photoId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));

    try {
      await supabase.rpc('vote_photo', { row_id: photoId });
      await supabase.from('likes').insert({ user_id: user.id, photo_id: photoId });
    } catch (error) {
      console.error('点赞失败', error);
    }
  };

  const handleDelete = async (photoPath, photoId) => {
    if (!window.confirm('确定要永久删除这张照片吗？')) return;
    try {
      const path = photoPath.split('/photos/')[1]; 
      if (path) await supabase.storage.from('photos').remove([path]);
      await supabase.from('photos').delete().eq('id', photoId);
      fetchPhotos(true);
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  // --- 🆕 计算 Top 5 ---
  // 1. 复制一份照片数组
  // 2. 按点赞数倒序排列
  // 3. 取前 5 个
  const top5Photos = photos.length > 0
    ? [...photos]
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      {/* 导航栏 (不变) */}
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

      <main className="pb-20">
        {/* --- 🆕 Hero Section (Swiper 轮播) --- */}
        {top5Photos.length > 0 && (
          <div className="relative h-[85vh] w-full mb-20 group/hero">
            <Swiper
              modules={[Autoplay, EffectFade, Pagination, Navigation]}
              effect={'fade'} // 淡入淡出效果
              speed={1000} // 切换速度 1秒
              autoplay={{
                delay: 5000, // 5秒自动播下一张
                disableOnInteraction: false, // 用户操作后继续自动播
              }}
              pagination={{ clickable: true, dynamicBullets: true }} //底部分页点
              navigation={true} // 左右箭头
              loop={top5Photos.length > 1} // 只有多于1张时才循环
              className="h-full w-full"
            >
              {top5Photos.map((photo, index) => (
                <SwiperSlide key={photo.id}>
                  {/* 这里的结构和之前单张 Hero 一样 */}
                  <header className="relative h-full w-full overflow-hidden flex items-end">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                    {/* 增加了一个缓慢缩放的动画效果 */}
                    <img src={photo.url} className="absolute inset-0 w-full h-full object-cover opacity-90 animate-slow-zoom" alt="Hero" />
                    <div className="relative z-20 p-8 max-w-7xl mx-auto w-full mb-12">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="inline-block px-3 py-1 text-xs font-bold text-black bg-white rounded-full uppercase">
                          TOP {index + 1}
                        </div>
                        {index === 0 && <span className="text-yellow-500 animate-pulse">👑 本周最佳</span>}
                      </div>
                      <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-white drop-shadow-lg truncate">{photo.title}</h1>
                      <div className="flex items-center gap-4 text-gray-300 text-sm">
                        <span>by {photo.user_email?.split('@')[0]}</span>
                        <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                          <HeartIconSolid className="w-4 h-4 text-pink-500"/>
                          <span className="font-bold text-white">{photo.likes_count || 0}</span>
                        </span>
                      </div>
                    </div>
                  </header>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* --- 照片墙 (不变) --- */}
        <div className="max-w-7xl mx-auto px-6 masonry-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-20 md:pt-0 relative z-30">
            {/* ... 这里是照片墙的代码，和之前一模一样，为了节省篇幅省略，请保留原来的 ... */}
            {photos.map((photo) => (
                <div key={photo.id} className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all hover:-translate-y-1">
                    {/* ... 内容省略，请保留原来的 ... */}
                    <div className="aspect-[4/5] overflow-hidden bg-gray-950 relative">
                         <img src={photo.url} alt={photo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                         {(user?.email === ADMIN_EMAIL || user?.id === photo.user_id) && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(photo.url, photo.id); }}
                              className="absolute top-3 right-3 bg-red-500/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                              title="删除照片"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                         )}
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-white truncate pr-4">{photo.title || '无题'}</h3>
                                <p className="text-xs text-gray-500">@{photo.user_email?.split('@')[0]}</p>
                            </div>
                            <button onClick={() => handleLike(photo.id)} className="flex items-center gap-1 transition-transform active:scale-125 group/btn">
                                <span className="text-sm font-medium text-gray-500 group-hover/btn:text-pink-500">{photo.likes_count || 0}</span>
                                {likedPhotos.has(photo.id) ? (<HeartIconSolid className="w-6 h-6 text-pink-500" />) : (<HeartIcon className="w-6 h-6 text-gray-500 group-hover/btn:text-pink-500" />)}
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