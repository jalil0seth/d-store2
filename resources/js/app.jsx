import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';

// Import layout components
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import Cart from '@/Components/Cart';
import AdminBaseLayout from '@/Layouts/AdminBaseLayout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Initialize auth store
useAuthStore.getState().init();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        const page = pages[`./Pages/${name}.tsx`];
        
        if (!page) {
            throw new Error(`Page ${name} not found.`);
        }
        
        const Component = page.default;

        // Wrap admin pages with AdminBaseLayout
        if (name.startsWith('admin/')) {
            return {
                ...page,
                default: (props) => (
                    <AdminBaseLayout>
                        <Component {...props} />
                    </AdminBaseLayout>
                ),
            };
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        const AppWrapper = () => {
            const [isAdminRoute, setIsAdminRoute] = useState(
                window.location.pathname.includes('/admin')
            );

            useEffect(() => {
                const handleRouteChange = () => {
                    setIsAdminRoute(window.location.pathname.includes('/admin'));
                };

                if (router && typeof router.on === 'function') {
                    router.on('navigate', handleRouteChange);
                    return () => {
                        if (router && typeof router.off === 'function') {
                            router.off('navigate', handleRouteChange);
                        }
                    };
                }
            }, []);

            return (
                <div className="min-h-screen bg-background">
                    {!isAdminRoute && (
                        <>
                            <Header />
                            <Cart />
                        </>
                    )}
                    <Toaster position="top-right" />
                    <main className={isAdminRoute ? '' : 'mx-auto'}>
                        <App {...props} />
                    </main>
                    {!isAdminRoute && <Footer />}
                </div>
            );
        };

        root.render(<AppWrapper />);
    },
    progress: {
        color: '#4B5563',
    },
});
