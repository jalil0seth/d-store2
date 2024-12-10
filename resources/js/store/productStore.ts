import { create } from 'zustand';
import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    type: string;
    category: string;
    brand: string;
    featured: number;
    image?: string;
    images?: string;
    metadata?: string;
    variants: string;
    isAvailable: number;
    collectionId?: string;
    collectionName?: string;
}

interface ProductState {
    products: Product[];
    loading: boolean;
    error: string | null;
    selectedProduct: Product | null;
    currentPage: number;
    totalPages: number;
    perPage: number;
    totalItems: number;
}

interface ProductActions {
    fetchProducts: (filter?: string) => Promise<void>;
    createProduct: (product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
    getProduct: (id: string) => Promise<void>;
    setSelectedProduct: (product: Product | null) => void;
    clearError: () => void;
}

type ProductStore = ProductState & ProductActions;

export const useProductStore = create<ProductStore>((set, get) => ({
    products: [],
    loading: false,
    error: null,
    selectedProduct: null,
    currentPage: 1,
    totalPages: 1,
    perPage: 50,
    totalItems: 0,

    fetchProducts: async (filter?: string) => {
        try {
            set({ loading: true, error: null });
            const url = filter ? `/api/products?${filter}` : '/api/products';
            const response = await axios.get(url);
            
            if (response.data.items) {
                set({ 
                    products: response.data.items,
                    currentPage: response.data.page,
                    totalPages: response.data.totalPages,
                    perPage: response.data.perPage,
                    totalItems: response.data.totalItems,
                    loading: false 
                });
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch products',
                loading: false 
            });
            console.error('Error fetching products:', error);
        }
    },

    createProduct: async (product: Partial<Product>) => {
        set({ loading: true, error: null });
        try {
            const variants = JSON.parse(product.variants || '[]');
            const validatedVariants = variants.map((variant: any) => ({
                ...variant,
                id: variant.id || Math.random().toString(36).substr(2, 9)
            }));

            const newProduct = {
                ...product,
                variants: JSON.stringify(validatedVariants),
                isAvailable: 0,
                featured: 0
            };

            const response = await axios.post('/api/products', newProduct);
            const products = get().products;
            set({ products: [...products, response.data], loading: false });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to create product', loading: false });
        }
    },

    deleteProduct: async (id: string) => {
        try {
            await axios.delete(`/api/products/${id}`);
            const products = get().products;
            set({ products: products.filter(p => p.id !== id) });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete product' });
        }
    },

    updateProduct: async (id: string, data: Partial<Product>) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.put(`/api/products/${id}`, data);
            const products = get().products.map(p => 
                p.id === id ? { ...p, ...response.data } : p
            );
            set({ products, loading: false });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update product', loading: false });
        }
    },

    getProduct: async (id: string) => {
        try {
            set({ loading: true, error: null });
            const response = await axios.get(`/api/products/${id}`);
            set({ selectedProduct: response.data, loading: false });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to get product',
                selectedProduct: null,
                loading: false
            });
        }
    },

    setSelectedProduct: (product: Product | null) => set({ selectedProduct: product }),

    clearError: () => set({ error: null })
}));
