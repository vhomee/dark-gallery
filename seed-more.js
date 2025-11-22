const { createClient } = require('@supabase/supabase-js');

// ⚠️⚠️⚠️ 再次填入你的魔法钥匙
const SUPABASE_URL = 'https://asptycrobjxcymkvxomu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcHR5Y3JvYmp4Y3lta3Z4b211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxMDQ4MiwiZXhwIjoyMDc5Mjg2NDgyfQ.mdSgJlsMV8JRGJaNbAGI9F8fbyaOcliDW5RVnmkUa7w';
const USER_ID = '948191eb-a2ec-480b-986d-d413ec97ab04';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// 新增的精选暗黑/胶片/极简图库 (30+张)
const imagePool = [
  "https://images.unsplash.com/photo-1493804714600-6edb1cd937f7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1550927407-50e160527c2e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517502166878-35c93d406329?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1614917616140-5df1e4835697?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1481819613568-3701cbc70156?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1502426306691-1cb18d408f62?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1534260933201-cd4a3959f936?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1621600411688-4be93cd68504?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506259091721-347f796196b4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476158085676-e67f57ed9ed7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1575995872537-3793d29d972c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517462964005-580c0698286f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1447933601401-2b19082c5658?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500917293049-6130a8279977?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1550596334-7bb40a71b6bc?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1532517891316-72a08e5c03a7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507608869274-2c33ee13db69?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500322969630-a26ab6eb64cc?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517676109075-9a94d4499005?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500051638674-ff996a0ec29e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513569771920-c9e1d31714af?auto=format&fit=crop&w=800&q=80"
];

const cameras = ['Fujifilm GFX 100', 'Leica Q2', 'Sony A7S III', 'Canon R5', 'Ricoh GR III', 'Hasselblad 500C'];
const lenses = ['28mm f/1.7', '50mm f/1.2 GM', '35mm f/2', '80mm f/1.9', '110mm f/2'];
const titles = ['Silence', 'Void', 'Echo', 'Midnight', 'Shadows', 'Lost', 'Found', 'Urban', 'Solitude', 'Noir', 'Grain', 'Memory'];

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seedMore() {
  console.log('🚀 正在启动大规模填充引擎 (目标: +80张)...');
  
  const totalToAdd = 80;
  const batchSize = 10; // 每次插10条，防止卡顿
  
  for (let i = 0; i < totalToAdd; i++) {
    const photo = {
      title: `${getRandomItem(titles)} #${getRandomInt(100, 999)}`, // 随机生成像 "Void #832" 这样的标题
      url: imagePool[i % imagePool.length], // 循环使用图库
      user_id: USER_ID,
      user_email: 'artist@dark.gallery',
      likes_count: getRandomInt(0, 500), // 点赞数随机
      exif_data: {
        camera: getRandomItem(cameras),
        lens: getRandomItem(lenses),
        iso: getRandomItem(['100', '160', '400', '800', '3200']),
        fstop: 'f/' + getRandomItem(['1.2', '1.4', '2.0', '2.8', '5.6', '8']),
        shutter: '1/' + getRandomInt(60, 4000),
        date: new Date().toISOString()
      },
      // 随机生成过去一年内的时间，这样排序会有层次感
      created_at: new Date(Date.now() - getRandomInt(0, 31536000000)).toISOString()
    };

    const { error } = await supabase.from('photos').insert([photo]);
    
    if (error) console.error('插入失败:', error.message);
    
    // 显示一点进度条效果
    if ((i + 1) % 10 === 0) console.log(`已生成 ${i + 1} / ${totalToAdd} 张...`);
  }

  console.log(`🎉 任务完成！数据库现已新增 80 张大作。`);
}

seedMore();