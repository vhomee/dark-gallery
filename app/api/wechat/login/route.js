import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: '缺少 code' }, { status: 400 });
    }

    // 1. 找微信服务器换取 OpenID
    const appId = process.env.WECHAT_APP_ID;
    const secret = process.env.WECHAT_APP_SECRET;
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const wxRes = await fetch(wxUrl);
    const wxData = await wxRes.json();

    if (wxData.errcode) {
      return NextResponse.json({ error: wxData.errmsg }, { status: 400 });
    }

    const { openid } = wxData;

    // 2. 初始化 Supabase 超级管理员模式
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // ⚠️ 必须用 Service Role Key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 3. "影子账号"策略
    // 因为 Supabase 没有原生微信登录，我们用 OpenID 伪造一个邮箱账号
    // 邮箱: openid@wechat.darkgallery.com
    // 密码: openid (或者你可以加点盐，比如 openid + secret)
    const email = `${openid}@wechat.darkgallery.com`;
    const password = `${openid}_darkgallery_secret`; // 简单粗暴的密码策略

    // 4. 尝试登录
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 5. 如果登录失败（说明是新用户），那就直接注册！
    if (error) {
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 直接确认邮箱，不需要验证
        user_metadata: { provider: 'wechat', openid: openid }
      });
      
      if (signUpError) {
        return NextResponse.json({ error: signUpError.message }, { status: 500 });
      }
      
      // 注册完，把用户信息返回（主要是为了 session）
      // 这里为了简单，我们再次登录一次获取 session，或者直接返回 signUpData
      const loginRetry = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      data = loginRetry.data;
    }

    // 6. 把 Supabase 的通行证 (Session) 返回给小程序
    return NextResponse.json(data);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}