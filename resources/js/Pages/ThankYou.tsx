import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useCartStore } from '../store/cartStore';
import { CheckCircle, Package, Mail, ArrowLeft } from 'lucide-react';

interface Props {
  orderId?: string;
}

export default function ThankYou({ orderId }: Props) {
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear cart when thank you page is loaded
    clearCart();
  }, [clearCart]);

  return (
    <>
      <Head title="Thank You" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank you for your order!
            </h1>
            
            {orderId && (
              <p className="text-lg text-gray-600 mb-4">
                Order #{orderId}
              </p>
            )}

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center space-x-2 text-gray-800 mb-2">
                <Package className="h-5 w-5" />
                <span>Your order is being processed</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-800">
                <Mail className="h-5 w-5" />
                <span>Order confirmation sent to your email</span>
              </div>
            </div>

            <p className="text-gray-600 mb-8">
              We'll start working on your order right away. You'll receive updates about your order status via email.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={route('home')}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Shop
              </Link>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              Need help? <a href="#" className="text-primary-600 hover:text-primary-700">Contact our support team</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
