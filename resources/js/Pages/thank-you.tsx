import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  status?: string;
}

export default function ThankYouPage({ status }: Props) {
  return (
    <>
      <Head title="Thank You" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto"
          >
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {status === 'success' ? 'Thank you for your order!' : 'Payment Processing'}
            </h2>
            {status === 'success' ? (
              <p className="text-gray-600">
                Your payment has been successfully processed. We will send you an email with your order details shortly.
              </p>
            ) : (
              <p className="text-gray-600">
                We are processing your payment. Please wait a moment...
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 space-y-4"
          >
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}
