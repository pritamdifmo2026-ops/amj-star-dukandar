import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

const MessageModal: React.FC<MessageModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' 
}) => {
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;
  const iconColor = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center py-8 px-4 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
        >
          <Icon size={48} />
        </div>
        <p className="text-[1.1rem] text-gray-700 mb-8 leading-relaxed">{message}</p>
        <div className="w-full">
          <Button onClick={onClose} fullWidth>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default MessageModal;
