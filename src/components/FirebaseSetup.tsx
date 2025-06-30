import React, { useState } from 'react';
import { Database, AlertCircle, CheckCircle, Settings } from 'lucide-react';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface FirebaseSetupProps {
  onConfigSave: (config: FirebaseConfig) => void;
  isConfigured: boolean;
}

const FirebaseSetup: React.FC<FirebaseSetupProps> = ({ onConfigSave, isConfigured }) => {
  const [showSetup, setShowSetup] = useState(!isConfigured);
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const handleInputChange = (field: keyof FirebaseConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (Object.values(config).every(value => value.trim() !== '')) {
      onConfigSave(config);
      setShowSetup(false);
    }
  };

  if (!showSetup && isConfigured) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-800">Firebase 연결됨</span>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="text-green-600 hover:text-green-800 text-sm flex items-center"
          >
            <Settings className="w-4 h-4 mr-1" />
            설정 변경
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-4">
        <Database className="w-6 h-6 text-blue-500 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Firebase 설정</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Firebase 프로젝트 설정 방법</h3>
            <ol className="text-sm text-blue-700 mt-2 space-y-1">
              <li>1. <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a>에서 새 프로젝트 생성</li>
              <li>2. Firestore Database 활성화 (테스트 모드로 시작)</li>
              <li>3. 프로젝트 설정 → 일반 → 웹 앱 추가</li>
              <li>4. 생성된 설정 정보를 아래에 입력</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <input
            type="text"
            value={config.apiKey}
            onChange={(e) => handleInputChange('apiKey', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="AIza..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Auth Domain</label>
          <input
            type="text"
            value={config.authDomain}
            onChange={(e) => handleInputChange('authDomain', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your-project.firebaseapp.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
          <input
            type="text"
            value={config.projectId}
            onChange={(e) => handleInputChange('projectId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your-project-id"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Storage Bucket</label>
          <input
            type="text"
            value={config.storageBucket}
            onChange={(e) => handleInputChange('storageBucket', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your-project.appspot.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Messaging Sender ID</label>
          <input
            type="text"
            value={config.messagingSenderId}
            onChange={(e) => handleInputChange('messagingSenderId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123456789"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
          <input
            type="text"
            value={config.appId}
            onChange={(e) => handleInputChange('appId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1:123456789:web:..."
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={!Object.values(config).every(value => value.trim() !== '')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          설정 저장
        </button>
      </div>
    </div>
  );
};

export default FirebaseSetup;