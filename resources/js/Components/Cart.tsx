import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
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

  const { createOrder } = useOrderStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerInfo, setCustomerInfo] = useState({
    email: localStorage.getItem('customer_email') || '',
    name: localStorage.getItem('customer_name') || '',
    whatsapp: '',
    discountCode: '',
    notes: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<number | null>(() => {
    const stored = localStorage.getItem('last_order_id');
    return stored ? parseInt(stored) : null;
  });
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const paymentCheckInterval = useRef<NodeJS.Timeout>();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'paid' | null>(null);
  const [lastOrderItems, setLastOrderItems] = useState<string>('');

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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
      const formattedAmount = Number(order.total).toFixed(2);
      const paymentResponse = await axios.post(`/api/orders/${order.id}/pay`, {
        amount: formattedAmount,
        orderRef: order.id,
        email: order.customer_email
      });
      
      if (paymentResponse.data?.url) {
        updatePaymentUrl(paymentResponse.data.url, order.id);
        window.open(paymentResponse.data.url, '_blank')?.focus();
        startPaymentCheck(order.id);
      } else {
        setError('Payment URL not found. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error('Payment error:', error.response?.data);
      setError(Array.isArray(errorMessage) ? errorMessage.join('. ') : errorMessage || 'Failed to initiate payment. Please try again.');
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
      id: item.id,
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
      const order = await createOrder(
        items,
        Number(cartTotal),
        customerInfo.email,
        {
          name: customerInfo.name,
          whatsapp: customerInfo.whatsapp || undefined,
          notes: customerInfo.notes || undefined
        },
        0
      );

      // Store current items state
      const currentItemsString = JSON.stringify(items.map(item => ({
        id: item.id,
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
    const PAYMENT_TIMEOUT = 8 * 60; // 8 minutes in seconds
    setTimeLeft(PAYMENT_TIMEOUT);
  };

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
    if (hasCartChanged()) {
      resetPaymentSession(true); // Clear storage when cart changes
    }
  }, [items]);

  useEffect(() => {
    if (paymentStatus === 'paid') {
      resetPaymentSession(true); // Clear storage when payment is completed
    }
  }, [paymentStatus]);

  useEffect(() => {
    const validateStoredPayment = async () => {
      const storedUrl = localStorage.getItem('payment_url');
      const storedOrderId = localStorage.getItem('last_order_id');
      
      if (!storedUrl || !storedOrderId) {
        resetPaymentSession(false);
        return;
      }

      try {
        const status = await checkPaymentStatus(parseInt(storedOrderId));
        
        if (!status) {
          resetPaymentSession(true); // Clear storage if payment status check fails
          return;
        }

        if (status.isPaid) {
          handlePaymentCompletion(parseInt(storedOrderId));
          return;
        }

        if (currentOrder?.id === parseInt(storedOrderId)) {
          setPaymentUrl(storedUrl);
          setLastOrderId(parseInt(storedOrderId));
          startCountdown();
          startPaymentCheck(parseInt(storedOrderId));
        } else {
          resetPaymentSession(true); // Clear storage if order ID doesn't match
        }
      } catch (error) {
        console.error('Error checking stored payment:', error);
        resetPaymentSession(true); // Clear storage on error
      }
    };

    validateStoredPayment();
  }, [currentOrder]);

  useEffect(() => {
    const storedUrl = localStorage.getItem('payment_url');
    const storedOrderId = localStorage.getItem('last_order_id');
    
    if (storedUrl && storedOrderId && currentOrder?.id === parseInt(storedOrderId)) {
      setPaymentUrl(storedUrl);
      setLastOrderId(parseInt(storedOrderId));
    } else {
      resetPaymentSession(false);
    }
  }, [currentOrder]);

  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem('payment_url');
      localStorage.removeItem('last_order_id');
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  useEffect(() => {
    if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
    }
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
      <div className="flex-1 overflow-y-auto px-4">
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

                  {currentOrder && !hasCartChanged() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <img src="/payment-logos/paypal.svg" alt="PayPal" className="h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Please complete your payment</h3>
                      <div className="flex items-center justify-between text-blue-700">
                        <span>Time remaining:</span>
                        <span className="font-medium">{timeLeft !== null ? formatTime(timeLeft) : 'Expired'}</span>
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

  useEffect(() => {
    setCurrentStep(0);
  }, [items.length, isOpen]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('customer_email');
    if (savedEmail) {
      setCustomerInfo(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  useEffect(() => {
    Fancybox.bind("[data-fancybox]", {
      dragToClose: false,
      closeButton: "top",
      autoFocus: false,
      trapFocus: false,
      placeFocusBack: false,
    });

    return () => {
      Fancybox.destroy();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hasCartChanged()) {
      resetPaymentSession(true); // Clear storage when cart changes
    }
  }, [items]);

  useEffect(() => {
    if (paymentStatus === 'paid') {
      resetPaymentSession(true); // Clear storage when payment is completed
    }
  }, [paymentStatus]);

  useEffect(() => {
    const validateStoredPayment = async () => {
      const storedUrl = localStorage.getItem('payment_url');
      const storedOrderId = localStorage.getItem('last_order_id');
      
      if (!storedUrl || !storedOrderId) {
        resetPaymentSession(false);
        return;
      }

      try {
        const status = await checkPaymentStatus(parseInt(storedOrderId));
        
        if (!status) {
          resetPaymentSession(true); // Clear storage if payment status check fails
          return;
        }

        if (status.isPaid) {
          handlePaymentCompletion(parseInt(storedOrderId));
          return;
        }

        if (currentOrder?.id === parseInt(storedOrderId)) {
          setPaymentUrl(storedUrl);
          setLastOrderId(parseInt(storedOrderId));
          startCountdown();
          startPaymentCheck(parseInt(storedOrderId));
        } else {
          resetPaymentSession(true); // Clear storage if order ID doesn't match
        }
      } catch (error) {
        console.error('Error checking stored payment:', error);
        resetPaymentSession(true); // Clear storage on error
      }
    };

    validateStoredPayment();
  }, [currentOrder]);

  useEffect(() => {
    const storedUrl = localStorage.getItem('payment_url');
    const storedOrderId = localStorage.getItem('last_order_id');
    
    if (storedUrl && storedOrderId && currentOrder?.id === parseInt(storedOrderId)) {
      setPaymentUrl(storedUrl);
      setLastOrderId(parseInt(storedOrderId));
    } else {
      resetPaymentSession(false);
    }
  }, [currentOrder]);

  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem('payment_url');
      localStorage.removeItem('last_order_id');
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  useEffect(() => {
    if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
        paymentCheckInterval.current = undefined;
      }
      // Don't reset payment session when closing cart
    }
  }, [isOpen]);

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

      {paymentUrl && (
        <a
          href={paymentUrl}
          data-fancybox
          data-type="iframe"
          style={{ display: 'none' }}
        />
      )}
    </AnimatePresence>
  );
}