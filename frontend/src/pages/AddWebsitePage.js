// frontend/src/pages/AddWebsitePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout'; // Assuming Layout component exists
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext for user info
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AddWebsitePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [websiteName, setWebsiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!user) {
      setError("You must be logged in to add a website.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const payload = {
        name: websiteName,
        url: websiteUrl
      };

      const response = await axios.post(`${API_URL}/websites/add`, payload, config);
      setMessage(response.data.message || "Website added successfully!");
      setWebsiteName(''); // Clear form
      setWebsiteUrl(''); // Clear form
      // Optionally navigate back to user websites list or dashboard
      setTimeout(() => {
        navigate('/user-websites'); // Or '/analytics-dashboard'
      }, 2000);

    } catch (err) {
      console.error("Error adding website:", err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : "Failed to add website.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Add New Website</h1>

          {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="websiteName" className="block text-sm font-medium text-gray-700 mb-1">Website Name</label>
              <input
                type="text"
                id="websiteName"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="e.g., My Awesome Blog"
              />
            </div>
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input
                type="url" // Use type="url" for better validation
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="e.g., https://www.example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Website...' : 'Add Website'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default AddWebsitePage;
