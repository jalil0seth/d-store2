import React from 'react';
import { Head } from '@inertiajs/react';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
}

interface Props {
    products: Product[];
}

const Products: React.FC<Props> = ({ products = [] }) => {
    return (
        <>
            <Head title="Products" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                Our Products
                            </h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <div 
                                        key={product.id} 
                                        className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
                                    >
                                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="h-full w-full object-cover object-center"
                                            />
                                        </div>
                                        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                                            {product.name}
                                        </h2>
                                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                                            {product.description}
                                        </p>
                                        <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                                            ${product.price}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Products;
