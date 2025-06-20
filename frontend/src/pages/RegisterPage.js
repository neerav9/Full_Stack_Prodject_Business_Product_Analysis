// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext'; // Import useAuth

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for displaying errors
  const [successMessage, setSuccessMessage] = useState(''); // State for success messages
  const [loading, setLoading] = useState(false); // State for loading indicator
  const { register } = useAuth(); // Access the register function from AuthContext
  const navigate = useNavigate(); // Hook for navigation after registration

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success messages
    setLoading(true); // Set loading state

    const result = await register(username, email, password); // Call the register function

    if (result.success) {
      setSuccessMessage(result.message || 'Registration successful! You can now log in.');
      // Optionally, redirect to login page after successful registration
      setTimeout(() => navigate('/login'), 2000); // Redirect after 2 seconds
    } else {
      setError(result.message || 'Registration failed. Please try again.'); // Display error message
    }
    setLoading(false); // Reset loading state
  };

  return (
    <Layout>
      <div className="flex items-center justify-center flex-grow">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Register</h2>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>} {/* Error display */}
          {successMessage && <p className="text-green-600 text-sm text-center mb-4">{successMessage}</p>} {/* Success display */}
          <form onSubmit={handleSubmit}> {/* Attach handleSubmit to form */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
              <input
                type="text"
                id="username"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)} // Update state on change
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update state on change
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
              <input
                type="password"
                id="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Update state on change
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading} // Disable button when loading
            >
              {loading ? 'Registering...' : 'Register'} {/* Change button text during loading */}
            </button>
          </form>
          <p className="text-center text-gray-600 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default RegisterPage;