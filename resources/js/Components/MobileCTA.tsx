import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

interface MobileCTAProps {
}

export default function MobileCTA() {
  const { items, setIsOpen } = useCartStore();
  const totalItems = items.reduce((acc, item) => acc + (item.quantity || 0), 0);

  const handleClick = () => {
    setIsOpen(true);
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors duration-200 lg:hidden z-40"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </div>
        )}
      </div>
    </button>
  );
}