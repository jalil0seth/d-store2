import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { FiMenu, FiX, FiUsers, FiBox, FiHome, FiSettings, FiLogOut, FiArrowLeft, FiFileText, FiTool, FiShoppingBag } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const { url } = usePage();
  const { logout } = useAuthStore();

  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/products', icon: FiBox, label: 'Products' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/pages', icon: FiFileText, label: 'Pages' },
    { path: '/admin/config', icon: FiTool, label: 'Store Config' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return url === path;
    }
    return url.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    router.visit('/');
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100 z-40' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onToggle}
      />
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
        style={{ width: '250px' }}
      >
        <div className="flex-1">
          <div className="p-4 flex items-center justify-between border-b">
            <span className="text-xl font-semibold text-gray-800">Admin Panel</span>
            <button
              onClick={onToggle}
              className="lg:hidden hover:bg-gray-100 p-2 rounded-md"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
          <nav className="mt-4">
            <ul>
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                      isActive(item.path) ? 'bg-gray-100 font-semibold' : ''
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className="border-t p-4 space-y-2">
          <Link
            href="/"
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <FiArrowLeft className="w-5 h-5 mr-3" />
            <span>Return to Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
