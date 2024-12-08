import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const COUNTRIES = [
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Finland', flag: '🇫🇮' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'UAE', flag: '🇦🇪' }
];

const PRODUCTS = [
  { name: 'Adobe Creative Cloud', price: 54.99 },
  { name: 'Microsoft 365', price: 69.99 },
  { name: 'AutoCAD 2024', price: 199.99 },
  { name: 'Sketch Pro', price: 99.99 },
  { name: 'Figma Enterprise', price: 149.99 }
];

interface SalesNotificationsProps {
  show: boolean;
}

interface Notification {
  id: number;
  country: typeof COUNTRIES[0];
  product: typeof PRODUCTS[0];
  time: number;
}

export default function SalesNotifications({ show }: SalesNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const generateNotification = (): Notification => ({
    id: Date.now(),
    country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
    time: Math.floor(Math.random() * 10) + 1
  });

  useEffect(() => {
    if (!show) return;

    // Show notification with a 30% chance
    const showNotification = () => {
      const shouldShow = Math.random() < 0.3; // Only show 30% of the time
      if (!shouldShow) return;

      setNotifications(prev => {
        const newNotification = generateNotification();
        return [newNotification];
      });
      setIsVisible(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Don't show first notification immediately
    const initialDelay = setTimeout(showNotification, 15000); // First notification after 15 seconds

    // Set up interval for future notifications (every 15-20 seconds)
    const intervalTime = Math.floor(Math.random() * 5000) + 15000;
    const interval = setInterval(showNotification, intervalTime);

    return () => {
      clearInterval(interval);
      clearTimeout(initialDelay);
      setNotifications([]);
      setIsVisible(false);
    };
  }, [show]);

  return (
    <AnimatePresence>
      {isVisible && notifications.map(notification => (
        <motion.div
          key={notification.id}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          className="fixed md:bottom-24 left-4 top-20 md:top-auto z-50 max-w-sm"
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">
                <span className="text-xl mr-2">{notification.country.flag}</span>
                Someone from {notification.country.name} just purchased
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {notification.product.name}
              </p>
              <p className="text-xs text-gray-500">
                ${notification.product.price} • {notification.time} minute{notification.time !== 1 ? 's' : ''} ago
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}