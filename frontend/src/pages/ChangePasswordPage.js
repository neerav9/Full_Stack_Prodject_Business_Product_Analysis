// frontend/src/pages/ChangePasswordPage.js
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext'; // Make sure this is imported
import axios from 'axios'; // Import axios

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, isAuthenticated, logout } = useAuth(); // You might use user.id, isAuthenticated
  const API_URL = 'http://localhost:5000/api'; // Your backend base API URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) { // Basic frontend validation matching backend
        setError('New password must be at least 6 characters long.');
        return;
    }

    if (currentPassword === newPassword) {
        setError('New password cannot be the same as the current password.');
        return;
    }


    setLoading(true);

    try {
      // --- THIS IS THE CRITICAL CHANGE: Making the actual backend API call ---
      const token = localStorage.getItem('token'); // Get token from local storage

      const response = await axios.put(
        `${API_URL}/users/profile/password`, // The exact endpoint for changing password
        {
          oldPassword: currentPassword, // Match backend's req.body.oldPassword
          newPassword: newPassword      // Match backend's req.body.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}` // Send the JWT token
          }
        }
      );

      setMessage(response.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (err) {
      console.error("Error changing password on frontend:", err);
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center flex-grow">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Change Password</h2>

          {message && <p className="text-green-600 text-sm text-center mb-4">{message}</p>}
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-gray-700 text-sm font-bold mb-2">Current Password:</label>
              <input
                type="password"
                id="currentPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">New Password:</label>
              <input
                type="password"
                id="newPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmNewPassword" className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password:</label>
              <input
                type="password"
                id="confirmNewPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default ChangePasswordPage;