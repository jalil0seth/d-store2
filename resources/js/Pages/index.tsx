import { useEffect, useState } from 'react';
import { PocketBaseService } from '@/services/PocketBaseService';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';

interface ProductVariant {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    billingCycle: 'monthly' | 'annual' | 'once';
    discountPercentage: number;
    features: string[];
}

interface Product {
    id: string;
    name: string;
    slug: string;
    brand: string;
    category: string;
    featured: boolean;
    metadata: {
        shortDescription: string;
        longDescription: string;
    };
    variants: ProductVariant[];
    image: string;
    isAvailable: boolean;
}

export default function Home() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const pb = PocketBaseService.getInstance();
                const allProducts = await pb.getProducts();
                
                // Parse metadata and variants from JSON strings
                const processedProducts = allProducts.map((product: any) => ({
                    ...product,
                    metadata: typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata,
                    variants: typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants
                }));

                // Get featured products
                const featured = processedProducts.filter((p: Product) => p.featured);
                setFeaturedProducts(featured);

                // Get unique categories
                const uniqueCategories = Array.from(new Set(processedProducts.map((p: Product) => p.category)));
                setCategories(uniqueCategories);

                // Set all products
                setProducts(processedProducts);
            } catch (error) {
                console.error('Error loading products:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    const filteredProducts = selectedCategory
        ? products.filter(p => p.category === selectedCategory)
        : products;

    const getLowestPrice = (variants: ProductVariant[]) => {
        return Math.min(...variants.map(v => v.price));
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featuredProducts.map((product) => (
                            <Link href={`/product/${product.slug}`} key={product.id}>
                                <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="aspect-video relative">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover rounded-t-lg"
                                        />
                                        <span className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-sm">
                                            Featured
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold">{product.name}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                                        <p className="text-sm mb-2">{product.metadata.shortDescription}</p>
                                        <p className="text-lg font-bold">
                                            From ${getLowestPrice(product.variants).toFixed(2)}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Category Filter */}
            <section className="mb-8">
                <div className="flex gap-2 mb-4">
                    <Button
                        variant={selectedCategory === '' ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory('')}
                    >
                        All
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </section>

            {/* All Products */}
            <section>
                <h2 className="text-2xl font-bold mb-4">All Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                        <Link href={`/product/${product.slug}`} key={product.id}>
                            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                                <div className="aspect-video relative">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover rounded-t-lg"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold">{product.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                                    <p className="text-sm mb-2">{product.metadata.shortDescription}</p>
                                    <p className="text-lg font-bold">
                                        From ${getLowestPrice(product.variants).toFixed(2)}
                                    </p>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
