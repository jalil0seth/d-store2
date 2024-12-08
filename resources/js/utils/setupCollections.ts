import { pb } from '../lib/pocketbase';
import { initializeAuth } from '../lib/pocketbase';

export async function setupCollections() {
    try {
        // Initialize auth first
        const authSuccess = await initializeAuth();
        if (!authSuccess) {
            throw new Error('Failed to initialize auth');
        }

        // Create store_users collection if it doesn't exist
        try {
            await pb.collections.create({
                name: 'store_users',
                type: 'auth',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                    },
                    {
                        name: 'role',
                        type: 'select',
                        options: {
                            values: ['user', 'admin'],
                        },
                        required: true,
                    }
                ],
            });
        } catch (error: any) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }

        // Create store_products collection if it doesn't exist
        try {
            await pb.collections.create({
                name: 'store_products',
                type: 'base',
                schema: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                    },
                    {
                        name: 'image',
                        type: 'text',
                        required: true,
                    },
                    {
                        name: 'price',
                        type: 'number',
                        required: true,
                        min: 0,
                    },
                    {
                        name: 'originalPrice',
                        type: 'number',
                        required: true,
                        min: 0,
                    },
                    {
                        name: 'discount',
                        type: 'number',
                        required: true,
                        min: 0,
                        max: 100,
                    },
                    {
                        name: 'category',
                        type: 'text',
                        required: true,
                    },
                    {
                        name: 'rating',
                        type: 'number',
                        required: true,
                        min: 0,
                        max: 5,
                    },
                    {
                        name: 'reviews',
                        type: 'number',
                        required: true,
                        min: 0,
                    },
                    {
                        name: 'badge',
                        type: 'text',
                    }
                ],
            });
        } catch (error: any) {
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }

        console.log('Collections setup completed successfully');
    } catch (error) {
        console.error('Error setting up collections:', error);
        throw error;
    }
}
