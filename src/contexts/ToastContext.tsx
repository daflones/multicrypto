import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';

interface ToastContextType {
  showSuccess: (title: string, message: string, duration?: number) => string;
  showError: (title: string, message: string, duration?: number) => string;
  showWarning: (title: string, message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
