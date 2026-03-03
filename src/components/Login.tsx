import React, { useState } from 'react';
import { hashPassword } from '../utils/storage';
import { firebaseStorage } from '../utils/firebaseStorage';
import { Sparkles, User, Lock, Loader2 } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let admin = await firebaseStorage.getAdminUser();

      if (!admin) {
        await firebaseStorage.createDefaultAdmin();
        admin = await firebaseStorage.getAdminUser();
      }

      const inputHash = await hashPassword(password);

      if (username === admin?.username && inputHash === admin?.passwordHash) {
        onLogin();
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      setError('로그인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen glass-bg p-4">
      <form onSubmit={handleLogin} className="glass-modal p-6 lg:p-8 rounded-xl w-full max-w-sm">
        <h2 className="text-xl lg:text-2xl font-bold mb-6 text-center">관리자 로그인</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">아이디</label>
          <input className="border rounded px-3 py-2 w-full" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">비밀번호</label>
          <input className="border rounded px-3 py-2 w-full" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
        

      <div className="relative w-full max-w-md animate-scaleIn">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-2xl shadow-blue-500/30 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">실적관리 시스템</h1>
          <p className="text-gray-500 mt-1">관리자 로그인</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="glass-card p-8">
          <div className="space-y-5">
            {/* 아이디 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="input-glass pl-12 w-full"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="아이디 입력"
                  autoFocus
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  className="input-glass pl-12 w-full"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                />
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="glass p-4 rounded-xl border border-rose-200 bg-rose-50/50 animate-slideIn">
                <p className="text-sm text-rose-600 text-center">{error}</p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                <span>로그인</span>
              )}
            </button>
          </div>
        </form>

        {/* 하단 정보 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">경기도체육회 스포츠박스</p>
        </div>
      </div>
    </div>
  );
}
