import React, { useState } from 'react';
import { hashPassword, loadAdminUser, saveAdminUser } from '../utils/storage';

export default function ChangePassword({ onClose }: { onClose: () => void }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    const admin = loadAdminUser();
    if (!admin) {
      setError('관리자 계정이 존재하지 않습니다.');
      setLoading(false);
      return;
    }
    const oldHash = await hashPassword(oldPw);
    if (oldHash !== admin.passwordHash) {
      setError('기존 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }
    if (newPw.length < 6) {
      setError('새 비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }
    if (newPw !== newPw2) {
      setError('새 비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }
    const newHash = await hashPassword(newPw);
    saveAdminUser({ username: 'admin', passwordHash: newHash });
    setMsg('비밀번호가 성공적으로 변경되었습니다.');
    setOldPw(''); setNewPw(''); setNewPw2('');
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <form onSubmit={handleChange} className="bg-white p-8 rounded-xl shadow-md w-full max-w-xs relative">
        <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-6 text-center">비밀번호 변경</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">기존 비밀번호</label>
          <input className="border rounded px-3 py-2 w-full" type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} autoFocus />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">새 비밀번호</label>
          <input className="border rounded px-3 py-2 w-full" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
          <input className="border rounded px-3 py-2 w-full" type="password" value={newPw2} onChange={e => setNewPw2(e.target.value)} />
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {msg && <div className="text-green-600 text-sm mb-2">{msg}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition" disabled={loading}>
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
} 