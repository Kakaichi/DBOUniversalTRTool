// Simple Toast Notification System

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];
let toastIdCounter = 0;

export const toast = {
  // Add a new toast
  show: (message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    
    // Set default duration based on type
    let defaultDuration: number;
    if (duration !== undefined) {
      defaultDuration = duration;
    } else {
      // Error and warning toasts are persistent by default
      defaultDuration = (type === 'error' || type === 'warning') ? 0 : 5000;
    }
    
    const newToast: Toast = { id, message, type, duration: defaultDuration };
    
    toasts = [...toasts, newToast];
    toastListeners.forEach(listener => listener(toasts));
    
    // Auto-remove after duration (only if duration > 0)
    if (defaultDuration > 0) {
      setTimeout(() => {
        toast.remove(id);
      }, defaultDuration);
    }
  },
  
  // Remove a toast
  remove: (id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener(toasts));
  },
  
  // Clear all toasts
  clear: () => {
    toasts = [];
    toastListeners.forEach(listener => listener(toasts));
  },
  
  // Subscribe to toast changes
  subscribe: (listener: (toasts: Toast[]) => void) => {
    toastListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  },
  
  // Get current toasts
  getAll: () => toasts,
  
  // Convenience methods
  success: (message: string, duration?: number) => toast.show(message, 'success', duration),
  error: (message: string, duration?: number) => toast.show(message, 'error', duration ?? 0), // Persistent by default
  warning: (message: string, duration?: number) => toast.show(message, 'warning', duration ?? 0), // Persistent by default
  info: (message: string, duration?: number) => toast.show(message, 'info', duration),
};


