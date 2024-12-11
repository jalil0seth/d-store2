import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface OrderItem {
    id: string;
    name: string;
    variant?: {
        id: string;
        name: string;
    };
    price: number;
    originalPrice: number;
    quantity: number;
}

export interface Order {
    id: number;
    order_number: string;
    email?: string;
    customer_info?: {
        name?: string;
        whatsapp?: string;
        [key: string]: any;
    };
    items: OrderItem[];
    total: number;
    discount: number;
    payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
    payment_metadata?: any;
    delivery_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed';
    delivery_messages?: Array<{
        status: string;
        message: string;
        timestamp: string;
    }>;
    created_at?: string;
    updated_at?: string;
}

interface OrderStore {
    orders: Order[];
    currentOrder: Order | null;
    isLoading: boolean;
    error: string | null;
    createOrder: (
        items: OrderItem[], 
        total: number, 
        email?: string, 
        customerInfo?: Order['customer_info'],
        discount?: number
    ) => Promise<Order>;
    fetchOrders: () => Promise<void>;
    getOrder: (orderId: number) => Promise<void>;
    updatePaymentStatus: (orderId: number, status: Order['payment_status'], metadata: any) => Promise<void>;
    updateDeliveryStatus: (orderId: number, status: Order['delivery_status'], message: string) => Promise<void>;
    payOrder: (order: Order) => Promise<{ url: string; id: string }>;
    checkPaymentStatus: (order: Order) => Promise<{ status: string }>;
    clearCurrentOrder: () => void;
    clearError: () => void;
}

export const useOrderStore = create<OrderStore>()(
    persist(
        (set, get) => ({
            orders: [],
            currentOrder: null,
            isLoading: false,
            error: null,

            createOrder: async (items, total, email, customerInfo, discount = 0) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post('/api/orders', { 
                        items, 
                        total,
                        email,
                        customer_info: customerInfo,
                        discount
                    });
                    const order = response.data;
                    set(state => ({
                        orders: [order, ...state.orders],
                        currentOrder: order,
                        isLoading: false
                    }));
                    return order;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to create order',
                        isLoading: false
                    });
                    throw error;
                }
            },

            fetchOrders: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.get('/api/orders');
                    set({ orders: response.data.data, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to fetch orders',
                        isLoading: false
                    });
                }
            },

            getOrder: async (orderId) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.get(`/api/orders/${orderId}`);
                    set({ currentOrder: response.data, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to get order',
                        isLoading: false
                    });
                }
            },

            updatePaymentStatus: async (orderId, status, metadata) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.patch(`/api/orders/${orderId}/payment`, {
                        payment_status: status,
                        payment_metadata: metadata
                    });
                    const updatedOrder = response.data;
                    set(state => ({
                        orders: state.orders.map(order => 
                            order.id === orderId ? updatedOrder : order
                        ),
                        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
                        isLoading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to update payment status',
                        isLoading: false
                    });
                }
            },

            updateDeliveryStatus: async (orderId, status, message) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.patch(`/api/orders/${orderId}/delivery`, {
                        delivery_status: status,
                        message
                    });
                    const updatedOrder = response.data;
                    set(state => ({
                        orders: state.orders.map(order => 
                            order.id === orderId ? updatedOrder : order
                        ),
                        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
                        isLoading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to update delivery status',
                        isLoading: false
                    });
                }
            },

            payOrder: async (order) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post(`/api/orders/${order.id}/pay`);
                    const { url, id } = response.data;
                    
                    // Store payment info in localStorage
                    localStorage.setItem('last_order_id', order.id.toString());
                    localStorage.setItem('payment_url', url);
                    
                    set({ url, id });
                    return response.data;
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to create payment',
                        isLoading: false
                    });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            checkPaymentStatus: async (order) => {
                try {
                    const response = await axios.get(`/api/orders/${order.id}/payment-status`);
                    return response.data;
                } catch (error) {
                    console.error('Failed to check payment status:', error);
                    throw error;
                }
            },

            clearCurrentOrder: () => set({ currentOrder: null }),
            clearError: () => set({ error: null })
        }),
        {
            name: 'order-storage',
        }
    )
);
