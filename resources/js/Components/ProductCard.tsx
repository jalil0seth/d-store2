import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { ShoppingCart, Star, Tag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

interface ProductVariant {
  name: string;
  description: string;
  price: number;
  original_price?: number;
  billingCycle: 'monthly' | 'annual' | 'once';
  discountPercentage: number;
  features: string[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  images?: string[];
  category?: string;
  rating?: number;
  reviews?: number;
  slug?: string;
  variants?: ProductVariant[];
  isAvailable: number;
  metadata?: {
    shortDescription: string;
    longDescription: string;
    features: string[];
    specifications: string[];
    compatibility: string[];
    valuePropositions: string[];
    commonUses: string[];
    advantages: string[];
    whyBuy: string[];
    mainBenefits: string[];
    targetAudience: string[];
  };
}

interface ProductCardProps {
  product: Product;
  layout?: boolean;
}

const getLowestPrice = (variants: ProductVariant[] = []): number => {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map(v => v.price));
};

export default function ProductCard({ product, layout = true }: ProductCardProps) {
  const { addItem, setIsOpen } = useCartStore();

  if (product.isAvailable !== 1) {
    return null;
  }

  const variants = Array.isArray(product.variants) ? product.variants : 
    (typeof product.variants === 'string' ? JSON.parse(product.variants) : []);

  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.id) {
      console.error('Invalid product: missing ID');
      return;
    }

    // If no variant is selected and we have variants, select the first one
    if (!selectedVariant && variants.length > 0) {
      setSelectedVariant(variants[0]);
      return;
    }

    const variant = selectedVariant || {
      id: product.id,
      name: 'Default',
      price: product.price,
      original_price: product.originalPrice || product.price,
      quantity: 1
    };

    addItem(
      {
        id: product.id,
        name: product.name,
        image: product.image || product.images?.[0] || ''
      },
      variant
    );
    
    setIsOpen(true);
  };

  const metadata = typeof product.metadata === 'string'
    ? JSON.parse(product.metadata)
    : (product.metadata || {
        shortDescription: '',
        features: [],
        specifications: [],
        compatibility: [],
        valuePropositions: [],
        commonUses: [],
        advantages: [],
        whyBuy: [],
        mainBenefits: [],
        targetAudience: []
      });

  const parseImages = (imagesStr: string | string[]): string[] => {
    if (Array.isArray(imagesStr)) return imagesStr;
    try {
      const parsed = JSON.parse(imagesStr || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing images:', error);
      return [];
    }
  };

  const images = parseImages(product.images || '[]');
  const imageUrl = product.image || images[0] || 'https://placehold.co/400x300?text=No+Image';
  
  const currentPrice = selectedVariant?.price || 0;
  const originalPrice = selectedVariant?.original_price || selectedVariant?.price || 0;
  const savings = originalPrice - currentPrice;
  const discount = savings > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  const shortDescription = metadata.shortDescription || product.description;

  return (
    <motion.div
      layout={layout}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <Link href={`/product/${product.id}/${product.slug}`} className="block w-full h-full">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-scale-down hover:scale-[0.9] transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = product.image || 'https://placehold.co/400x300?text=No+Image';
            }}
          />
        </Link>
        {savings > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
            Save ${savings.toFixed(2)}
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-3">
          <Link href={`/product/${product.id}/${product.slug}`}>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {variants.length > 1 && (
          <div className="mb-3">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
              value={selectedVariant?.name || ''}
              onChange={(e) => {
                const variant = variants.find(v => v.name === e.target.value);
                setSelectedVariant(variant || null);
              }}
            >
              {variants.map((variant) => (
                <option key={variant.name} value={variant.name}>
                  {variant.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {shortDescription && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {shortDescription}
          </p>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold text-gray-900">
              ${currentPrice.toFixed(2)}
            </span>
            {savings > 0 && (
              <span className="text-sm text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
            {discount > 0 && (
              <span className="text-sm font-medium text-red-500">
                {discount}% OFF
              </span>
            )}
          </div>
          {savings > 0 && (
            <div className="text-sm font-medium text-green-600">
              You save ${savings.toFixed(2)}
            </div>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white h-10 rounded-lg transition-colors duration-200 flex items-center justify-center"
          disabled={!product.isAvailable}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
