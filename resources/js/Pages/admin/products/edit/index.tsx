import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AddEditProductModal } from '../Components/AddEditProductModal';
import { useProductStore } from '@/store/productStore';
import toast from 'react-hot-toast';

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedProduct, getProduct, updateProduct } = useProductStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (id) {
        try {
          await getProduct(id);
        } catch (error) {
          console.error('Error loading product:', error);
          toast.error('Product not found');
          navigate('/admin/products');
        }
      }
    };
    loadProduct();
  }, [id, getProduct, navigate]);

  const handleSave = async (data: any) => {
    if (!id) return;
    try {
      if (!selectedProduct) {
        throw new Error('Product not found');
      }
      await updateProduct(id, data);
      toast.success('Product updated successfully');
      navigate('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  if (!selectedProduct) {
    return null;
  }

  return (
    <AddEditProductModal
      open={true}
      onOpenChange={() => navigate('/admin/products')}
      onSave={handleSave}
      product={selectedProduct}
    />
  );
};

export default EditProductPage;
