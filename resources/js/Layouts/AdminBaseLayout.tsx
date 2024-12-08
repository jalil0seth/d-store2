import React from 'react';
import AdminSidebar from '@/Pages/admin/components/AdminSidebar';
import { useState } from 'react';

interface AdminBaseLayoutProps {
    children: React.ReactNode;
}

const AdminBaseLayout: React.FC<AdminBaseLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-gray-100">
            <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AdminBaseLayout;
