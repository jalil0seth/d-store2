import React, { useEffect, useState } from 'react';
import { useOrderStore } from '../store/orderStore';

interface PaymentCountdownProps {
    timeLeft: number;
    paymentUrl: string;
    onExpired: () => void;
}

const PaymentCountdown: React.FC<PaymentCountdownProps> = ({ timeLeft, paymentUrl, onExpired }) => {
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const { checkPaymentStatus, clearCurrentOrder } = useOrderStore();

    useEffect(() => {
        // Set up countdown timer
        const timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                onExpired();
                return;
            }
        }, 1000);

        // Check payment status every 10 seconds
        const statusChecker = setInterval(async () => {
            if (isChecking) return;
            
            setIsChecking(true);
            try {
                const lastOrderId = localStorage.getItem('last_order_id');
                if (!lastOrderId) return;
                
                const result = await checkPaymentStatus({ id: parseInt(lastOrderId) });
                if (result.status === 'paid') {
                    clearInterval(timer);
                    clearInterval(statusChecker);
                    localStorage.removeItem('last_order_id');
                    localStorage.removeItem('payment_url');
                    clearCurrentOrder();
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            } finally {
                setIsChecking(false);
            }
        }, 10000);

        // Cleanup
        return () => {
            clearInterval(timer);
            clearInterval(statusChecker);
        };
    }, [onExpired, timeLeft]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 mb-4">
            <div className="flex flex-col space-y-2">
                <div className="text-sm font-medium text-gray-600">
                    Complete your payment within:
                </div>
                <div className="text-2xl font-bold text-gray-800">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-center transition-colors"
                >
                    Complete Payment
                </a>
                <button
                    onClick={() => {
                        localStorage.removeItem('last_order_id');
                        localStorage.removeItem('payment_url');
                        clearCurrentOrder();
                        onExpired();
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    Cancel Payment
                </button>
            </div>
        </div>
    );
};

export default PaymentCountdown;
