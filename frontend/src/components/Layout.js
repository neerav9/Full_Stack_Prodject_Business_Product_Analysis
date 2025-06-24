// frontend/src/components/Layout.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../context/AuthContext'; 

function Layout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate(); // Initialize useNavigate

    const navigation = [
        { name: 'Dashboard', href: '/analytics-dashboard' },
        { name: 'My Websites', href: '/user-websites' },
        { name: 'Events List', href: '/analytics/events-list' },
        { name: 'Manual Event Creator', href: '/analytics/manual-event' },
        { name: 'Profile', href: '/profile' },
    ];

    // New function to handle logout and redirect
    const handleLogout = async () => {
        await logout(); // Ensure logout logic completes (e.g., clearing token)
        navigate('/'); // Redirect to the homepage
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-blue-800 text-white shadow-lg sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-3xl font-extrabold tracking-tight">
                            InsightFlow
                        </Link>
                    </div>

                    {/* Desktop Navigation Links / Login-Register (Conditional Rendering) */}
                    {isAuthenticated ? (
                        // If authenticated, show main navigation links and user info
                        <>
                            <div className="hidden md:flex flex-grow justify-center items-center space-x-6">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`${
                                            location.pathname === item.href
                                                ? 'text-white border-b-2 border-white'
                                                : 'text-blue-200 hover:text-white hover:border-b-2 hover:border-blue-200'
                                        } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                            <div className="flex items-center space-x-4">
                                <img
                                    className="h-8 w-8 rounded-full border-2 border-blue-300"
                                    src="https://www.gravatar.com/avatar/?d=mp" // Placeholder gravatar
                                    alt="User Avatar"
                                />
                                <span className="text-base font-medium hidden sm:block">
                                    Welcome, {user.username}!
                                </span>
                                <button
                                    onClick={handleLogout} 
                                    className="px-3 py-2 text-sm font-medium text-blue-200 hover:text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Logout
                                </button>
                                {/* Mobile Menu Button (hamburger) - only shown on small screens when logged in */}
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white md:hidden"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    aria-controls="mobile-menu"
                                    aria-expanded="false"
                                >
                                    <span className="sr-only">Open main menu</span>
                                    <svg className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <svg className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        // If not authenticated, show only Login/Register buttons
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-md hover:bg-blue-100 transition duration-200">Login</Link>
                            <Link to="/register" className="rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-green-600 transition duration-200">Register</Link>
                            {/* Mobile Menu Button (hamburger) for logged out state */}
                            <button
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white md:hidden"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-controls="mobile-menu"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Open main menu</span>
                                <svg className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <svg className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                            </button>
                        </div>
                    )}
                </nav>
            </header>

            {/* Mobile Menu (collapsible, revealed by hamburger icon) */}
            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-blue-800 pb-4 shadow-lg`} id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {isAuthenticated ? (
                        navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`${
                                    location.pathname === item.href
                                        ? 'bg-blue-900 text-white'
                                        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                                } block px-3 py-2 rounded-md text-base font-medium`}
                                onClick={() => setMobileMenuOpen(false)} // Close menu on link click
                            >
                                {item.name}
                            </Link>
                        ))
                    ) : (
                        // If not authenticated, show Login/Register in mobile menu
                        <div className="flex flex-col space-y-2">
                            <Link to="/login" className="rounded-md bg-white px-3 py-2 text-base font-semibold text-blue-700 shadow-md hover:bg-blue-100 transition duration-200" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                            <Link to="/register" className="rounded-md bg-green-500 px-3 py-2 text-base font-semibold text-white shadow-md hover:bg-green-600 transition duration-200" onClick={() => setMobileMenuOpen(false)}>Register</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Main content area - Added pt-8 for top padding */}
            <main className="flex-grow pt-8"> 
                {children}
            </main>

            {/* Optional: Footer */}
            <footer className="bg-gray-800 text-gray-400 py-4 text-center text-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    &copy; {new Date().getFullYear()} InsightFlow. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

export default Layout;
