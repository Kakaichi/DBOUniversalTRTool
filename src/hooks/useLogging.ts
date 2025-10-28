import { useState, useRef, useEffect } from 'react';

export const useLogging = (activeTab: string) => {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log to bottom when new messages arrive or when switching to converter tab
  useEffect(() => {
    if (activeTab === 'converter' && logEndRef.current) {
      // Use timeout to ensure DOM is updated
      setTimeout(() => {
        if (logEndRef.current) {
          logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    }
  }, [logMessages, activeTab]);

  const addLog = (message: string) => {
    setLogMessages(prev => [...prev, message]);
    console.log(message);
  };

  const clearLogs = () => {
    setLogMessages([]);
  };

  return {
    logMessages,
    logEndRef,
    addLog,
    clearLogs
  };
};


