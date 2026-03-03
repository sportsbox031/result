import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const { type, title, message, duration = 5000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/90 to-white/90';
      case 'error':
        return 'border-l-rose-500 bg-gradient-to-r from-rose-50/90 to-white/90';
      case 'warning':
        return 'border-l-amber-500 bg-gradient-to-r from-amber-50/90 to-white/90';
      case 'info':
        return 'border-l-blue-500 bg-gradient-to-r from-blue-50/90 to-white/90';
      default:
        return 'border-l-blue-500 bg-gradient-to-r from-blue-50/90 to-white/90';
    }
  };

  return (
    <div
      className={`
        glass rounded-xl shadow-xl border-l-4 ${getStyles()}
        p-4 mb-3 max-w-sm lg:max-w-md mx-4 lg:mx-0
        animate-slideIn backdrop-blur-xl
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-4 flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="알림 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
