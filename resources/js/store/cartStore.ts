import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Product {
  id: string;
  name: string;
  image?: string;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  original_price?: number;
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

interface CartState {
  items: CartItem[];
  highlightedItemId: string | null;
  isOpen: boolean;
}

interface CartStore extends CartState {
  setIsOpen: (isOpen: boolean) => void;
  addItem: (product: Product, variant: Variant) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  setHighlightedItemId: (id: string | null) => void;
}

const initialState: CartState = {
  items: [],
  highlightedItemId: null,
  isOpen: false,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setIsOpen: (isOpen) => set({ isOpen }),
      addItem: (product: Product, variant: Variant) => {
        if (!product?.id || !variant?.id || !variant?.price) {
          console.error('Invalid product or variant data:', { product, variant });
          return;
        }

        const cartItem: CartItem = {
          product_id: product.id,
          product_name: product.name || 'Unknown Product',
          variant_name: variant.name || 'Default Variant',
          variant_id: variant.id,
          product_image: product.image || '',
          variant_price: Number(variant.price),
          variant_original_price: Number(variant.original_price || variant.price),
          variant_quantity: Number(variant.quantity || 0),
          quantity: 1
        };

        set((state) => {
          const existingItemIndex = state.items.findIndex(
            item => item.product_id === product.id && item.variant_id === variant.id
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingItemIndex];
            const newQuantity = currentItem.quantity + 1;
            
            if (newQuantity <= cartItem.variant_quantity) {
              currentItem.quantity = newQuantity;
              return { items: updatedItems };
            }
            return state; // Return unchanged state if quantity limit reached
          }

          return { items: [...state.items, cartItem] };
        });
      },
      removeItem: (productId, variantId) => 
        set((state) => ({
          items: state.items.filter(
            item => !(item.product_id === productId && item.variant_id === variantId)
          )
        })),
      updateQuantity: (productId: string, variantId: string, newQuantity: number) =>
        set((state) => {
          // Don't allow negative quantities
          if (newQuantity < 0) return state;

          return {
            items: state.items.map(item => {
              if (item.product_id === productId && item.variant_id === variantId) {
                return {
                  ...item,
                  quantity: newQuantity
                };
              }
              return item;
            })
          };
        }),
      clearCart: () => set(initialState),
      setHighlightedItemId: (id) => set({ highlightedItemId: id })
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        items: state.items,
        highlightedItemId: state.highlightedItemId,
        isOpen: state.isOpen 
      }),
    }
  )
);