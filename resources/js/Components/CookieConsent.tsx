import React from 'react';
import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

interface CookieConsentProps {
  show: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function CookieConsent({ show, onAccept, onDecline }: CookieConsentProps) {
  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      className="fixed bottom-4 left-4 z-50 max-w-sm"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Cookie className="w-6 h-6 text-primary-500" />
          <h3 className="font-medium text-gray-900">Cookie Settings</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            Accept
          </button>
        </div>
      </div>
    </motion.div>
  );
}