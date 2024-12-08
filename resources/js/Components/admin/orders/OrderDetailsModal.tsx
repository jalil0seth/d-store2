import React, { useState } from 'react';
import { XMarkIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/20/solid';
import { useOrderStore } from '../../../store/orderStore';

interface OrderDetailsModalProps {
  order: any;
  open: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, open, onClose }: OrderDetailsModalProps) {
  const { updateOrder, processAbandonedCart, processRefund } = useOrderStore();
  const [itemMessages, setItemMessages] = useState<{ [key: string]: string }>(() => {
    // Initialize with existing delivery content if available
    if (order.delivery_content) {
      try {
        return JSON.parse(order.delivery_content);
      } catch (e) {
        console.error('Error parsing delivery content:', e);
      }
    }
    return {};
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');

  const generateEmailTemplate = () => {
    const items = JSON.parse(order.items);
    const itemDeliverables = items.map((item: any) => {
      const deliverable = itemMessages[item.id] || '';
      return `
• ${item.title}
  ${deliverable}`;
    }).join('\n');

    const template = `Dear Customer,

Thank you for your purchase! Here are your items:

${itemDeliverables}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
Your Store Team`;

    setGlobalMessage(template);
  };

  const handleSaveDeliveryContent = async (itemId: string, content: string) => {
    try {
      setIsProcessing(true);
      
      // Update the local state
      const newItemMessages = {
        ...itemMessages,
        [itemId]: content
      };
      setItemMessages(newItemMessages);

      // Update the order with the new delivery content
      const updatedOrder = {
        ...order,
        delivery_content: JSON.stringify(newItemMessages)
      };

      await updateOrder(order.id, updatedOrder);
      setSuccessMessage('Delivery content saved successfully');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error saving delivery content:', error);
      setError('Failed to save delivery content');
      setTimeout(() => setError(''), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeliveryMessageSubmit = async () => {
    try {
      setIsProcessing(true);
      const items = JSON.parse(order.items);
      
      // Save the delivery record with both the email template and individual deliverables
      const currentMessages = order.delivery_messages ? JSON.parse(order.delivery_messages) : [];
      const newMessage = {
        timestamp: new Date().toISOString(),
        emailMessage: globalMessage,
        deliverables: itemMessages,
        status: 'delivered'
      };

      const updatedOrder = {
        ...order,
        delivery_messages: JSON.stringify([...currentMessages, newMessage]),
        delivery_status: 'delivered',
        delivery_content: JSON.stringify(itemMessages) // Save the final state of delivery content
      };

      await updateOrder(order.id, updatedOrder);
      setItemMessages({});
      setGlobalMessage('');
      setSuccessMessage('Items delivered successfully');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Failed to deliver items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAbandonedCart = async () => {
    try {
      setIsProcessing(true);
      await processAbandonedCart(order.id);
      setSuccessMessage('Recovery email scheduled successfully');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error processing abandoned cart:', error);
      setError('Failed to process abandoned cart');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefund = async () => {
    try {
      setIsProcessing(true);
      await processRefund(order.id);
      setSuccessMessage('Refund processed successfully');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error processing refund:', error);
      setError('Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  const items = JSON.parse(order.items);
  const abandonedTime = order.payment_status === 'abandoned' ? 
    new Date(new Date(order.created).getTime() + 24 * 60 * 60 * 1000) : null;
  const canSendRecoveryEmail = abandonedTime && new Date() >= abandonedTime && !order.abandoned_cart_processed;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-2xl">
              <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                {/* Header */}
                <div className="flex-shrink-0 bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        Order #{order.order_number}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(order.created).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {error && (
                    <div className="mb-4 bg-red-50 p-4 rounded-md">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  {successMessage && (
                    <div className="mb-4 bg-green-50 p-4 rounded-md">
                      <p className="text-sm text-green-700">{successMessage}</p>
                    </div>
                  )}

                  {/* Abandoned Cart Warning */}
                  {order.payment_status === 'abandoned' && !order.abandoned_cart_processed && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-yellow-400 mr-2" />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Abandoned Cart
                          </h3>
                          <p className="mt-1 text-sm text-yellow-700">
                            {canSendRecoveryEmail 
                              ? 'Ready to send recovery email'
                              : `Can send recovery email after ${abandonedTime?.toLocaleString()}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Info */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">{order.customer_email}</p>
                      <p className="text-xs text-gray-500 mt-1">Device ID: {order.customer_device_hash}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Item Delivery Details</h3>
                    <div className="space-y-4">
                      {items.map((item: any) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                ${(item.quantity * item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          {order.payment_status === 'completed' && (!order.delivery_status || order.delivery_status === 'pending') && (
                            <div className="mt-4">
                              <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Delivery Content
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Enter license key, account details, download link, or any delivery content
                                </p>
                              </div>
                              <div className="relative">
                                <textarea
                                  rows={3}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                                  placeholder="Enter delivery content for this item..."
                                  value={itemMessages[item.id] || ''}
                                  onChange={(e) => setItemMessages({
                                    ...itemMessages,
                                    [item.id]: e.target.value
                                  })}
                                />
                                <div className="flex justify-end mt-2">
                                  <button
                                    type="button"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    onClick={() => handleSaveDeliveryContent(item.id, itemMessages[item.id] || '')}
                                    disabled={isProcessing || !itemMessages[item.id]}
                                  >
                                    {isProcessing ? 'Saving...' : 'Save Content'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email Template */}
                  {order.payment_status === 'completed' && (!order.delivery_status || order.delivery_status === 'pending') && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Delivery Email</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            This email will be sent to the customer with all delivery details
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={generateEmailTemplate}
                        >
                          Generate Email Template
                        </button>
                      </div>
                      <div className="relative bg-gray-50 rounded-lg p-4">
                        <textarea
                          rows={12}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Enter the email message that will be sent to the customer with their items..."
                          value={globalMessage}
                          onChange={(e) => setGlobalMessage(e.target.value)}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {globalMessage.length}/2000
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Previous Messages */}
                  {order.delivery_messages && JSON.parse(order.delivery_messages).length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Deliveries</h3>
                      <div className="space-y-4">
                        {JSON.parse(order.delivery_messages).map((msg: any, index: number) => {
                          const parsedItems = JSON.parse(order.items);
                          return (
                            <div key={`delivery-${index}`} className="bg-gray-50 rounded-lg p-4">
                              <div className="mb-2">
                                <h4 className="text-sm font-medium text-gray-900">Delivered Items:</h4>
                                {msg.deliverables && Object.entries(msg.deliverables).map(([itemId, content]: [string, any]) => {
                                  const item = parsedItems.find((i: any) => i.id === itemId);
                                  return item ? (
                                    <div key={`item-${itemId}-${index}`} className="ml-4 mt-2">
                                      <p className="text-sm text-gray-600">{item.title}:</p>
                                      <p className="text-sm text-gray-800 font-mono ml-2">{content}</p>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Email Sent:</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-line">{msg.emailMessage}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-4">
                                Delivered on: {new Date(msg.timestamp).toLocaleString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-gray-500">Subtotal</span>
                        <span className="text-sm font-medium text-gray-900">${order.subtotal}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-900">Total</span>
                        <span className="text-sm font-medium text-gray-900">${order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4">
                  <div className="flex justify-between">
                    <div className="flex space-x-3">
                      {order.payment_status === 'completed' && order.delivery_status === 'delivered' && (
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          onClick={() => setShowRefundConfirm(true)}
                          disabled={isProcessing}
                        >
                          <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                          Process Refund
                        </button>
                      )}
                      {order.payment_status === 'abandoned' && !order.abandoned_cart_processed && (
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          onClick={handleAbandonedCart}
                          disabled={isProcessing || !canSendRecoveryEmail}
                        >
                          <ClockIcon className="h-5 w-5 mr-2" />
                          Send Recovery Email
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                      {order.payment_status === 'completed' && (!order.delivery_status || order.delivery_status === 'pending') && (
                        <button
                          type="button"
                          className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                          onClick={handleDeliveryMessageSubmit}
                          disabled={isProcessing || Object.keys(itemMessages).length === 0 || !globalMessage}
                        >
                          {isProcessing ? 'Processing...' : 'Process Delivery'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showRefundConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Refund</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to process a refund for order #{order.order_number}? 
              This action cannot be undone.
            </p>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                onClick={() => {
                  handleRefund();
                  setShowRefundConfirm(false);
                }}
              >
                Confirm Refund
              </button>
              <button
                type="button"
                className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                onClick={() => setShowRefundConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
