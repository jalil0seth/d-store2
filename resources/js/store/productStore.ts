import { create } from 'zustand';

const API_URL = 'https://api.npoint.io/a4dfc1a429f00362bafd';

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
    created?: string;
    updated?: string;
    collectionId?: string;
    collectionName?: string;
}

interface ProductState {
    products: Product[];
    loading: boolean;
    error: string | null;
    selectedProduct: Product | null;
}

interface ProductActions {
    fetchProducts: (filter?: string) => Promise<void>;
    createProduct: (product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
    getProduct: (id: string) => Promise<Product | null>;
    setSelectedProduct: (product: Product | null) => void;
    clearError: () => void;
}

type ProductStore = ProductState & ProductActions;

export const useProductStore = create<ProductStore>((set, get) => ({
    products: [],
    loading: false,
    error: null,
    selectedProduct: null,

    fetchProducts: async () => {
        try {
          set({ loading: true, error: null });
          const response = await fetch(API_URL);
          const data = await response.json();
          
          if (data.items) {
            set({ products: data.items, loading: false });
          } else {
            throw new Error('Invalid data format');
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch products', loading: false });
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

            // For new products, always set featured and isAvailable to 0
            const newProduct = {
                ...product,
                id: Math.random().toString(36).substr(2, 9),
                variants: JSON.stringify(validatedVariants),
                isAvailable: 0,
                featured: 0
            };

            const products = get().products;
            set({ products: [...products, newProduct as Product], loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    deleteProduct: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const products = get().products.filter(product => product.id !== id);
            set({ products, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
        }
    },

    updateProduct: async (id: string, data: Partial<Product>) => {
        set({ loading: true, error: null });
        try {
            const existingProduct = get().products.find(p => p.id === id);
            if (!existingProduct) {
                throw new Error('Product not found');
            }

            const updatedProduct = {
                ...existingProduct,
                ...data,
                featured: data.featured ?? existingProduct.featured,
                isAvailable: data.isAvailable ?? existingProduct.isAvailable
            };

            const products = get().products.map(p => 
                p.id === id ? updatedProduct : p
            );
            set({ products, loading: false });
        } catch (error) {
            set({ error: (error as Error).message, loading: false });
            throw error;
        }
    },

    getProduct: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const product = get().products.find(p => p.id === id) || null;
            set({ selectedProduct: product, loading: false });
            return product;
        } catch (error) {
            set({ error: (error as Error).message, loading: false, selectedProduct: null });
            throw error;
        }
    },

    setSelectedProduct: (product: Product | null) => set({ selectedProduct: product }),

    clearError: () => set({ error: null })
}));
