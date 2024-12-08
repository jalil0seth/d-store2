import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductGalleryProps {
  image?: string;
  images?: string | string[] | { url: string }[];
  productName: string;
}

const parseImages = (images: string | string[] | { url: string }[] | undefined): { url: string }[] => {
  try {
    if (!images) return [];
    if (typeof images === 'string') {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.map(img => typeof img === 'string' ? { url: img } : img) : [];
    }
    if (Array.isArray(images)) {
      return images.map(img => typeof img === 'string' ? { url: img } : img);
    }
    return [];
  } catch (error) {
    console.error('Error parsing images:', error);
    return [];
  }
};

export default function ProductGallery({ image, images, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Process images
  const processedImages = (() => {
    const parsedImages = parseImages(images);
    if (image) {
      parsedImages.unshift({ url: image });
    }
    return parsedImages.length > 0 ? parsedImages : [{ url: 'https://placehold.co/400x300?text=No+Image' }];
  })();

  const handleNext = () => {
    if (currentIndex < processedImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      const touchStart = e.touches[0].clientX;
      const touchMoveHandler = (e: TouchEvent) => {
        const touchCurrent = e.touches[0].clientX;
        const diff = touchStart - touchCurrent;
        if (Math.abs(diff) > 50) {
          if (diff > 0 && currentIndex < processedImages.length - 1) {
            handleNext();
          } else if (diff < 0 && currentIndex > 0) {
            handlePrev();
          }
        }
      };
      
      const touchEndHandler = () => {
        document.removeEventListener('touchmove', touchMoveHandler as any);
        document.removeEventListener('touchend', touchEndHandler);
      };
      
      document.addEventListener('touchmove', touchMoveHandler as any);
      document.addEventListener('touchend', touchEndHandler);
    }
  };

  return (
    <div className="relative">
      {/* Main Gallery */}
      <div className="relative w-full overflow-hidden rounded-lg bg-gray-100">
        <div
          ref={galleryRef}
          className="flex transition-transform duration-300 ease-out touch-pan-y"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          {...swipeHandlers}
        >
          {processedImages.map((image, index) => (
            <div
              key={index}
              className="relative w-full flex-shrink-0"
              style={{ aspectRatio: '1/1' }}
              onClick={() => setIsZoomed(true)}
            >
              <img
                src={image.url}
                alt={`${productName} - Image ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Only show if there are multiple images */}
        {processedImages.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="p-2 rounded-full bg-white/80 shadow-lg pointer-events-auto hover:bg-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentIndex < processedImages.length - 1 && (
              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-white/80 shadow-lg pointer-events-auto hover:bg-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Dots Indicator - Only show if there are multiple images */}
        {processedImages.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {processedImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails - Desktop Only and only if there are multiple images */}
      {processedImages.length > 1 && (
        <div className="hidden md:grid grid-cols-4 gap-4 mt-4">
          {processedImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative aspect-square rounded-lg overflow-hidden ${
                index === currentIndex
                  ? 'ring-2 ring-primary-600'
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              <img
                src={image.url}
                alt={`${productName} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
            onClick={() => setIsZoomed(false)}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={processedImages[currentIndex].url}
              alt={`${productName} - Fullscreen`}
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
