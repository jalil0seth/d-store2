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

interface CartItem {
    product_id: string;
    product_name: string;
    variant_name: string;
    variant_id: string;
    product_image: string;
    variant_price: number;
    variant_original_price: number;
    variant_quantity: number;
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
        items: CartItem[], 
        total: number, 
        email?: string, 
        customerInfo?: Order['customer_info'],
        discount?: number,
        deviceHash?: string
    ) => Promise<Order>;
    fetchOrders: () => Promise<void>;
    getOrder: (orderId: number) => Promise<Order>;
    updatePaymentStatus: (orderId: number, status: string, metadata?: any) => Promise<void>;
    updateDeliveryStatus: (orderId: number, status: string, message: string) => Promise<void>;
    payOrder: (order: Order) => Promise<{ url: string }>;
    checkPaymentStatus: (order: Order) => Promise<any>;
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

            createOrder: async (items, total, email, customerInfo, discount = 0, deviceHash) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await axios.post('/api/orders', { 
                        items: items.map(item => ({
                            product_id: item.product_id,
                            product_name: item.product_name,
                            variant_name: item.variant_name,
                            variant_id: item.variant_id,
                            product_image: item.product_image,
                            variant_price: item.variant_price,
                            variant_original_price: item.variant_original_price,
                            variant_quantity: item.variant_quantity,
                            quantity: item.quantity
                        })),
                        total,
                        email,
                        customer_info: customerInfo,
                        discount,
                        customer_device_hash: deviceHash
                    }, {
                        headers: {
                            'X-Device-Hash': deviceHash
                        }
                    });
                    const order = response.data;
                    set(state => ({
                        orders: [order, ...state.orders],
                        currentOrder: order
                    }));
                    return order;
                } catch (error: any) {
                    const message = error.response?.data?.error || error.message;
                    set({ error: message });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            fetchOrders: async () => {
                set({ isLoading: true, error: null });
                try {
                    const deviceHash = localStorage.getItem('device_hash');
                    const response = await axios.get('/api/orders', {
                        headers: {
                            'X-Device-Hash': deviceHash
                        }
                    });
                    set({ orders: response.data.data, isLoading: false });
                } catch (error: any) {
                    const message = error.response?.data?.error || error.message;
                    set({ error: message });
                } finally {
                    set({ isLoading: false });
                }
            },

            getOrder: async (orderId: number) => {
                try {
                    set({ isLoading: true, error: null });
                    const deviceHash = localStorage.getItem('device_hash');
                    const response = await axios.get(`/api/orders/${orderId}`, {
                        headers: {
                            'X-Device-Hash': deviceHash
                        }
                    });
                    const order = response.data;
                    set({ currentOrder: order });
                    return order;
                } catch (error: any) {
                    const message = error.response?.data?.error || error.message;
                    set({ error: message });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            updatePaymentStatus: async (orderId, status, metadata) => {
                set({ isLoading: true, error: null });
                try {
                    const deviceHash = localStorage.getItem('device_hash');
                    const response = await axios.patch(`/api/orders/${orderId}/payment`, {
                        payment_status: status,
                        payment_metadata: metadata
                    }, {
                        headers: {
                            'X-Device-Hash': deviceHash
                        }
                    });
                    const updatedOrder = response.data;
                    set(state => ({
                        orders: state.orders.map(order => 
                            order.id === orderId ? updatedOrder : order
                        ),
                        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
                        isLoading: false
                    }));
                } catch (error: any) {
                    const message = error.response?.data?.error || error.message;
                    set({ error: message });
                } finally {
                    set({ isLoading: false });
                }
            },

            updateDeliveryStatus: async (orderId, status, message) => {
                set({ isLoading: true, error: null });
                try {
                    const deviceHash = localStorage.getItem('device_hash');
                    const response = await axios.patch(`/api/orders/${orderId}/delivery`, {
                        delivery_status: status,
                        message
                    }, {
                        headers: {
                            'X-Device-Hash': deviceHash
                        }
                    });
                    const updatedOrder = response.data;
                    set(state => ({
                        orders: state.orders.map(order => 
                            order.id === orderId ? updatedOrder : order
                        ),
                        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
                        isLoading: false
                    }));
                } catch (error: any) {
                    const message = error.response?.data?.error || error.message;
                    set({ error: message });
                } finally {
                    set({ isLoading: false });
                }
            },

            payOrder: async (order) => {
                set({ isLoading: true, error: null });
                try {
                    const deviceHash = localStorage.getItem('device_hash');
                    const response = await axios.post(`/api/orders/${order.id}/pay`, {}, {
                        headers: {
                            'X-Device-Hash': deviceHash
                        }
                    });
                    const { url } = response.data;
                    
                    // Store payment info in localStorage
                    localStorage.setItem('last_order_id', order.id.toString());
                    localStorage.setItem('payment_url', url);
                    
                    set({ url });
                    return response.data;
                } catch (error: any) {
                    const message = error.response?.data?.error || error.message;
                    set({ error: message });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            checkPaymentStatus: async (order) => {
                try {
                    const deviceHash = localStorage.getItem('device_hash');
                    const response = await axios.get(`/api/orders/${order.id}/payment-status`, {
                        headers: {
                            'X-Device-Hash': deviceHash
                        }
                    });
                    return response.data;
                } catch (error: any) {
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
