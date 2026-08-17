/**
 * Toast / Snackbar system
 * Gunakan: const { showToast } = useToast();
 *          showToast('Nilai disimpan', 'success');
 */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  toasts: [],
  removeToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration = 3000,
  ) => {
    const id = `toast_${++counter.current}`;
    setToasts(prev => [...prev.slice(-2), { id, message, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
