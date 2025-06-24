// frontend/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout'; // Assuming Layout component provides top nav

function HomePage() {
  return (
    <Layout>
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-blue-50 to-blue-200 py-24 sm:py-32 min-h-[calc(100vh-64px)] flex items-center justify-center"> {/* Centered content */}
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center"> {/* Centered text */}
          <div className="mx-auto max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
              Unlock the Power of Your Data
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-700 mb-10">
              InsightFlow helps you understand your website visitors, track key actions, and make data-driven decisions to grow your online presence.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6"> {/* Buttons with more prominent styling */}
              <Link
                to="/login"
                className="w-full sm:w-auto rounded-md bg-blue-600 px-8 py-4 text-xl font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition duration-200"
              >
                Login to Dashboard
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto rounded-md bg-green-600 px-8 py-4 text-xl font-semibold text-white shadow-lg hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition duration-200"
              >
                Register Now
              </Link>
            </div>
          </div>
          {/* Removed the image section */}
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Key Features
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Discover what makes InsightFlow an essential tool for your website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
              <svg className="h-12 w-12 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">
                See live data updates, page views, and user interactions as they happen.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
              <svg className="h-12 w-12 text-green-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.155C4.345 15.532 5 12 5 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">User Behavior Insights</h3>
              <p className="text-gray-600">
                Understand how users navigate your site, which content resonates most, and where they drop off.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
              <svg className="h-12 w-12 text-purple-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Goal Tracking</h3>
              <p className="text-gray-600">
                Define and track custom events like form submissions, downloads, or sign-ups.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold sm:text-4xl mb-6">Ready to Start Analyzing?</h2>
          <p className="text-xl leading-8 opacity-90 mb-10">
            Join thousands of website owners who are already gaining valuable insights with InsightFlow.
          </p>
          <div className="flex justify-center gap-x-6">
            <Link
              to="/register"
              className="rounded-md bg-white px-8 py-4 text-xl font-semibold text-blue-700 shadow-lg hover:bg-blue-100 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get Started for Free
            </Link>
            <Link to="/contact" className="text-xl font-semibold leading-6 text-white hover:text-blue-100 transition duration-200">
              Learn More <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default HomePage;
