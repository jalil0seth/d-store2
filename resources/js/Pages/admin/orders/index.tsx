import React, { useState, useEffect, useMemo } from 'react';
import { useOrderStore } from '../../../store/orderStore';
import OrderDetailsModal from '../../../Components/admin/orders/OrderDetailsModal';
import OrderList from '../../../Components/admin/orders/OrderList';

export default function OrdersPage() {
  const { orders, fetchAllOrders: fetchOrders, isLoading: loading, error } = useOrderStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    fetchOrders(); // Refresh orders after modal closes
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      switch (activeTab) {
        case 'pending':
          return order.payment_status === 'completed' && (!order.delivery_status || order.delivery_status === 'pending');
        case 'delivered':
          return order.payment_status === 'completed' && order.delivery_status === 'delivered';
        case 'abandoned':
          return order.payment_status === 'abandoned';
        default:
          return true;
      }
    }).sort((a, b) => {
      // For pending orders, sort by payment date (oldest first)
      if (activeTab === 'pending') {
        return new Date(a.created).getTime() - new Date(b.created).getTime();
      }
      // For other tabs, sort by most recent first
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });
  }, [orders, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const stats = {
    all: orders.length,
    abandoned: orders.filter(order => order.payment_status === 'abandoned').length,
    pending: orders.filter(order => 
      order.payment_status === 'completed' && (!order.delivery_status || order.delivery_status === 'pending')
    ).length,
    delivered: orders.filter(order => 
      order.payment_status === 'completed' && order.delivery_status === 'delivered'
    ).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div 
            className={`cursor-pointer overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 ${
              activeTab === 'all' ? 'ring-2 ring-indigo-600' : ''
            }`}
            onClick={() => setActiveTab('all')}
          >
            <dt className="truncate text-sm font-medium text-gray-500">All Orders</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.all}</dd>
          </div>

          <div 
            className={`cursor-pointer overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 ${
              activeTab === 'abandoned' ? 'ring-2 ring-indigo-600' : ''
            }`}
            onClick={() => setActiveTab('abandoned')}
          >
            <dt className="truncate text-sm font-medium text-gray-500">Abandoned Carts</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.abandoned}</dd>
          </div>

          <div 
            className={`cursor-pointer overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 ${
              activeTab === 'pending' ? 'ring-2 ring-indigo-600' : ''
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <dt className="truncate text-sm font-medium text-gray-500">Pending Delivery</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.pending}</dd>
          </div>

          <div 
            className={`cursor-pointer overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 ${
              activeTab === 'delivered' ? 'ring-2 ring-indigo-600' : ''
            }`}
            onClick={() => setActiveTab('delivered')}
          >
            <dt className="truncate text-sm font-medium text-gray-500">Delivered</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.delivered}</dd>
          </div>
        </dl>

        {/* Orders List */}
        <div className="mt-8">
          <OrderList
            orders={filteredOrders}
            onViewDetails={handleViewDetails}
            emptyMessage={`No ${activeTab === 'all' ? '' : activeTab} orders found`}
          />
        </div>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={modalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
