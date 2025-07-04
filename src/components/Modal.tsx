import React from 'react';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-0 relative animate-fadeIn" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal; 