import React, { useState, useEffect } from 'react';
import { hashPassword } from '../utils/storage';
import { firebaseStorage } from '../utils/firebaseStorage';
import { X, Lock, Loader2, CheckCircle } from 'lucide-react';

export default function ChangePassword({ onClose }: { onClose: () => void }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [msg, onClose]);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      const admin = await firebaseStorage.getAdminUser();
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
      await firebaseStorage.saveAdminUser({ username: 'admin', passwordHash: newHash });
      setMsg('비밀번호가 성공적으로 변경되었습니다.');
      setOldPw(''); setNewPw(''); setNewPw2('');
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      setError('비밀번호 변경 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-sm">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">비밀번호 변경</h2>
          </div>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {msg ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-emerald-600 font-medium">{msg}</p>
          </div>
        ) : (
          <form onSubmit={handleChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기존 비밀번호</label>
              <input
                className="input-glass"
                type="password"
                value={oldPw}
                onChange={e => setOldPw(e.target.value)}
                placeholder="현재 비밀번호 입력"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
              <input
                className="input-glass"
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="새 비밀번호 입력 (6자 이상)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
              <input
                className="input-glass"
                type="password"
                value={newPw2}
                onChange={e => setNewPw2(e.target.value)}
                placeholder="새 비밀번호 다시 입력"
              />
            </div>

            {error && (
              <div className="glass p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>변경 중...</span>
                </>
              ) : (
                <span>비밀번호 변경</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
