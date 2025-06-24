// frontend/src/pages/AnalyticsDashboardPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AnalyticsDashboardPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [events, setEvents] = useState([]);
    const [popularPages, setPopularPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- NEW: State for date range ---
    const [startDate, setStartDate] = useState(''); // YYYY-MM-DD format
    const [endDate, setEndDate] = useState('');   // YYYY-MM-DD format
    // --- END NEW ---

    useEffect(() => {
        console.log("AnalyticsDashboardPage: User object from useAuth:", user);
        console.log("AnalyticsDashboardPage: isAuthenticated from useAuth:", isAuthenticated);
        console.log("AnalyticsDashboardPage: authLoading from useAuth:", authLoading);

        if (authLoading) {
            setLoading(true);
            return;
        }

        if (user && user.id) {
            const fetchAnalyticsData = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        setError('Authentication token not found. Please log in.');
                        setLoading(false);
                        return;
                    }

                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        // --- NEW: Params for date range ---
                        params: {
                            startDate, // Will be empty string if not set, which is fine for backend
                            endDate    // Will be empty string if not set, which is fine for backend
                        }
                        // --- END NEW ---
                    };

                    const eventsResponse = await axios.get(`${API_URL}/analytics/events`, config);
                    setEvents(eventsResponse.data.data || []);
                    console.log("Fetched Events:", eventsResponse.data.data);

                    const popularPagesResponse = await axios.get(`${API_URL}/analytics/summary/popular-pages`, config);
                    setPopularPages(popularPagesResponse.data.data || []);
                    console.log("Fetched Popular Pages:", popularPagesResponse.data.data);

                    setLoading(false);
                } catch (err) {
                    console.error('Error fetching analytics data:', err.response ? err.response.data : err.message);
                    setError(err.response ? err.response.data.message : 'Failed to fetch analytics data.');
                    setLoading(false);
                }
            };

            fetchAnalyticsData();
        } else {
            setLoading(false);
            setError('Please log in to view analytics data.');
        }
    // --- NEW: Add startDate and endDate to dependency array so data refetches when they change ---
    }, [user, isAuthenticated, authLoading, startDate, endDate]);
    // --- END NEW ---

    if (loading || authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center flex-grow p-6">
                    <p className="text-gray-600">Loading analytics data...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="flex items-center justify-center flex-grow p-6 text-red-600">
                    <p>Error: {error}</p>
                    {!user && <p>Please <Link to="/login" className="text-blue-600 hover:underline">log in</Link> to access this page.</p>}
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6 flex-grow">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics Dashboard for {user?.username}</h1>

                {/* --- NEW: Date Range Selection --- */}
                <section className="mb-6 bg-white p-4 rounded-lg shadow flex items-center space-x-4">
                    <label htmlFor="startDate" className="text-gray-700 font-medium">Start Date:</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <label htmlFor="endDate" className="text-gray-700 font-medium">End Date:</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* The useEffect hook will automatically refetch data when startDate or endDate changes */}
                </section>
                {/* --- END NEW --- */}

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Popular Pages</h2>
                    {popularPages.length > 0 ? (
                        <ul className="list-disc pl-5 bg-white p-4 rounded-lg shadow">
                            {popularPages.map((page, index) => (
                                <li key={index} className="mb-2 text-gray-700">
                                    <span className="font-medium">{page.page_name || page.url || 'Unknown Page'}</span>: {page.view_count} views
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">No popular page data available yet.</p>
                    )}
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recent Events</h2>
                    {events.length > 0 ? (
                        <div className="overflow-x-auto bg-white rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Name / URL</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {events.map((event) => (
                                        <tr key={event.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.event_type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {event.event_details?.page_name || event.event_details?.url || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <pre className="text-xs max-h-24 overflow-auto">{JSON.stringify(event.event_details, null, 2)}</pre>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.visitor_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(event.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600">No recent events found for this user's websites. Have you generated data from your dummy sites with this user's ID?</p>
                    )}
                </section>
            </div>
        </Layout>
    );
}

export default AnalyticsDashboardPage;