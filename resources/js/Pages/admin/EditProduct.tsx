import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '@/Components/admin/ProductForm';
import { PocketBaseService } from '@/services/PocketBaseService';

const pb = PocketBaseService.getInstance();

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount?: number;
  image: string;
  images?: string[];
  metadata: any;
  stock: number;
  featured: boolean;
}

export const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      if (id) {
        const record = await pb.getProduct(id);
        setProduct(record as Product);
      }
    } catch (err) {
      setError('Failed to load product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (productData: Partial<Product>) => {
    try {
      if (id) {
        await pb.updateProduct(id, productData);
      } else {
        await pb.createProduct(productData);
      }
      navigate('/admin/products');
    } catch (err) {
      setError('Failed to save product');
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Product' : 'Create New Product'}
      </h1>
      <ProductForm
        initialData={product}
        onSubmit={handleSave}
        onCancel={() => navigate('/admin/products')}
      />
    </div>
  );
};

export default EditProduct;
