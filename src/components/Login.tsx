import React, { useState } from 'react';
import { hashPassword, loadAdminUser, saveAdminUser } from '../utils/storage';

const DEFAULT_ADMIN = {
  username: 'admin',
  passwordHash: '', // 최초 로그인 시 admin123 해시로 자동 생성
};

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    let admin = loadAdminUser();
    if (!admin) {
      // 최초 로그인: admin123 해시로 계정 생성
      const hash = await hashPassword('admin123');
      admin = { username: 'admin', passwordHash: hash };
      saveAdminUser(admin);
    }
    const inputHash = await hashPassword(password);
    if (username === admin.username && inputHash === admin.passwordHash) {
      onLogin();
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-full max-w-xs">
        <h2 className="text-2xl font-bold mb-6 text-center">관리자 로그인</h2>
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
      </form>
    </div>
  );
} 