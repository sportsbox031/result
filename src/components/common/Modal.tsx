import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: ModalSize;
  /** 헤더 우측 닫기(X) 버튼 표시 여부. title이 있을 때만 헤더가 렌더링된다. */
  showCloseButton?: boolean;
  /** 오버레이 클릭/ESC로 닫기 허용 여부 (삭제 진행 중 등 잠금이 필요할 때 false) */
  dismissible?: boolean;
}

// 공통 모달: 오버레이 클릭/ESC 닫기, 사이즈, 선택적 헤더를 제공한다.
const Modal: React.FC<ModalProps> = ({
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  dismissible = true
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, dismissible]);

  return (
    <div
      className="modal-overlay animate-fadeIn"
      onClick={() => dismissible && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`modal-content w-full ${SIZE_CLASSES[size]} animate-scaleIn`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className={`${title ? 'p-6 overflow-y-auto max-h-[70vh]' : 'p-8'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
