// frontend/src/pages/EventListPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom'; // NEW: useLocation to read URL params

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function EventListPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEvents, setTotalEvents] = useState(0);
    const eventsPerPage = 20; // Matches backend default limit

    // Get date range from URL query parameters
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialStartDate = queryParams.get('startDate') || '';
    const initialEndDate = queryParams.get('endDate') || '';

    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);


    useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        }

        if (user && user.id) {
            const fetchEvents = async () => {
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
                        params: {
                            page: currentPage,
                            limit: eventsPerPage,
                            startDate: startDate, // Pass selected dates to backend
                            endDate: endDate      // Pass selected dates to backend
                        }
                    };

                    const response = await axios.get(`${API_URL}/analytics/events`, config);
                    setEvents(response.data.data || []);
                    setTotalEvents(response.data.pagination.totalEvents);
                    setTotalPages(response.data.pagination.totalPages);
                    console.log("Fetched Events for EventListPage:", response.data.data);

                    setLoading(false);
                } catch (err) {
                    console.error('Error fetching events for Event List Page:', err.response ? err.response.data : err.message);
                    setError(err.response ? err.response.data.message : 'Failed to fetch events data.');
                    setLoading(false);
                }
            };

            fetchEvents();
        } else {
            setLoading(false);
            setError('Please log in to view events.');
        }
    }, [user, isAuthenticated, authLoading, currentPage, startDate, endDate]); // Re-fetch on date or page change

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    if (loading || authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center flex-grow p-6">
                    <p className="text-gray-600 text-lg">Loading events data...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center flex-grow p-6 text-red-600 text-lg">
                    <p className="font-semibold mb-2">Error: {error}</p>
                    {!user && <p>Please <Link to="/login" className="text-blue-700 hover:underline">log in</Link> to access this page.</p>}
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex-grow bg-gray-50 min-h-screen">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center sm:text-left tracking-tight">
                    All Analytics Events
                </h1>

                {/* Date range section for the Events List Page */}
                <section className="mb-6 p-6 rounded-xl shadow-lg bg-white border border-gray-100 flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        <label htmlFor="startDate" className="text-gray-700 font-semibold text-lg">Start Date:</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out w-full sm:w-auto text-base"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        <label htmlFor="endDate" className="text-gray-700 font-semibold text-lg">End Date:</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out w-full sm:w-auto text-base"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recent Events (Table)</h2>
                    {events.length > 0 ? (
                        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Event Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Page Name / URL</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Visitor ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {events.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.event_type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {event.event_details?.page_name || event.event_details?.url || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <pre className="text-xs max-h-24 overflow-auto bg-gray-50 p-2 rounded">{JSON.stringify(event.event_details, null, 2)}</pre>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.visitor_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(event.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center py-10 text-base">No recent events found for this user's websites for the selected date range.</p>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-6">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                            >
                                Previous
                            </button>
                            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </Layout>
    );
}

export default EventListPage;
