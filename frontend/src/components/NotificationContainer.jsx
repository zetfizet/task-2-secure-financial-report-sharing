import { useState, useEffect } from 'react';

// Notification Manager
let addNotification = null;

export const showNotification = (message, type = 'info', title = '') => {
  if (addNotification) {
    addNotification({ message, type, title });
  }
};

export const showSuccess = (message, title = 'Success') => {
  showNotification(message, 'success', title);
};

export const showError = (message, title = 'Error') => {
  showNotification(message, 'error', title);
};

export const showWarning = (message, title = 'Warning') => {
  showNotification(message, 'warning', title);
};

export const showInfo = (message, title = 'Info') => {
  showNotification(message, 'info', title);
};

// Notification Component
function Notification({ id, message, type, title, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const titles = {
    success: title || 'Success',
    error: title || 'Error',
    warning: title || 'Warning',
    info: title || 'Info'
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">
        {icons[type]}
      </div>
      <div className="notification-content">
        <div className="notification-title">{titles[type]}</div>
        <div className="notification-message">{message}</div>
      </div>
      <button 
        className="notification-close" 
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

// Notification Container
export default function NotificationContainer() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    addNotification = (notification) => {
      const id = Date.now() + Math.random();
      setNotifications(prev => [...prev, { ...notification, id }]);
    };

    return () => {
      addNotification = null;
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <div className="notification-container">
      {notifications.map(notif => (
        <Notification
          key={notif.id}
          {...notif}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
}