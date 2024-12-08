import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AddEditProductModal } from '../Components/AddEditProductModal';
import { useProductStore } from '@/store/productStore';
import toast from 'react-hot-toast';

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { createProduct } = useProductStore();

  const handleSave = async (data: any) => {
    try {
      await createProduct(data.name || '', data.status || 'draft');
      toast.success('Product added successfully');
      navigate('/admin/products');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  return (
    <AddEditProductModal
      open={true}
      onOpenChange={() => navigate('/admin/products')}
      onSave={handleSave}
      product={null}
    />
  );
};

export default AddProductPage;
