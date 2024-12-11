import React from 'react';
import PaymentCountdown from '../Components/PaymentCountdown';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div>
            {children}
            <PaymentCountdown />
        </div>
    );
};

export default MainLayout;
