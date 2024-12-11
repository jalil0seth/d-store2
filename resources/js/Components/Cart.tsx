import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { router } from '@inertiajs/react';
import axios from 'axios';
import PaymentCountdown from './PaymentCountdown';

const CHECKOUT_STEPS = [
  { id: 0, name: 'Cart' },
  { id: 1, name: 'Information' },
  { id: 2, name: 'Payment' }
];

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  image: string;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  original_price: number;
  quantity: number;
}

interface CartItem {
  product_id: string;
  product_name: string;
  variant_name: string;
  variant_id: string;
  product_image: string;
  variant_price: number;
  variant_original_price: number;
  variant_quantity: number;
  quantity: number;
}

export default function Cart() {
  const { 
    items, 
    isOpen,
    highlightedItemId,
    setIsOpen,
    addItem: addToCart,
    removeItem: removeFromCart,
    updateQuantity,
    clearCart,
    setHighlightedItemId
  } = useCartStore();

  const { createOrder } = useOrderStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: localStorage.getItem('customer_name') || '',
    email: localStorage.getItem('customer_email') || '',
    whatsapp: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<number | null>(() => {
    const stored = localStorage.getItem('last_order_id');
    return stored ? parseInt(stored) : null;
  });
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const paymentCheckInterval = React.useRef<NodeJS.Timeout>();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'paid' | null>(null);
  const [lastOrderItems, setLastOrderItems] = useState<string>('');

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const parseImages = (imagesStr: string | string[]): string[] => {
    if (!imagesStr) return [];
    if (Array.isArray(imagesStr)) return imagesStr;
    if (typeof imagesStr === 'string') {
      // If it starts with http, it's already a URL
      if (imagesStr.startsWith('http')) {
        return [imagesStr];
      }
      // Otherwise, try to parse it as JSON
      try {
        const parsed = JSON.parse(imagesStr);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        // If parsing fails and it's a string, treat it as a single image URL
        return [imagesStr];
      }
    }
    return [];
  };

  const getImageUrl = (item: CartItem): string => {
    if (!item.product_image) {
      return 'https://placehold.co/100x100?text=No+Image';
    }
    
    const images = parseImages(item.product_image);
    return images[0] || 'https://placehold.co/100x100?text=No+Image';
  };

  const calculateCartTotal = () => {
    return items.reduce((sum, item) => {
      const price = Number(item.variant_price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  };

  const calculateOriginalTotal = () => {
    return items.reduce((sum, item) => {
      const originalPrice = Number(item.variant_original_price) || Number(item.variant_price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (originalPrice * quantity);
    }, 0);
  };

  const cartTotal = calculateCartTotal();

  const validateInformation = () => {
    const newErrors: Record<string, string> = {};

    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!customerInfo.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const checkPaymentStatus = async (orderId: number) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}/payment-status`);
      setPaymentStatus(response.data.status);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('Order not found');
        return null;
      }
      throw error;
    }
  };

  const updatePaymentUrl = (url: string | null, orderId: number | null) => {
    setPaymentUrl(url);
    setLastOrderId(orderId);
    
    if (url && orderId) {
      localStorage.setItem('payment_url', url);
      localStorage.setItem('last_order_id', orderId.toString());
    } else {
      localStorage.removeItem('payment_url');
      localStorage.removeItem('last_order_id');
    }
  };

  const initiatePayment = async (order: any) => {
    try {
      const response = await axios.post(`/api/orders/${order.id}/pay`);
      const paymentUrl = response.data.url;
      
      setPaymentUrl(paymentUrl);
      localStorage.setItem('payment_url', paymentUrl);
      localStorage.setItem('last_order_id', order.id.toString());
      
      window.open(paymentUrl, '_blank')?.focus();
      startCountdown(); // Start countdown when payment is initiated
      startPaymentCheck(order.id);
      
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      setError('Failed to initiate payment. Please try again.');
    }
  };

  const startPaymentCheck = (orderId: number) => {
    if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
    }

    const startTime = Date.now();
    const maxDuration = 30 * 60 * 1000; // 30 minutes
    
    const checkInterval = setInterval(async () => {
      try {
        if (Date.now() - startTime > maxDuration) {
          if (paymentCheckInterval.current) {
            clearInterval(paymentCheckInterval.current);
            paymentCheckInterval.current = undefined;
          }
          return;
        }

        const response = await axios.get(`/api/orders/${orderId}/payment-status`);
        const { status, redirect } = response.data;

        if (!status) {
          if (paymentCheckInterval.current) {
            clearInterval(paymentCheckInterval.current);
            paymentCheckInterval.current = undefined;
          }
          return;
        }

        if (status === 'paid' && redirect) {
          if (paymentCheckInterval.current) {
            clearInterval(paymentCheckInterval.current);
            paymentCheckInterval.current = undefined;
          }
          clearCart();
          resetPaymentSession(true);
          window.location.href = redirect;
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
      }
    }, 5000);

    paymentCheckInterval.current = checkInterval;
  };

  const hasCartChanged = () => {
    if (!currentOrder) return true;
    
    const currentItemsString = JSON.stringify(items.map(item => ({
      id: item.product_id,
      quantity: item.quantity
    })));
    
    return currentItemsString !== lastOrderItems;
  };

  const getButtonText = () => {
    const storedOrderId = localStorage.getItem('last_order_id');
    const storedPaymentUrl = localStorage.getItem('payment_url');
    
    if (currentStep < CHECKOUT_STEPS.length - 1) {
      return 'Continue';
    }
    
    if (isProcessing) {
      return 'Processing...';
    }

    if (storedOrderId && storedPaymentUrl) {
      return 'Return to Payment';
    }

    return 'Complete Order Now';
  };

  const handleButtonClick = async () => {
    if (currentStep === 1) {
      if (!validateInformation()) {
        return;
      }
    }
    
    if (currentStep < CHECKOUT_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    const storedUrl = localStorage.getItem('payment_url');
    const storedOrderId = localStorage.getItem('last_order_id');
    
    if (storedUrl && storedOrderId) {
      window.open(storedUrl, '_blank')?.focus();
      startPaymentCheck(parseInt(storedOrderId));
      return;
    }

    handleCheckout();
  };

  const handleCheckout = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      const deviceHash = localStorage.getItem('device_hash');
      if (!deviceHash) {
        throw new Error('Device hash not found');
      }

      const order = await createOrder(
        items,
        Number(cartTotal),
        customerInfo.email,
        {
          name: customerInfo.name,
          whatsapp: customerInfo.whatsapp || undefined,
          notes: customerInfo.notes || undefined
        },
        0,
        deviceHash
      );

      // Store current items state
      const currentItemsString = JSON.stringify(items.map(item => ({
        id: item.product_id,
        quantity: item.quantity
      })));
      setLastOrderItems(currentItemsString);

      setCurrentOrder(order);
      localStorage.setItem('customer_email', customerInfo.email);
      await initiatePayment(order);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error('Payment error:', error.response?.data);
      setError(Array.isArray(errorMessage) ? errorMessage.join('. ') : errorMessage || 'Failed to create order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startCountdown = () => {
    const PAYMENT_TIMEOUT = 15 * 60; // 15 minutes in seconds
    setTimeLeft(PAYMENT_TIMEOUT);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Clear interval when component unmounts
    return () => clearInterval(timer);
  };

  useEffect(() => {
    // Clear payment session data on page load/refresh
    localStorage.removeItem('last_order_id');
    localStorage.removeItem('payment_url');
  }, []);

  useEffect(() => {
    // Start countdown when payment URL is set
    if (paymentUrl) {
      const cleanup = startCountdown();
      return cleanup;
    }
  }, [paymentUrl]);

  useEffect(() => {
    // Reset payment session if countdown expires
    if (timeLeft === 0) {
      resetPaymentSession(true);
    }
  }, [timeLeft]);

  const resetPaymentSession = (clearStorage = false) => {
    if (clearStorage) {
      localStorage.removeItem('payment_url');
      localStorage.removeItem('last_order_id');
    }
    setPaymentUrl(null);
    setTimeLeft(null);
    setCurrentOrder(null);
    setPaymentStatus(null);
    setLastOrderItems('');
  };

  const handleCountdownExpired = () => {
    resetPaymentSession(true); // Clear storage when countdown expires
  };

  const handleClose = () => {
    setIsOpen(false);
    if (paymentCheckInterval.current) {
      clearInterval(paymentCheckInterval.current);
      paymentCheckInterval.current = undefined;
    }
    resetPaymentSession(false); // Don't clear storage when closing cart
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
    
    // Store in localStorage for email and name
    if (field === 'email' || field === 'name') {
      localStorage.setItem(`customer_${field}`, value);
    }
    
    // Clear error for the field being edited
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    if (customerInfo.name) {
      localStorage.setItem('customer_name', customerInfo.name);
    }
    if (customerInfo.email) {
      localStorage.setItem('customer_email', customerInfo.email);
    }
  }, [customerInfo.name, customerInfo.email]);

  const renderCartStep = () => {
    const cartTotal = calculateCartTotal();
    const originalTotal = calculateOriginalTotal();
    const totalSavings = Math.max(0, originalTotal - cartTotal);

    return (
      <div className="flex-1 overflow-y-auto px-4">
        {items.map((item) => {
          const price = Number(item.variant_price) || 0;
          const originalPrice = Number(item.variant_original_price) || price;
          const quantity = Number(item.quantity) || 0;
          const itemTotal = price * quantity;
          const itemOriginalTotal = originalPrice * quantity;
          const itemSavings = Math.max(0, itemOriginalTotal - itemTotal);
          
          const itemKey = `${item.product_id}-${item.variant_id}`;
          
          return (
            <motion.div
              key={itemKey}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: highlightedItemId === item.product_id ? 1.02 : 1,
                backgroundColor: highlightedItemId === item.product_id ? '#f3f4f6' : '#ffffff'
              }}
              className="relative py-4 border-b border-gray-100"
            >
              <div className="flex gap-4 px-2">
                {/* Product Image */}
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                  <img
                    src={getImageUrl(item)}
                    alt={item.product_name}
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
                        <h3 className="text-base text-gray-900">{item.product_name || '-'}</h3>
                        <span className="text-gray-500">-</span>
                        <span className="text-gray-500">
                          {item.variant_name || '-'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id, item.variant_id)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.variant_id, quantity - 1)}
                        className="p-1 rounded-md hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity <= 0}
                      >
                        <Minus size={16} className="text-gray-600" />
                      </button>
                      <span className="w-6 text-center text-sm">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.variant_id, quantity + 1)}
                        className="p-1 rounded-md hover:bg-gray-100 border border-gray-300"
                      >
                        <Plus size={16} className="text-gray-600" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-2">
                          {originalPrice > price && (
                            <div className="text-sm text-gray-500 line-through">
                              ${itemOriginalTotal.toFixed(2)}
                            </div>
                          )}
                          <div className="text-base text-primary-600">
                            ${itemTotal.toFixed(2)}
                          </div>
                        </div>
                        {itemSavings > 0 && (
                          <div className="text-sm text-green-600">
                            You save: ${itemSavings.toFixed(2)}
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

        {/* Total Savings Summary */}
        {totalSavings > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-green-700 text-sm font-medium">
              Total Savings: ${totalSavings.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInformationStep = () => (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={customerInfo.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`w-full p-2 border rounded-lg ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-primary-500`}
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={customerInfo.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full p-2 border rounded-lg ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-primary-500`}
          placeholder="Enter your full name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp Number (Optional)
        </label>
        <input
          type="tel"
          value={customerInfo.whatsapp}
          onChange={(e) => handleInputChange('whatsapp', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="+1234567890"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={customerInfo.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="Any special instructions or notes"
        />
      </div>
    </div>
  );

  const renderPaymentStep = () => {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-full max-w-md space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium">Order Summary</h3>
                  <p className="text-sm text-gray-600 mt-1">Please review your order details</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{customerInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{customerInfo.name}</span>
                  </div>
                  {customerInfo.whatsapp && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">WhatsApp:</span>
                      <span className="font-medium">{customerInfo.whatsapp}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-xl font-bold text-primary-600">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {customerInfo.notes && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-600">Order Notes:</h4>
                    <p className="text-sm mt-1">{customerInfo.notes}</p>
                  </div>
                )}

                <div className="pt-6 border-t">
                  <div className="flex justify-center mb-3">
                    <img src="/payment-logos/paypal.svg" alt="PayPal" className="h-5 sm:h-6" />
                  </div>

                  {timeLeft !== null && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <img src="/payment-logos/paypal.svg" alt="PayPal" className="h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Please complete your payment</h3>
                      <div className="flex items-center justify-between text-blue-700">
                        <span>Time remaining:</span>
                        <span className="font-medium">{formatTime(timeLeft)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleButtonClick}
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                      isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : currentOrder && !hasCartChanged()
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {getButtonText()}
                  </button>
                </div>
              </div>
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

  const renderSummary = () => {
    const cartTotal = calculateCartTotal();
    const originalTotal = calculateOriginalTotal();
    const totalSavings = Math.max(0, originalTotal - cartTotal);

    return (
      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <div className="space-y-1">
            {originalTotal > cartTotal && (
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">Original Price:</span>
                <span className="text-xl font-medium text-gray-500 line-through ml-4">
                  ${originalTotal.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-base text-gray-900">Final Price:</span>
              <span className="text-xl font-bold text-primary-600 ml-4">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={items.length === 0}
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleCountdownExpired();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (paymentUrl) {
      startCountdown();
    }
  }, [paymentUrl]);

  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
        paymentCheckInterval.current = undefined;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    // Close cart if we're on the thank you page
    if (window.location.pathname.includes('/thank-you')) {
      setIsOpen(false);
    }
  }, [setIsOpen]);

  useEffect(() => {
    // Generate and store device hash if not exists
    const deviceHash = localStorage.getItem('device_hash');
    if (!deviceHash) {
      const newHash = 'dh_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('device_hash', newHash);
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div key="cart">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => handleClose()}
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
                    onClick={handleClose}
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
                  <>
                    {paymentUrl && timeLeft !== null && (
                      <PaymentCountdown
                        timeLeft={timeLeft}
                        paymentUrl={paymentUrl}
                        onExpired={handleCountdownExpired}
                      />
                    )}
                    {renderStepContent()}
                  </>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t px-4 py-4 space-y-3">
                {items.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-600">Original Price:</span>
                      <span className="text-xl font-medium text-gray-500 line-through">
                        ${items.reduce((acc, item) => acc + ((item.variant_original_price || item.variant_price) * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                    {items.some(item => item.variant_original_price && item.variant_original_price > item.variant_price) && (
                      <div className="flex justify-between text-base text-green-600">
                        <span>Your Savings:</span>
                        <span className="font-medium">
                          ${(items.reduce((acc, item) => 
                            acc + ((item.variant_original_price || item.variant_price) - item.variant_price) * item.quantity, 0
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
                  onClick={handleButtonClick}
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                    isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : currentOrder && !hasCartChanged()
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {getButtonText()}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}