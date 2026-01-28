import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Toast, { type ToastType, type ToastAction } from '../components/ui/Toast';

interface ToastOptions {
  type: ToastType;
  title?: string;
  message: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
    }
    
    setToast(options);
    setIsVisible(true);

    if (options.duration !== 0) {
        const duration = options.duration || 5000;
        toastTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, duration);
    }
  }, []);

  useEffect(() => {
    return () => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
    }
    setIsVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          action={toast.action}
          isVisible={isVisible}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.showToast;
}
