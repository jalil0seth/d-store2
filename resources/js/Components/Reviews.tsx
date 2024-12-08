import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, Building2, Users } from 'lucide-react';

const REVIEWS = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'CTO',
    company: 'TechFlow Solutions',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150',
    content: 'The software licensing platform has transformed how we manage our team\'s tools. Incredible service and support.',
    rating: 5,
    teamSize: '100-500',
    industry: 'Technology'
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    role: 'Engineering Lead',
    company: 'Innovate Inc',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150',
    content: 'Streamlined our entire software procurement process. The automated license management is a game-changer.',
    rating: 5,
    teamSize: '50-100',
    industry: 'Software'
  },
  {
    id: 3,
    name: 'Emily Watson',
    role: 'Design Director',
    company: 'Creative Studios',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150',
    content: 'Finally, a platform that understands enterprise software needs. The support team is exceptional.',
    rating: 5,
    teamSize: '10-50',
    industry: 'Design'
  }
];

const STATS = [
  { label: 'Happy Customers', value: '10,000+' },
  { label: 'Countries Served', value: '150+' },
  { label: 'Enterprise Clients', value: '500+' },
  { label: 'Customer Satisfaction', value: '99.9%' }
];

export default function Reviews() {
  return (
    <section className="py-12 bg-white">
      <div className="container-width">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Trusted by Industry Leaders
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of satisfied customers worldwide
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {STATS.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary-100" />
              
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src={review.image}
                  alt={review.name}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-white"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{review.name}</h4>
                  <p className="text-sm text-gray-600">{review.role}</p>
                  <p className="text-sm text-primary-600">{review.company}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <p className="text-gray-600 mb-4">"{review.content}"</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{review.industry}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{review.teamSize} employees</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}