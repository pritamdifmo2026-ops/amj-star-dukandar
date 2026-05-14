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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-cream w-[90%] max-w-[450px] rounded-[6px] shadow-xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 m-0">{title}</h2>
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
          <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
