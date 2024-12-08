import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

// Eagerly load critical components
import Hero from '@/Components/Hero';
import BrandBar from '@/Components/BrandBar';

// Lazy load non-critical components
const FeaturedProducts = lazy(() => import('@/Components/FeaturedProducts'));
const Reviews = lazy(() => import('@/Components/Reviews'));
const SalesNotifications = lazy(() => import('@/Components/SalesNotifications'));
const CookieConsent = lazy(() => import('@/Components/CookieConsent'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="w-full h-32 flex items-center justify-center">
    <div className="animate-pulse text-muted">Loading...</div>
  </div>
);

interface Props {
  auth: {
    user: {
      name: string;
      email: string;
    } | null;
  };
}

export default function HomePage() {
  const { auth } = usePage().props as Props;
  const [showCookieConsent, setShowCookieConsent] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('cookieConsent');
    }
    return false;
  });
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Initialize sales notification after a delay
    const notificationTimer = setTimeout(() => {
      setShowNotification(true);
    }, 2000);

    // Rotate notifications every 10 seconds
    const interval = setInterval(() => {
      setShowNotification(prev => {
        if (!prev) return true;
        setTimeout(() => setShowNotification(true), 500);
        return false;
      });
    }, 10000);

    return () => {
      clearTimeout(notificationTimer);
      clearInterval(interval);
    };
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowCookieConsent(false);
  };

  return (
    <>
      <Head title="Home" />
      <div className="min-h-screen">
        <div className="mx-auto">
          <Hero />
          <BrandBar />
          
          <div className="mt-8">
            <Suspense fallback={<LoadingFallback />}>
              <FeaturedProducts />
            </Suspense>
          </div>

          <div className="mt-8">
            <Suspense fallback={<LoadingFallback />}>
              <Reviews />
            </Suspense>
          </div>

          <AnimatePresence>
            {showNotification && (
              <Suspense fallback={null}>
                <div className="fixed bottom-4 right-4">
                  <SalesNotifications onClose={() => setShowNotification(false)} />
                </div>
              </Suspense>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCookieConsent && (
              <Suspense fallback={null}>
                <div className="fixed bottom-0 left-0 right-0">
                  <CookieConsent onAccept={handleAcceptCookies} />
                </div>
              </Suspense>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}