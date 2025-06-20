// frontend/src/pages/ProfilePage.js
import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../context/AuthContext'; // Import useAuth to access user data and logout

function ProfilePage() {
  const { user, logout } = useAuth(); // Get user and logout function

  const handleLogout = () => {
    logout(); // This will trigger the redirect set in Layout.js
  };

  return (
    <Layout>
      <div className="flex items-center justify-center flex-grow">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User Profile</h2>
          {user && (
            <div className="mb-4">
              <p className="text-gray-700 text-lg">Username: <span className="font-semibold">{user.username}</span></p>
              <p className="text-gray-700 text-lg">Email: <span className="font-semibold">{user.email}</span></p>
              {/* Add other user details if available in the user object */}
            </div>
          )}
          {!user && <p className="text-gray-700">Loading user profile...</p>} {/* Show loading if user not yet loaded */}

          {/* Use Link for navigation */}
          <Link to="/change-password" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block">
            Change Password
          </Link>
          {/* Remove the redundant logout button if it's already in the header/layout */}
          {/* If you want a logout button here too, make sure its onClick calls handleLogout */}
          <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2">
            Logout
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default ProfilePage;