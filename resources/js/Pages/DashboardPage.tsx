import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Package2, CreditCard, Settings, History, Database, Users, Layout, FileText } from 'lucide-react';

interface Props {
  auth: {
    user: {
      name: string;
      email: string;
      is_admin?: boolean;
    };
  };
}

export default function DashboardPage() {
  const { auth } = usePage().props as Props;
  const isAdmin = auth.user?.is_admin || false;

  const adminSections = [
    { icon: Database, title: 'Store Config', description: 'Manage store settings', href: '/admin/config' },
    { icon: Package2, title: 'Products', description: 'Manage product catalog', href: '/admin/products' },
    { icon: Users, title: 'Partners', description: 'Manage store partners', href: '/admin/partners' },
    { icon: Layout, title: 'Features', description: 'Manage store features', href: '/admin/features' },
    { icon: FileText, title: 'Testimonials', description: 'Manage testimonials', href: '/admin/testimonials' }
  ];

  const userSections = [
    { icon: Package2, title: 'My Licenses', count: '5 Active', href: '/licenses' },
    { icon: CreditCard, title: 'Billing', count: 'Up to date', href: '/billing' },
    { icon: Settings, title: 'Settings', count: '', href: '/settings' },
    { icon: History, title: 'History', count: '12 Orders', href: '/history' }
  ];

  const sections = isAdmin ? adminSections : userSections;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {auth.user?.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isAdmin ? 'Manage your store from here' : 'Manage your account and licenses'}
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg overflow-hidden hover:bg-gray-50 transition-colors duration-200"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                      <IconComponent className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {section.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {section.description || section.count}
                    </p>
                  </div>
                  <span
                    className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                    aria-hidden="true"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                    </svg>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}