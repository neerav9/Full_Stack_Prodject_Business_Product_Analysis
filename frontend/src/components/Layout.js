// frontend/src/components/Layout.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../context/AuthContext';

function Layout({ children }) {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogout = () => {
    logout(); // Call the logout function from context
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            Analytics App
          </Link>
          <div>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="mr-4 hover:text-gray-300">Login</Link>
                <Link to="/register" className="hover:text-gray-300">Register</Link>
              </>
            ) : (
              <>
                <span className="mr-4 text-gray-300">Welcome, {user ? user.username : 'User'}!</span>
                <Link to="/profile" className="mr-4 hover:text-gray-300">Profile</Link>
                <button onClick={handleLogout} className="hover:text-gray-300 focus:outline-none">Logout</button> {/* Added focus:outline-none */}
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} Analytics App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Layout;