import React, { useEffect, useState } from 'react';
import { toast, type Toast as ToastType } from '../utils/toast';
import '../App.css';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToasts) => {
      setToasts(newToasts);
    });

    return () => unsubscribe();
  }, []);

  const handleRemove = (id: string) => {
    toast.remove(id);
  };

  const getToastIcon = (type: ToastType['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => handleRemove(toast.id)}
        >
          <span className="toast-icon">{getToastIcon(toast.type)}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={(e) => {
            e.stopPropagation();
            handleRemove(toast.id);
          }}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

