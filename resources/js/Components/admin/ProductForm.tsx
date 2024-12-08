import React from 'react';
import { useForm } from '@inertiajs/react';

interface ProductFormProps {
  product?: {
    id?: number;
    name: string;
    description: string;
    price: number;
  };
}

export default function ProductForm({ product }: ProductFormProps) {
  const { data, setData, post, put, processing, errors } = useForm({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (product?.id) {
      put(route('admin.products.update', product.id));
    } else {
      post(route('admin.products.store'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={data.name}
          onChange={e => setData('name', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={data.description}
          onChange={e => setData('description', e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="price"
            value={data.price}
            onChange={e => setData('price', parseFloat(e.target.value))}
            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
            step="0.01"
          />
        </div>
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={processing}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {processing ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
