import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Order {
  id?: string;
  order_number: string;
  customer_email: string;
  items: string;
  subtotal: number;
  total: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'abandoned' | 'refunded';
  payment_provider: string;
  delivery_status: 'pending' | 'delivered' | 'failed';
  delivery_messages?: string;
  abandoned_cart_processed?: boolean;
  recovery_email_sent?: string;
  refunded_at?: string;
  created?: string;
  updated?: string;
}

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  createOrder: (order: Omit<Order, 'id' | 'created' | 'updated'>) => Promise<Order>;
  updateOrderToPending: (orderId: string, invoiceId: string) => Promise<Order>;
  updateOrderPaymentStatus: (orderId: string, status: string, paymentDetails?: any) => Promise<Order>;
  fetchAllOrders: () => Promise<void>;
  processAbandonedCart: (orderId: string) => Promise<void>;
  sendDeliveryMessage: (orderId: string, itemIndex: number, message: string) => Promise<void>;
  processRefund: (orderId: string) => Promise<void>;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,

      createOrder: async (order) => {
        set({ isLoading: true, error: null });
        try {
          // Check if we already have a current order
          const { currentOrder } = get();
          if (currentOrder?.payment_status === 'abandoned') {
            console.log('Using existing abandoned order:', currentOrder);
            const updatedOrder = await pocketBaseService.createOrder({
              ...order,
              id: currentOrder.id // Ensure we update the existing order
            });
            
            set((state) => ({
              orders: state.orders.map((o) => 
                o.id === currentOrder.id ? updatedOrder : o
              ),
              currentOrder: updatedOrder,
              error: null
            }));
            
            return updatedOrder;
          }

          // Create new order if no current abandoned order
          const createdOrder = await pocketBaseService.createOrder(order);
          
          set((state) => ({
            orders: [createdOrder, ...state.orders],
            currentOrder: createdOrder,
            error: null
          }));
          
          return createdOrder;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateOrderToPending: async (orderId, invoiceId) => {
        set({ isLoading: true, error: null });
        try {
          const updatedOrder = await pocketBaseService.updateOrderToPending(orderId, invoiceId);
          
          set((state) => ({
            orders: state.orders.map((order) =>
              order.id === orderId ? updatedOrder : order
            ),
            currentOrder:
              state.currentOrder?.id === orderId
                ? updatedOrder
                : state.currentOrder,
            error: null
          }));
          
          return updatedOrder;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update order to pending';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateOrderPaymentStatus: async (orderId, status, paymentDetails) => {
        set({ isLoading: true, error: null });
        try {
          const updatedOrder = await pocketBaseService.updateOrderPaymentStatus(orderId, status, paymentDetails);
          
          set((state) => ({
            orders: state.orders.map((order) =>
              order.id === orderId ? updatedOrder : order
            ),
            currentOrder:
              state.currentOrder?.id === orderId
                ? updatedOrder
                : state.currentOrder,
            error: null
          }));

          // Send email notification if payment is completed
          if (status === 'completed') {
            await emailService.sendOrderConfirmation(updatedOrder);
          }
          
          return updatedOrder;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update order payment status';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAllOrders: async () => {
        set({ isLoading: true, error: null });
        try {
          const orders = await pocketBaseService.getOrders();
          
          // Find the most recent abandoned order to set as current
          const currentAbandoned = orders.find(o => o.payment_status === 'abandoned');
          
          set({ 
            orders,
            currentOrder: currentAbandoned || null,
            error: null 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      processAbandonedCart: async (orderId: string) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) throw new Error('Order not found');

        try {
          // Send recovery email
          await emailService.sendAbandonedCartEmail(order);

          // Mark cart as processed
          await get().updateOrderToPending(orderId, '');
        } catch (error: any) {
          throw new Error(`Failed to process abandoned cart: ${error.message}`);
        }
      },

      sendDeliveryMessage: async (orderId: string, itemIndex: number, message: string) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) throw new Error('Order not found');

        try {
          // Parse items and get specific item
          const items = JSON.parse(order.items);
          const item = items[itemIndex];
          if (!item) throw new Error('Item not found');

          // Send delivery email for the specific item
          await emailService.sendDeliveryEmail(order, item, message);

          // Update order with delivery message
          const messages = order.delivery_messages
            ? JSON.parse(order.delivery_messages)
            : [];
          messages.push({
            timestamp: new Date().toISOString(),
            message,
            itemIndex,
          });

          await get().updateOrderToPending(orderId, '');
        } catch (error: any) {
          throw new Error(`Failed to send delivery message: ${error.message}`);
        }
      },

      processRefund: async (orderId: string) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) throw new Error('Order not found');

        try {
          // Send refund confirmation email
          await emailService.sendRefundConfirmation(order);

          // Update order status
          await get().updateOrderPaymentStatus(orderId, 'refunded');
        } catch (error: any) {
          throw new Error(`Failed to process refund: ${error.message}`);
        }
      },

      clearCurrentOrder: () => {
        set({ currentOrder: null });
      }
    }),
    {
      name: 'order-storage',
    }
  )
);
