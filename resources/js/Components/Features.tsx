import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, Database, Lock, Cloud, 
  Zap, Users, Globe, Terminal
} from 'lucide-react';

const features = [
  {
    icon: Cpu,
    title: 'AI-Powered Intelligence',
    description: 'Smart code completion and real-time suggestions powered by advanced AI models.',
    color: 'blue'
  },
  {
    icon: Database,
    title: 'Distributed Computing',
    description: 'Scale your development across multiple nodes with our distributed architecture.',
    color: 'indigo'
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Military-grade encryption and compliance with industry standards.',
    color: 'purple'
  },
  {
    icon: Cloud,
    title: 'Cloud Integration',
    description: 'Seamless integration with major cloud providers and services.',
    color: 'sky'
  },
  {
    icon: Zap,
    title: 'Lightning Performance',
    description: 'Optimized for speed with native performance across all platforms.',
    color: 'yellow'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Real-time collaboration tools built for modern development teams.',
    color: 'pink'
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Lightning-fast content delivery through our global network.',
    color: 'emerald'
  },
  {
    icon: Terminal,
    title: 'Advanced CLI',
    description: 'Powerful command-line interface for automated workflows.',
    color: 'violet'
  }
];

export default function Features() {
  return (
    <section className="py-32 relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.05),transparent)]" />
      
      <div className="max-w-[70rem] mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage software licenses efficiently
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${feature.color}-50 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}-500`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}