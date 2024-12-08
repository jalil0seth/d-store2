import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { Star, X, AlertCircle, Filter, ChevronDown } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Review, reviews } from '../../data/reviews';

interface ProductReviewsProps {
  overallRating: number;
  totalReviews: number;
  ratingBreakdown: { [key: number]: number };
}

export default function ProductReviews({
  overallRating,
  totalReviews,
  ratingBreakdown,
}: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [visibleReviews, setVisibleReviews] = useState(6);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Shuffle function using Fisher-Yates algorithm
  const shuffleArray = (array: Review[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle reviews on component mount and when filter/sort changes
  const [shuffledReviews, setShuffledReviews] = useState<Review[]>([]);
  
  useEffect(() => {
    setShuffledReviews(shuffleArray(reviews));
  }, [reviews]);

  // Memoized filtered and sorted reviews
  const displayedReviews = useMemo(() => {
    let filtered = [...shuffledReviews];
    
    // Filter by rating
    if (filterRating !== null) {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(review => 
        review.content.toLowerCase().includes(term) ||
        review.title.toLowerCase().includes(term) ||
        review.author.toLowerCase().includes(term) ||
        review.location?.toLowerCase().includes(term)
      );
    }

    // Sort reviews
    switch (sortOrder) {
      case 'newest':
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'highest':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return filtered.sort((a, b) => a.rating - b.rating);
      default:
        return filtered;
    }
  }, [shuffledReviews, filterRating, searchTerm, sortOrder]);

  const loadMore = () => {
    setVisibleReviews(prev => prev + 6);
  };

  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-t pt-8">
        {/* TrustPilot Header */}
        <div className="bg-[#00b67a] rounded-lg p-4 sm:p-6 mb-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div>
                <div className="text-3xl sm:text-4xl font-bold mb-1">4.8</div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 sm:w-5 h-4 sm:h-5 ${
                        i < Math.round(overallRating) ? 'fill-current' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-semibold">TrustScore</div>
                <div className="text-sm opacity-90">Based on 2,630 reviews</div>
              </div>
            </div>
            <img
              src="https://cdn.trustpilot.net/brand-assets/1.1.0/logo-white.svg"
              alt="TrustPilot"
              className="h-6 sm:h-8"
            />
          </div>
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {displayedReviews.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-500">No reviews match your filters.</p>
            </div>
          ) : (
            displayedReviews.slice(0, visibleReviews).map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[#00b67a] rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{review.author}</div>
                      {review.location && (
                        <div className="text-sm text-gray-500">{review.location}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{review.date}</div>
                </div>

                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 sm:w-5 h-4 sm:h-5 ${
                        i < review.rating
                          ? 'text-[#00b67a] fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  {review.verified && (
                    <span className="ml-2 text-xs text-[#00b67a] bg-[#00b67a]/10 px-2 py-1 rounded-full">
                      Verified Purchase
                    </span>
                  )}
                </div>

                <h4 className="font-medium text-base sm:text-lg mb-2">{review.title}</h4>
                <p className="text-gray-600 text-sm sm:text-base">{review.content}</p>
              </motion.div>
            ))
          )}
        </div>

        {/* Sorting controls */}
        <div className="flex items-center space-x-2 mb-4">
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              Sort by
              <ChevronDown className="ml-2 h-4 w-4" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {[
                    { label: 'Newest', value: 'newest' },
                    { label: 'Highest rated', value: 'highest' },
                    { label: 'Lowest rated', value: 'lowest' },
                  ].map((option) => (
                    <Menu.Item key={option.value}>
                      {({ active }) => (
                        <button
                          onClick={() => setSortOrder(option.value as 'newest' | 'highest' | 'lowest')}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } ${
                            sortOrder === option.value ? 'font-medium' : ''
                          } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                        >
                          {option.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        {/* Load More Button */}
        {visibleReviews < displayedReviews.length && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Load More Reviews
            </button>
          </div>
        )}

        {/* Write Review Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#00b67a] text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-[#00a06d] transition-colors inline-flex items-center shadow-md hover:shadow-lg"
          >
            <Star className="w-5 h-5 mr-2" />
            Write a Review
          </button>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-lg w-full p-6 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <AlertCircle className="w-12 h-12 text-[#00b67a]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Purchase Required</h3>
                <p className="text-gray-600">
                  To write a review, you need to have purchased this product. Please complete
                  a purchase and come back to share your experience.
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}