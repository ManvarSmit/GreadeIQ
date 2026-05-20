import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-dark-bg font-sans text-dark-text selection:bg-primary-500/30">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out lg:ml-72 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
                
                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 animate-fade-in z-10">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
};

export default Layout;
