import React from 'react';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={onClose}>
      <div className="glass-modal rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-0 relative animate-fadeIn" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal; 