import React from 'react';
import { EyeIcon, CheckCircleIcon, XCircleIcon, TruckIcon } from '@heroicons/react/20/solid';

interface OrderCardProps {
  order: any;
  onViewDetails: (order: any) => void;
}

export default function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'abandoned':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <TruckIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              #{order.order_number}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(order.created).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={() => onViewDetails(order)}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Customer</span>
            <span className="text-sm font-medium text-gray-900">{order.customer_email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-medium text-gray-900">${order.total}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Items</span>
            <span className="text-sm font-medium text-gray-900">
              {JSON.parse(order.items).length} items
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.payment_status)}`}>
            {getStatusIcon(order.payment_status)}
            {order.payment_status}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.delivery_status)}`}>
            {getStatusIcon(order.delivery_status)}
            {order.delivery_status}
          </span>
        </div>
      </div>
    </div>
  );
}
