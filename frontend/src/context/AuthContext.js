// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the Auth Context
const AuthContext = createContext(null);

// Create a custom hook to use the Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // To handle initial auth check

  // Base URL for your backend API
  const API_URL = 'http://localhost:5000/api'; // Changed to base API URL for reusability

  useEffect(() => {
    const token = localStorage.getItem('token');

    const loadUser = async () => {
      if (token) {
        // Set default Authorization header for all subsequent axios requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Fetch user profile from your backend
          const res = await axios.get(`${API_URL}/users/profile`); // Assuming this endpoint exists
          setUser(res.data); // Set user data
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to fetch user profile:', error.response?.data?.message || error.message);
          // If token is invalid or expired, clear it
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false); // Finished initial check
    };

    loadUser();
  }, []); // Empty dependency array means this runs only once on mount

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      // Set default Authorization header for subsequent requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData); // Set user data received from login
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      // For simplicity, we assume registration success means user is ready to login
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization']; // Remove auth header on logout
    setUser(null);
    setIsAuthenticated(false);
  };

  // Value provided to children components
  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-2xl">Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};