// frontend/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout'; // We'll create this Layout component

function HomePage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-grow p-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your Analytics Dashboard!</h1>
        <p className="text-xl text-gray-600 mb-8">Start tracking and understanding your user behavior.</p>
        <div className="flex space-x-4">
          <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
            Login
          </Link>
          <Link to="/register" className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300">
            Register
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default HomePage;