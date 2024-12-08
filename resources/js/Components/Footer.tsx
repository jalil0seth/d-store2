import React from 'react';
import { Mail, Phone, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const links = {
    'Categories': ['Design Software', 'Engineering Tools', 'Collaboration', 'Enterprise'],
    'Support': ['Contact', 'Documentation', 'License Info', 'FAQs'],
    'Company': ['About Us', 'Careers', 'Blog', 'Terms'],
    'Legal': ['Privacy Policy', 'Terms of Service', 'Refund Policy', 'License Terms']
  };

  const socials = [
    { icon: Github, href: '#' },
    { icon: Twitter, href: '#' },
    { icon: Linkedin, href: '#' }
  ];

  return (
    <footer className="bg-gray-50 pt-20 pb-8">
      <div className="max-w-[80rem] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="mb-4">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                SoftwareStore
              </span>
            </div>
            <p className="text-gray-600 mb-6">
              Authorized reseller of professional software licenses
            </p>
            <div className="space-y-3">
              <a href="mailto:support@softwarestore.com" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Mail className="w-5 h-5" />
                <span>support@softwarestore.com</span>
              </a>
              <a href="tel:1-800-SOFTWARE" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Phone className="w-5 h-5" />
                <span>1-800-SOFTWARE</span>
              </a>
            </div>
          </div>
          
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-900 mb-4">{category}</h3>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i}>
                    <a 
                      href="#" 
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-center md:text-left">
            © 2024 SoftwareStore. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socials.map(({ icon: Icon, href }, i) => (
              <a
                key={i}
                href={href}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}