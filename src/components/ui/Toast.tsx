import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  type: ToastType;
  title?: string;
  message: string;
  action?: ToastAction;
  onClose: () => void;
  isVisible: boolean;
}

export default function Toast({ type, title, message, action, onClose, isVisible }: ToastProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle
  };
  
  const Icon = icons[type];
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          className={`
            fixed top-20 right-4 z-[100]
            max-w-md w-full p-4 rounded-2xl shadow-2xl border
            flex flex-col gap-3
            ${type === 'success' ? 'bg-white border-success-200 shadow-success-900/10' : ''}
            ${type === 'error' ? 'bg-white border-error-200 shadow-error-900/10' : ''}
            ${type === 'warning' ? 'bg-white border-warning-200 shadow-warning-900/10' : ''}
            ${type === 'info' ? 'bg-white border-blue-200 shadow-blue-900/10' : ''}
          `}
        >
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-xl flex-shrink-0
              ${type === 'success' ? 'bg-success-100 text-success-600' : ''}
              ${type === 'error' ? 'bg-error-100 text-error-600' : ''}
              ${type === 'warning' ? 'bg-warning-100 text-warning-600' : ''}
              ${type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
            `}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              {title && (
                <h3 className={`text-sm font-bold mb-1
                  ${type === 'success' ? 'text-gray-900' : ''}
                  ${type === 'error' ? 'text-gray-900' : ''}
                  ${type === 'warning' ? 'text-gray-900' : ''}
                  ${type === 'info' ? 'text-gray-900' : ''}
                `}>
                  {title}
                </h3>
              )}
              <p className="text-sm text-gray-600 leading-tight">
                {message}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors group"
            >
              <X className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
            </button>
          </div>

          {action && (
            <div className="pl-14">
              <button
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className={`
                  text-sm font-bold px-4 py-2 rounded-lg transition-colors w-full sm:w-auto
                  ${type === 'success' ? 'bg-success-50 text-success-700 hover:bg-success-100' : ''}
                  ${type === 'error' ? 'bg-error-50 text-error-700 hover:bg-error-100' : ''}
                  ${type === 'warning' ? 'bg-warning-50 text-warning-700 hover:bg-warning-100' : ''}
                  ${type === 'info' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''}
                `}
              >
                {action.label}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
