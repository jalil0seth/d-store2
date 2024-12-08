import React, { useState, useEffect } from 'react';
import { MessageCircle, ChevronUp, X, Settings, Send, User, Mail, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';

export default function FloatingElements() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(true);
  const [cookieAccepted, setCookieAccepted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatForm, setChatForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const items = useCartStore((state) => state.items);
  const hasItemsInCart = items.length > 0;

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Chat submitted:', chatForm);
    setChatForm({ name: '', email: '', message: '' });
    setIsChatOpen(false);
  };

  // Adjust chat button position based on cart items
  const chatButtonPosition = hasItemsInCart ? 'bottom-20' : 'bottom-4';

  return (
    <>
      <div className={`fixed left-4 z-50 space-y-2 ${chatButtonPosition} transition-all duration-300`}>
        <AnimatePresence>
          {cookieAccepted && (
            <>
              <AnimatePresence>
                {isChatOpen && (
                  <motion.div
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '-100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm mb-2 overflow-hidden"
                  >
                    <div className="bg-primary-500 p-4 text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-semibold">Chat with us</h3>
                          <p className="text-sm text-primary-100">We typically reply within minutes</p>
                        </div>
                        <button
                          onClick={() => setIsChatOpen(false)}
                          className="p-1.5 hover:bg-primary-400 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <form onSubmit={handleChatSubmit} className="space-y-5">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                              Full Name
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                id="name"
                                required
                                value={chatForm.name}
                                onChange={(e) => setChatForm(prev => ({ ...prev, name: e.target.value }))}
                                className="pl-11 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                placeholder="John Doe"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                              Email Address
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="email"
                                id="email"
                                required
                                value={chatForm.email}
                                onChange={(e) => setChatForm(prev => ({ ...prev, email: e.target.value }))}
                                className="pl-11 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                placeholder="john@example.com"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                              How can we help?
                            </label>
                            <div className="relative">
                              <div className="absolute top-3 left-3 pointer-events-none">
                                <MessageSquare className="h-5 w-5 text-gray-400" />
                              </div>
                              <textarea
                                id="message"
                                required
                                value={chatForm.message}
                                onChange={(e) => setChatForm(prev => ({ ...prev, message: e.target.value }))}
                                rows={4}
                                className="pl-11 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                                placeholder="Type your message here..."
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                        >
                          Send Message
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-4 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
                onClick={() => setIsChatOpen(true)}
                aria-label="Open chat"
              >
                <MessageCircle className="w-6 h-6" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed right-4 z-50 p-3 bg-white text-gray-900 rounded-full shadow-lg hover:bg-gray-50 transition-colors ${hasItemsInCart ? 'bottom-20' : 'bottom-4'}`}
            onClick={scrollToTop}
            aria-label="Back to top"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}