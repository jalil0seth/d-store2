import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { router } from '@inertiajs/react';
import axios from 'axios'; // Import axios
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

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
    name: '',
    whatsapp: '',
    discountCode: '',
    notes: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(8);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

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

    if (!customerInfo.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!customerInfo.name) {
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

  const handleCheckout = async () => {
    if (currentStep === 1 && !validateInformation()) {
      return;
    }

    if (currentStep === CHECKOUT_STEPS.length - 1) {
      setError(null);
      setIsProcessing(true);
      try {
        // First create the order
        const order = await createOrder(
          items,
          cartTotal,
          customerInfo.email,
          {
            name: customerInfo.name,
            whatsapp: customerInfo.whatsapp || undefined
          },
          0,
          customerInfo.notes
        );

        setOrderId(order.id);

        // Format the amount with 2 decimal places
        const formattedAmount = cartTotal.toFixed(2);

        // Then create the invoice/payment URL
        const paymentResponse = await axios.post(`/api/orders/${order.id}/pay`, {
          amount: formattedAmount,
          orderRef: order.order_number,
          email: customerInfo.email
        });
        
        localStorage.setItem('customer_email', customerInfo.email);
        
        if (paymentResponse.data?.url) {
          setPaymentUrl(paymentResponse.data.url);
          setInvoiceId(paymentResponse.data.id);
        } else {
          setError('Payment URL not found. Please try again.');
          setIsProcessing(false);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
        console.error('Payment error:', error.response?.data);
        setError(Array.isArray(errorMessage) ? errorMessage.join('. ') : errorMessage || 'Failed to create order. Please try again.');
        setIsProcessing(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Payment status check
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (orderId && invoiceId) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`/api/orders/${orderId}/payment-status?invoice_id=${invoiceId}`);
          if (response.data.status === 'PAID') {
            clearCart();
            if (paymentWindow) {
              paymentWindow.close();
            }
            router.visit('/thank-you');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [orderId, invoiceId]);

  // Countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessing && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && paymentUrl) {
      const newWindow = window.open(paymentUrl, '_blank', 'fullscreen=yes');
      setPaymentWindow(newWindow);
      setIsProcessing(false);
      setCountdown(8); // Reset countdown for next time
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isProcessing, countdown, paymentUrl]);

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
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
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
            onChange={(e) => {
              setCustomerInfo(prev => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John Doe"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Notes (Optional)
          </label>
          <textarea
            value={customerInfo.notes}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Any special instructions for your order"
            rows={3}
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
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
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

                  {paymentUrl ? (
                    <button
                      onClick={() => {
                        if (paymentWindow?.closed) {
                          const newWindow = window.open(paymentUrl, '_blank', 'fullscreen=yes');
                          setPaymentWindow(newWindow);
                        } else {
                          paymentWindow?.focus();
                        }
                      }}
                      className="w-full bg-[#0070ba] text-white py-3 px-4 rounded-lg hover:bg-[#003087] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
                    >
                      <img src="/payment-logos/paypal.svg" alt="" className="h-4 brightness-0 invert" />
                      Return to PayPal
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className="w-full bg-[#0070ba] text-white py-3 px-4 rounded-lg hover:bg-[#003087] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <img src="/payment-logos/paypal.svg" alt="" className="h-4 brightness-0 invert" />
                          Complete Order Now
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-center text-xs text-gray-500 mt-3">
                    Secure checkout powered by PayPal
                  </p>
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

  // Load customer info from cookie/localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('customer_email');
    if (savedEmail) {
      setCustomerInfo(prev => ({ ...prev, email: savedEmail }));
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
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-[110]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Processing Order</h2>
              <p className="text-sm text-gray-500">
                Opening PayPal in {countdown} seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Modal */}
      {paymentUrl && !isProcessing && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 z-[9999] max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <img src="/payment-logos/paypal.svg" alt="PayPal" className="w-full h-full" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Complete Your Payment</h3>
              <p className="text-xs text-gray-500">Checking payment status...</p>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={() => {
                if (paymentWindow?.closed) {
                  const newWindow = window.open(paymentUrl, '_blank', 'fullscreen=yes');
                  setPaymentWindow(newWindow);
                } else {
                  paymentWindow?.focus();
                }
              }}
              className="w-full px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              Return to PayPal
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}