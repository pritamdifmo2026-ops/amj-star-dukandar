import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import styles from './MessageModal.module.css';

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
      <div className={styles.container}>
        <div className={styles.iconWrapper} style={{ backgroundColor: `${iconColor}15`, color: iconColor }}>
          <Icon size={48} />
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button onClick={onClose} fullWidth>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default MessageModal;
