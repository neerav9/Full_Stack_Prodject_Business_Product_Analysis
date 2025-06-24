// frontend/src/pages/UserWebsitesPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout'; // Assuming Layout component exists
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext for user info
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function UserWebsitesPage() {
  const { user, authLoading } = useAuth();
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    if (!user) {
      setError("Please log in to view your websites.");
      setLoading(false);
      return;
    }

    const fetchUserWebsites = async () => {
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

        const response = await axios.get(`${API_URL}/websites/user`, config);
        setWebsites(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user websites:", err.response ? err.response.data : err.message);
        setError(err.response ? err.response.data.message : "Failed to fetch websites.");
        setLoading(false);
      }
    };

    fetchUserWebsites();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen p-6">
          <p className="text-gray-600 text-lg">Loading user websites...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-red-600 text-lg">
          <p className="font-semibold mb-2">Error: {error}</p>
          {!user && <p>Please <Link to="/login" className="text-blue-700 hover:underline">log in</Link> to access your websites.</p>}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto flex-grow bg-gray-50 min-h-screen rounded-lg shadow-lg mt-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center tracking-tight">
          Your Registered Websites
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Manage the websites you've registered with MyAnalytics.
        </p>

        <div className="flex justify-center mb-8">
          <Link to="/add-website" className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-200 ease-in-out flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Website
          </Link>
        </div>

        {websites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {websites.map(website => (
              <div key={website.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">{website.name}</h3>
                <p className="text-gray-600 mb-1"><strong>URL:</strong> <a href={website.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{website.url}</a></p>
                <p className="text-gray-600 mb-1"><strong>Website ID:</strong> <span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm">{website.id}</span></p>
                <p className="text-gray-600 text-sm italic mt-2">Registered on: {new Date(website.created_at).toLocaleDateString()}</p>
                {/* Add actions like "View Analytics" or "Edit" here */}
                <div className="mt-4 flex justify-end">
                    <Link to="/analytics-dashboard" className="text-blue-600 hover:underline text-sm font-medium">
                        View Analytics
                    </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 text-lg py-8">
            You haven't registered any websites yet. Click "Add New Website" to get started!
          </p>
        )}
      </div>
    </Layout>
  );
}

export default UserWebsitesPage;
