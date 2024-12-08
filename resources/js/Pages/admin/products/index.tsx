import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import toast from 'react-hot-toast';
import { ProductTable } from './Components/ProductTable';
import { AddEditProductModal } from './Components/AddEditProductModal';
import { BulkAddModal } from './Components/BulkAddModal';
import { Product } from '@/types';
import { useProductStore } from '@/store/productStore';
import { llmService } from '@/services/LLMService'; // Assuming llmService is defined in this file

const ProductsPage: React.FC = () => {
  const { products, loading, error, fetchProducts, updateProduct, deleteProduct, createProduct } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [bulkAddInput, setBulkAddInput] = useState('');
  const [bulkAddProgress, setBulkAddProgress] = useState<{
    total: number;
    completed: number;
    status: 'idle' | 'generating' | 'creating' | 'completed' | 'error';
    products: Array<{
      name: string;
      status: 'pending' | 'generating' | 'generated' | 'creating' | 'created' | 'error';
      error?: string;
    }>;
  }>({
    total: 0,
    completed: 0,
    status: 'idle',
    products: []
  });

  useEffect(() => {
    fetchProducts(searchTerm ? `name ~ "${searchTerm}" || description ~ "${searchTerm}"` : '');
  }, [searchTerm, fetchProducts]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleAddProduct = async (data: Partial<Product>) => {
    try {
      await useProductStore.getState().createProduct(data.name || '', data.status || 'draft');
      toast.success('Product added successfully');
      setIsAddModalOpen(false);
      await fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleEditProduct = async (data: Partial<Product>) => {
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, data);
      toast.success('Product updated successfully');
      setIsEditModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleBulkAdd = async (products: Partial<Product>[]) => {
    try {
      // Initialize progress tracking
      setBulkAddProgress({
        total: products.length,
        completed: 0,
        status: 'generating',
        products: products.map(p => ({ 
          name: p.name || 'Unknown Product', 
          status: 'pending' 
        }))
      });

      // Process products sequentially
      const generatedProducts: Partial<Product>[] = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        // Update status to generating for this product
        setBulkAddProgress(prev => ({
          ...prev,
          products: prev.products.map((p, index) => 
            index === i ? { ...p, status: 'generating' } : p
          )
        }));

        try {
          // Generate product details
          const productData = await llmService.generateProductContent(product.name || '');

          // Update status to generated
          setBulkAddProgress(prev => ({
            ...prev,
            products: prev.products.map((p, index) => 
              index === i ? { ...p, status: 'generated' } : p
            )
          }));

          // Update status to creating
          setBulkAddProgress(prev => ({
            ...prev,
            products: prev.products.map((p, index) => 
              index === i ? { ...p, status: 'creating' } : p
            )
          }));

          // Create product
          const createdProduct = await createProduct(productData);

          // Update status to created and increment completed
          setBulkAddProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            products: prev.products.map((p, index) => 
              index === i ? { ...p, status: 'created' } : p
            )
          }));

          generatedProducts.push(createdProduct);
        } catch (error) {
          console.error(`Error processing product ${product.name}:`, error);
          
          // Update status to error
          setBulkAddProgress(prev => ({
            ...prev,
            products: prev.products.map((p, index) => 
              index === i ? { 
                ...p, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error' 
              } : p
            )
          }));
        }
      }

      // Final status update
      setBulkAddProgress(prev => ({
        ...prev,
        status: generatedProducts.length === products.length ? 'completed' : 'error'
      }));

      // Show appropriate notification
      if (generatedProducts.length === products.length) {
        toast.success(`Successfully created ${generatedProducts.length} products`);
      } else {
        toast.error(`Created ${generatedProducts.length} out of ${products.length} products`);
      }

      // Reset form and fetch products
      setIsBulkAddOpen(false);
      setBulkAddInput('');
      await fetchProducts();
    } catch (error) {
      console.error('Bulk add failed:', error);
      
      setBulkAddProgress(prev => ({
        ...prev,
        status: 'error'
      }));

      toast.error('Failed to add products. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted successfully');
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      try {
        await Promise.all(selectedProducts.map(id => deleteProduct(id)));
        toast.success('Products deleted successfully');
        setSelectedProducts([]);
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting products:', error);
        toast.error('Failed to delete products');
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-10 w-full bg-white border-gray-200 focus:border-gray-300 focus:ring-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setIsBulkAddOpen(true)}
            variant="outline"
            className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-200"
          >
            <Plus className="h-5 w-5" />
            <span>Bulk Add</span>
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </Button>
          {selectedProducts.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete Selected ({selectedProducts.length})</span>
            </Button>
          )}
        </div>
      </div>

      <ProductTable
        products={products}
        loading={loading}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <AddEditProductModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddProduct}
        product={null}
      />

      <AddEditProductModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleEditProduct}
        product={editingProduct}
      />

      <BulkAddModal 
        open={isBulkAddOpen}
        onOpenChange={setIsBulkAddOpen}
        onAdd={(products: Partial<Product>[]) => handleBulkAdd(products)}
        onChange={(e) => setBulkAddInput(e.target.value)}
        value={bulkAddInput}
        bulkAddProgress={bulkAddProgress}
      />
    </div>
  );
};

export default ProductsPage;
