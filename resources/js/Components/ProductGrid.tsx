import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingCart, Star, Tag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Link } from '@inertiajs/react';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: any[];
  loading?: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  const { addItem } = useCartStore();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-[4/3] rounded-t-xl" />
            <div className="p-4 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const handleAddToCart = (product: any) => {
    const finalPrice = product.discount
      ? product.price * (1 - product.discount / 100)
      : product.price;

    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: product.originalPrice,
      discount: product.discount,
      image: product.image,
      description: product.description
    });
  };

  return (
    <section id="products" className="py-4">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {products
            .filter(product => product.isAvailable === 1)
            .map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
        </div>
      </div>
    </section>
  );
}