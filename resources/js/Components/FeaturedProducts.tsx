import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProductStore } from '../store/productStore';
import ProductGrid from './ProductGrid';
import { Button } from './ui/button';

export default function FeaturedProducts() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { products, fetchProducts, isLoading } = useProductStore();
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Get unique categories from available products only
  useEffect(() => {
    if (products.length > 0) {
      const availableProducts = products.filter(p => p.isAvailable === 1);
      const uniqueCategories = ['All', ...new Set(availableProducts.map(p => p.category))];
      setCategories(uniqueCategories);
    }
  }, [products]);

  // Filter products based on category (only show available products)
  const filteredProducts = products
    .filter(product => product.isAvailable === 1)
    .filter(product => {
      if (selectedCategory === 'All') return true;
      const productCategory = product.category?.trim().toLowerCase();
      const selectedCat = selectedCategory.toLowerCase();
      return productCategory === selectedCat;
    });

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Featured Software
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Official licenses from leading software providers
          </p>
        </motion.div>

        {/* Categories */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-gray-400">Loading products...</div>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} loading={isLoading} />
        )}
      </div>
    </section>
  );
}