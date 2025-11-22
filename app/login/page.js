'use client'; // 这是一个客户端组件，因为我们要处理用户输入

import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // 处理登录
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage('登录失败: ' + error.message);
    } else {
      // 登录成功，跳转回首页
      router.push('/');
      router.refresh(); // 刷新页面以更新状态
    }
    setLoading(false);
  };

  // 处理注册
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage('注册失败: ' + error.message);
    } else {
      setMessage('注册成功！请直接登录。');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl border border-gray-800 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            加入光影
          </h2>
          <p className="text-gray-500 mt-2">开启你的暗黑美学之旅</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-gray-800 border border-gray-700 rounded text-sm text-pink-400 text-center">
            {message}
          </div>
        )}

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? '处理中...' : '登录'}
            </button>
            <button
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-700 border border-gray-700 transition-colors disabled:opacity-50"
            >
              注册
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}