import React, { useState } from 'react';
import { hashPassword } from '../utils/storage';
import { firebaseStorage } from '../utils/firebaseStorage';



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
      
      // 최초 로그인인 경우 admin123으로 계정 생성
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <form onSubmit={handleLogin} className="bg-white p-6 lg:p-8 rounded-xl shadow-md w-full max-w-sm">
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
        

      </form>
    </div>
  );
} 