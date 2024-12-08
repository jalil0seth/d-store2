import React from 'react';
import { FiPackage } from 'react-icons/fi';

interface OrdersHeaderProps {
  ordersCount: number;
}

const OrdersHeader: React.FC<OrdersHeaderProps> = ({ ordersCount }) => {
  return (
    <div className="px-6 py-5 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiPackage className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
        <div className="text-sm text-gray-500">
          {ordersCount} {ordersCount === 1 ? 'order' : 'orders'} found
        </div>
      </div>
    </div>
  );
};

export default OrdersHeader;
