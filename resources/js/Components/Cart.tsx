import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { router } from '@inertiajs/react';

const CHECKOUT_STEPS = [
  { id: 0, name: 'Cart' },
  { id: 1, name: 'Information' },
  { id: 2, name: 'Payment' }
];

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart() {
  const { 
    items, 
    removeItem: removeFromCart, 
    updateQuantity, 
    clearCart,
    highlightedItemId,
    isOpen,
    setIsOpen,
  } = useCartStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    email: localStorage.getItem('customer_email') || '',
    name: '',
    whatsapp: '',
    discountCode: ''
  });
  
  const parseImages = (imagesStr: string | string[]): string[] => {
    if (Array.isArray(imagesStr)) return imagesStr;
    try {
      const parsed = JSON.parse(imagesStr || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing images:', error);
      return [];
    }
  };

  const getImageUrl = (item: any): string => {
    const images = parseImages(item.images || '[]');
    return item.image || images[0] || 'https://placehold.co/100x100?text=No+Image';
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      return sum + itemTotal;
    }, 0);
  };

  const cartTotal = calculateTotal();

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCheckout = () => {
    if (currentStep === CHECKOUT_STEPS.length - 1) {
      // Process payment and navigate to success page
      clearCart();
      setIsOpen(false);
      router.visit('/checkout/success');
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const renderCartStep = () => {
    const originalTotal = items.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
    const savings = originalTotal - cartTotal;

    return (
      <div className="flex-1 overflow-y-auto px-4">
        {items.map((item) => {
          const savings = item.originalPrice && item.originalPrice > item.price 
            ? (item.originalPrice - item.price) * item.quantity
            : 0;
          
          return (
            <motion.div
              key={`${item.id}-${item.variant?.name}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: highlightedItemId === item.id ? 1.02 : 1,
                backgroundColor: highlightedItemId === item.id ? '#f3f4f6' : '#ffffff'
              }}
              className="relative py-4 border-b border-gray-100"
            >
              <div className="flex gap-4 px-2">
                {/* Product Image */}
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                  <img
                    src={getImageUrl(item)}
                    alt={item.name}
                    className="w-full h-full object-scale-down hover:scale-[0.9] transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/100x100?text=No+Image';
                    }}
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="text-base text-gray-900">{item.name}</h3>
                        <span className="text-gray-500">-</span>
                        {item.variant && (
                          <span className="text-gray-500">
                            {item.variant.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-md hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} className="text-gray-600" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-md hover:bg-gray-100 border border-gray-300"
                      >
                        <Plus size={16} className="text-gray-600" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-2">
                          {item.originalPrice && item.originalPrice > item.price && (
                            <div className="text-sm text-gray-500 line-through">
                              ${(item.originalPrice * item.quantity).toFixed(2)}
                            </div>
                          )}
                          <div className="text-base text-primary-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        {savings > 0 && (
                          <div className="text-sm text-green-600">
                            You save: ${savings.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderInformationStep = () => {
    return (
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => {
              setCustomerInfo(prev => ({ ...prev, email: e.target.value }));
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 border-gray-300"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => {
              setCustomerInfo(prev => ({ ...prev, name: e.target.value }));
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 border-gray-300"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Number (Optional)
          </label>
          <input
            type="tel"
            value={customerInfo.whatsapp}
            onChange={(e) => {
              setCustomerInfo(prev => ({ ...prev, whatsapp: e.target.value }));
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 border-gray-300"
            placeholder="+1234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Code (Optional)
          </label>
          <input
            type="text"
            value={customerInfo.discountCode}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, discountCode: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Enter code"
          />
        </div>
      </div>
    );
  };

  const renderPaymentStep = () => {
    return (
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-full max-w-md space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-center mb-3">
                <img src="/payment-logos/paypal.svg" alt="PayPal" className="h-5 sm:h-6" />
              </div>

              <button
                className="w-full bg-[#0070ba] text-white py-3 px-4 rounded-lg hover:bg-[#003087] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
              >
                <img src="/payment-logos/paypal.svg" alt="" className="h-4 sm:h-5 brightness-0 invert" />
                Complete Order Now
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">
                Secure checkout powered by PayPal
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderCartStep();
      case 1:
        return renderInformationStep();
      case 2:
        return renderPaymentStep();
      default:
        return null;
    }
  };

  useEffect(() => {
    setCurrentStep(0);
  }, [items.length, isOpen]);

  // Load customer info from cookie/localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('customer_email');
    if (savedEmail) {
      setCustomerInfo(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-xl z-[70]"
          >
            <div className="flex flex-col h-full">
              <div className="sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center">
                    {currentStep > 0 && (
                      <button
                        onClick={handleBack}
                        className="mr-4 p-2 hover:bg-gray-100 rounded-full"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    <h2 className="text-xl font-bold">{CHECKOUT_STEPS[currentStep].name}</h2>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex px-4 pt-4">
                  {CHECKOUT_STEPS.map((step, index) => (
                    <div key={step.name} className="flex-1 flex items-center">
                      <div
                        className={`w-full h-2 rounded-full ${
                          index === 0 ? 'ml-0' : index === CHECKOUT_STEPS.length - 1 ? 'mr-0' : ''
                        } ${
                          index <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                    <p className="text-gray-600">Add items to your cart to continue shopping</p>
                  </div>
                ) : (
                  renderStepContent()
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t px-4 py-4 space-y-3">
                {items.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-600">Original Price:</span>
                      <span className="text-xl font-medium text-gray-500 line-through">
                        ${items.reduce((acc, item) => acc + (item.originalPrice || item.price) * item.quantity, 0).toFixed(2)}
                      </span>
                    </div>
                    {items.some(item => item.originalPrice && item.originalPrice > item.price) && (
                      <div className="flex justify-between text-base text-green-600">
                        <span>Your Savings:</span>
                        <span className="font-medium">
                          ${(items.reduce((acc, item) => 
                            acc + ((item.originalPrice || item.price) - item.price) * item.quantity, 0
                          )).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base">
                      <span>Final Price:</span>
                      <span className="text-xl font-bold text-primary-600">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                <button 
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                >
                  <span>
                    {currentStep === CHECKOUT_STEPS.length - 1 ? 'Pay Now' : 'Continue'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}