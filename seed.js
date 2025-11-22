const { createClient } = require('@supabase/supabase-js');

// ⚠️⚠️⚠️ 请先替换这三行！
const SUPABASE_URL = 'https://asptycrobjxcymkvxomu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcHR5Y3JvYmp4Y3lta3Z4b211Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxMDQ4MiwiZXhwIjoyMDc5Mjg2NDgyfQ.mdSgJlsMV8JRGJaNbAGI9F8fbyaOcliDW5RVnmkUa7w'; // 在设置->API里找 service_role (secret)
const USER_ID = '948191eb-a2ec-480b-986d-d413ec97ab04'; // 在 Authentication 里找你的 UUID

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// 预设的高质量暗黑风图片库 (来自 Unsplash)
const darkImages = [
  "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504333638930-c8787321eee0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1431440869543-efaf3388c585?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515462277126-2dd0c162007a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1535930749574-1399327ce78f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1524230659092-07f99a75c013?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1461301214746-1e790926d323?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1495615080073-6b89c9839ce0?auto=format&fit=crop&w=800&q=80"
];

// 随机 EXIF 生成器
const cameras = ['Leica M10', 'Sony A7R IV', 'Fujifilm X-T4', 'Hasselblad X1D', 'Canon EOS R5'];
const lenses = ['35mm f/1.4', '50mm f/1.2', '85mm f/1.8', '24-70mm f/2.8'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('🌱 开始播种数据...');

  const photosToInsert = darkImages.map((url, index) => {
    return {
      title: `Dark Series #${index + 1}`,
      url: url,
      user_id: USER_ID,
      user_email: 'demo@dark.gallery', // 假装这是你的邮箱
      likes_count: getRandomInt(5, 120), // 随机生成一些初始点赞
      exif_data: {
        camera: getRandomItem(cameras),
        lens: getRandomItem(lenses),
        iso: getRandomItem(['100', '200', '400', '800', '1600', '3200']),
        fstop: 'f/' + getRandomItem(['1.4', '1.8', '2.8', '4.0', '5.6']),
        shutter: '1/' + getRandomItem(['60', '125', '250', '500', '1000']),
        date: new Date().toISOString()
      },
      created_at: new Date(Date.now() - getRandomInt(0, 1000000000)).toISOString() // 随机过去的时间
    };
  });

  const { error } = await supabase.from('photos').insert(photosToInsert);

  if (error) {
    console.error('❌ 播种失败:', error);
  } else {
    console.log(`✅ 成功插入 ${photosToInsert.length} 张照片！快去刷新页面看看吧！`);
  }
}

seed();