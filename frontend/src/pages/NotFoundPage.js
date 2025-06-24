// frontend/src/pages/NotFoundPage.js
import React from 'react';
import Layout from '../components/Layout'; // Assuming Layout component exists

function NotFoundPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-6">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-8">Page Not Found</h2>
        <p className="text-lg text-center mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-200 ease-in-out">
          Go to Homepage
        </a>
      </div>
    </Layout>
  );
}

export default NotFoundPage;
