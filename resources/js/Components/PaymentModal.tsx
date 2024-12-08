import React, { useEffect, useState } from 'react';
import { Spinner } from './Spinner';

interface PaymentModalProps {
  invoiceId: string;
  amount: string;
  onPaymentComplete: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ invoiceId, amount, onPaymentComplete }) => {
  const [status, setStatus] = useState<string>('pending');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8090/api/invoice-status/${invoiceId}`);
        if (!response.ok) {
          throw new Error('Failed to check payment status');
        }
        const data = await response.json();
        setStatus(data.status);

        if (data.status === 'paid') {
          onPaymentComplete();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    // Check immediately and then every 3 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [invoiceId, onPaymentComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Processing Payment</h2>
          <div className="mb-4">
            <Spinner />
          </div>
          <p className="text-gray-600 mb-2">
            Please complete your payment of ${amount} USD
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {status === 'pending' ? 'Waiting for payment...' : 
             status === 'paid' ? 'Payment completed!' :
             `Status: ${status}`}
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
