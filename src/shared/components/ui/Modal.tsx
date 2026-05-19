import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-[oklch(0.99_0.01_80)] w-[90%] max-w-[450px] rounded-md shadow-[0_20px_25px_-5px_rgb(0_0_0/0.1),0_8px_10px_-6px_rgb(0_0_0/0.1)] overflow-hidden animate-[slideUp_0.3s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="py-5 px-6 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            className="border-none bg-none text-slate-400 cursor-pointer p-1 rounded-full transition-all duration-200 hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 text-slate-600 text-[15px] leading-relaxed">
          {children}
        </div>
        {footer && (
          <div className="py-4 px-6 bg-slate-50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
