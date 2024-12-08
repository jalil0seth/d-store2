import React from 'react';
import { Star, Check, Info, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductVariant {
  name: string;
  description: string;
  price: number;
  original_price?: number;
  billingCycle: 'monthly' | 'annual' | 'once';
  discountPercentage: number;
  features: string[];
}

interface ProductInfoProps {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  category?: string;
  variants?: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantSelect: (variant: ProductVariant) => void;
  metadata?: {
    features?: string[];
    specifications?: string[];
  };
  onAddToCart?: () => void;
  onShare?: () => void;
  addedToCart?: boolean;
}

export default function ProductInfo({
  name,
  description,
  price,
  originalPrice,
  rating,
  reviews,
  category,
  variants,
  selectedVariant,
  onVariantSelect,
  metadata,
  onAddToCart,
  onShare,
  addedToCart,
}: ProductInfoProps) {
  const [activeTab, setActiveTab] = React.useState('description');

  const currentPrice = selectedVariant?.price || price;
  const currentOriginalPrice = selectedVariant?.original_price || originalPrice || price;
  const savings = currentOriginalPrice - currentPrice;
  const discount = savings > 0 ? Math.round((savings / currentOriginalPrice) * 100) : 0;

  const shouldShowVariants = variants && variants.length > 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-1">
        <div className="flex items-center">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <Star
                    key={rating}
                    className={`h-4 w-4 ${
                      rating < 4.8
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                  />
                ))}
              </div>
                  <span className="text-sm font-semibold text-gray-900">4.8</span>
                  <span className="text-sm font-medium text-gray-500">(2,630 reviews)</span>
                </div>
          {category && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {category}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline flex-wrap gap-3">
        <span className="text-3xl font-bold text-gray-900">
          ${currentPrice.toFixed(2)}
        </span>
        {savings > 0 && (
          <>
            <span className="text-xl text-gray-500 line-through">
              ${currentOriginalPrice.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Save {discount}%
            </span>
          </>
        )}
      </div>

      {/* Variants */}
      {shouldShowVariants && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Select Plan
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {variants.map((variant) => (
              <button
                key={variant.name}
                onClick={() => onVariantSelect(variant)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedVariant?.name === variant.name
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{variant.name}</span>
                  {selectedVariant?.name === variant.name && (
                    <Check className="w-5 h-5 text-primary-500" />
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  ${variant.price.toFixed(2)}
                  {variant.billingCycle !== 'once' &&
                    `/${variant.billingCycle === 'monthly' ? 'mo' : 'yr'}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Action Buttons */}
      <div className="hidden lg:block mt-8">
        <div className="flex space-x-4">
          {selectedVariant ? (
            <motion.button
              onClick={onAddToCart}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
              whileTap={{ scale: 0.95 }}
              animate={addedToCart ? { scale: [1, 1.05, 1] } : undefined}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{addedToCart ? 'Added to Cart!' : 'Add to Cart'}</span>
            </motion.button>
          ) : (
            <button
              className="flex-1 bg-gray-100 text-gray-400 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
            >
              Select a Plan
            </button>
          )}
          <motion.button 
            className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Heart className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.button 
            onClick={onShare}
            className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t pt-6">
        <div className="flex space-x-6 border-b overflow-x-auto">
          {['description', 'features', 'specifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[200px]"
            >
              {activeTab === 'description' && (
                <div className="prose prose-sm max-w-none">
                  <p>{description}</p>
                </div>
              )}
              {activeTab === 'features' && (
                <ul className="space-y-2">
                  {metadata?.features?.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              {activeTab === 'specifications' && (
                <ul className="space-y-2">
                  {metadata?.specifications?.map((spec, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
