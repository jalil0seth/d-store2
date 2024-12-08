import React from 'react';
import { motion } from 'framer-motion';
import './BrandBar.css';

const partners = [
  'Adobe', 'Microsoft', 'Autodesk', 'Kaspersky', 'Miro', 'LinkedIn', 'Atlassian', 'Salesforce'
];

export default function BrandBar() {
  return (
    <div className="relative -mt-20 mb-12">
      <div className="max-w-[80rem] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="relative bg-white/80 backdrop-blur-md rounded-3xl border border-gray-200/60 p-8 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 text-center">
            Trusted by leading companies worldwide
          </p>
          
          <div className="marquee-container">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-12">
              {[...partners, ...partners].map((partner, i) => (
                <span
                  key={`${partner}-${i}`}
                  className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 
                    bg-clip-text text-transparent 
                    transition-all duration-300"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}