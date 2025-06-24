// frontend/src/pages/ProfilePage.js
import React from 'react';
import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { useAuth } from '../context/AuthContext'; // Import useAuth to access user data and logout

function ProfilePage() {
  const { user, logout, authLoading } = useAuth(); // Get user, logout function, and authLoading state
  const navigate = useNavigate(); // Initialize useNavigate hook

  const handleLogout = async () => {
    await logout(); // Ensure logout completes
    navigate('/login'); // Redirect to login page after logout
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-6">
          <p className="text-lg">Loading profile data...</p>
        </div>
      </Layout>
    );
  }

  // If user is not logged in after authLoading, redirect to login
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-red-600 text-lg p-6">
          <p className="font-semibold mb-2">Please log in to view your profile.</p>
          <Link to="/login" className="text-blue-700 hover:underline">Go to Login</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6"> {/* Ensure full height and background */}
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center border border-gray-100"> {/* Refined card styling */}
          <h1 className="text-3xl font-extrabold text-gray-800 mb-6">User Profile</h1> {/* Stronger title */}

          <div className="mb-6 space-y-3"> {/* Better spacing for user details */}
            <p className="text-gray-700 text-lg">Username: <span className="font-semibold text-gray-900">{user.username || 'N/A'}</span></p>
            <p className="text-gray-700 text-lg">Email: <span className="font-semibold text-gray-900">{user.email || 'N/A'}</span></p>
            {/* Add other user details if available in the user object. Example: */}
            {user.id && <p className="text-gray-700 text-lg">User ID: <span className="font-semibold text-gray-900">{user.id}</span></p>}
          </div>

          <div className="flex flex-col space-y-4 mt-6"> {/* Buttons stacked on small screens, flex on larger */}
            <Link to="/change-password" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-200 ease-in-out text-base font-medium flex items-center justify-center">
              Change Password
              <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2V9a2 2 0 012-2h5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9v2a2 2 0 002 2h2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 15v-2a2 2 0 00-2-2H3" />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200 ease-in-out text-base font-medium flex items-center justify-center"
            >
              Logout
              <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          <Link to="/analytics-dashboard" className="mt-8 inline-block text-blue-600 hover:underline text-base font-medium">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default ProfilePage;
