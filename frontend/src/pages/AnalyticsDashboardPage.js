// frontend/src/pages/AnalyticsDashboardPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// Chart Imports
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement,
    ChartDataLabels
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const DUMMY_WEBSITE_ID_FOR_TESTING = 14; // Ensure this matches your dummy website's ID

function AnalyticsDashboardPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [popularPages, setPopularPages] = useState([]);
    const [eventsByDate, setEventsByDate] = useState([]);
    const [eventTypeBreakdown, setEventTypeBreakdown] = useState([]);
    const [totalPageViews, setTotalPageViews] = useState(0);
    const [uniqueVisitorsCount, setUniqueVisitorsCount] = useState(0);
    const [conversionRate, setConversionRate] = useState(0); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
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

                    const requestParams = {
                        user_website_id: DUMMY_WEBSITE_ID_FOR_TESTING,
                        startDate,
                        endDate
                    };

                    console.log('DEBUG: Fetching analytics data with params:', requestParams);

                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        params: requestParams
                    };

                    // Fetch Popular Pages
                    const popularPagesResponse = await axios.get(`${API_URL}/analytics/summary/popular-pages`, config);
                    console.log('DEBUG: Popular Pages Response:', popularPagesResponse.data);
                    setPopularPages(popularPagesResponse.data.data || []);

                    // Fetch Events By Date
                    const eventsByDateResponse = await axios.get(`${API_URL}/analytics/summary/events-by-date`, config);
                    console.log('DEBUG: Events By Date Response:', eventsByDateResponse.data);
                    setEventsByDate(eventsByDateResponse.data.data || []);

                    // Fetch Event Type Breakdown
                    const eventTypeBreakdownResponse = await axios.get(`${API_URL}/analytics/summary/event-types-breakdown`, config);
                    const fetchedEventTypeBreakdown = eventTypeBreakdownResponse.data.data || [];
                    console.log('DEBUG: Event Type Breakdown Response:', eventTypeBreakdownResponse.data);
                    setEventTypeBreakdown(fetchedEventTypeBreakdown);

                    // Fetch Total Page Views
                    const totalPageViewsResponse = await axios.get(`${API_URL}/analytics/summary/page-views`, config);
                    console.log('DEBUG: Total Page Views Response:', totalPageViewsResponse.data);
                    setTotalPageViews(totalPageViewsResponse.data.data.total_page_views || 0);

                    // Fetch Unique Visitors
                    const uniqueVisitorsResponse = await axios.get(`${API_URL}/analytics/summary/unique-visitors`, config);
                    const fetchedUniqueVisitorsCount = uniqueVisitorsResponse.data.data.unique_visitors_count || 0;
                    console.log('DEBUG: Unique Visitors Response:', uniqueVisitorsResponse.data);
                    setUniqueVisitorsCount(fetchedUniqueVisitorsCount);

                    // Calculate Conversion Rate
                    const conversionEventTypes = ['newsletter_subscribe', 'contact_form_submit', 'signup', 'purchase'];
                    let totalConversions = 0;
                    fetchedEventTypeBreakdown.forEach(event => {
                        if (conversionEventTypes.includes(event.event_type)) {
                            totalConversions += event.event_count;
                        }
                    });
                    const calculatedConversionRate = fetchedUniqueVisitorsCount > 0
                        ? ((totalConversions / fetchedUniqueVisitorsCount) * 100).toFixed(2)
                        : 0;
                    setConversionRate(calculatedConversionRate);
                    console.log('DEBUG: Calculated Conversion Rate:', calculatedConversionRate);

                    console.log('DEBUG: Dashboard state after data fetch:', {
                        popularPages: popularPagesResponse.data.data,
                        eventsByDate: eventsByDateResponse.data.data,
                        eventTypeBreakdown: fetchedEventTypeBreakdown,
                        totalPageViews: totalPageViewsResponse.data.data.total_page_views,
                        uniqueVisitorsCount: fetchedUniqueVisitorsCount,
                        conversionRate: calculatedConversionRate
                    });

                    setLoading(false);
                } catch (err) {
                    console.error('ERROR: Failed to fetch analytics data:', err.response ? err.response.data : err.message, err);
                    setError(err.response ? err.response.data.message : 'Failed to fetch analytics data.');
                    setLoading(false);
                }
            };

            fetchAnalyticsData();
        } else {
            setLoading(false);
            setError('Please log in to view analytics data.');
        }
    }, [user, isAuthenticated, authLoading, startDate, endDate]);

    const handleViewAllEvents = () => {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.set('startDate', startDate);
        if (endDate) queryParams.set('endDate', endDate);
        queryParams.set('user_website_id', DUMMY_WEBSITE_ID_FOR_TESTING); 
        navigate(`/analytics/events-list?${queryParams.toString()}`);
    };

    if (loading || authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center flex-grow p-6">
                    <p className="text-gray-600 text-lg">Loading analytics data...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center flex-grow p-6 text-red-600 text-lg text-center">
                    <p className="font-semibold mb-4 text-xl">Error Loading Dashboard:</p>
                    <p className="mb-4">{error}</p>
                    <p className="text-gray-700">Please check your network connection, ensure your backend server is running, and verify that the `user_website_id` (currently {DUMMY_WEBSITE_ID_FOR_TESTING}) matches the events you've sent.</p>
                    {!user && <p className="mt-4">Please <Link to="/login" className="text-blue-700 hover:underline">log in</Link> to access this page.</p>}
                </div>
            </Layout>
        );
    }

    // Prepare data for Popular Pages Bar Chart
    const popularPagesChartData = {
        labels: popularPages.map((page, index) => page.page_name || page.page_url || `Page ${index + 1}`), // Use actual page names/URLs for labels
        datasets: [
            {
                label: 'Page Views',
                data: popularPages.map(page => page.view_count),
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                borderRadius: 4,
                categoryPercentage: 0.8,
                barPercentage: 0.9
            },
        ],
    };

    const popularPagesChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Most Viewed Pages',
                font: {
                    size: 18,
                    weight: 'bold'
                },
                color: '#222'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const page = popularPages[context.dataIndex];
                        return `${page.page_name || page.page_url || 'Unknown'}: ${context.parsed.y.toLocaleString()} views`;
                    }
                },
                titleFont: { size: 16 },
                bodyFont: { size: 14 },
                padding: 10,
                backgroundColor: 'rgba(0,0,0,0.7)',
                bodyColor: '#fff',
                titleColor: '#fff',
            },
            datalabels: {
                display: true,
                color: '#333',
                font: {
                    weight: 'bold',
                    size: 14,
                },
                formatter: function(value, context) {
                    return value.toLocaleString();
                },
                anchor: 'end',
                align: 'top',
                offset: 4,
                textShadowBlur: 2,
                textShadowColor: 'rgba(255, 255, 255, 0.7)'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'View Count',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#555'
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    color: '#666',
                    precision: 0
                },
                grid: {
                    color: 'rgba(200, 200, 200, 0.3)',
                    borderDash: [5, 5]
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Page', // Changed title to reflect actual page names
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#555'
                },
                ticks: {
                    font: {
                        size: 12,
                    },
                    color: '#666',
                    autoSkip: false,
                    maxRotation: 45, // Allow rotation for longer page names
                    minRotation: 0,
                    padding: 10
                }
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                bottom: 10
            }
        }
    };

    // Prepare data for Events Over Time Line Chart
    const eventsOverTimeChartData = {
        labels: eventsByDate.map(data => {
            const date = new Date(data.event_date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }),
        datasets: [
            {
                label: 'Total Events',
                data: eventsByDate.map(data => data.event_count),
                fill: true,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                cubicInterpolationMode: 'monotone'
            },
        ],
    };

    const eventsOverTimeChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 14
                    },
                    color: '#444'
                }
            },
            title: {
                display: true,
                text: 'Events Over Time',
                font: {
                    size: 18,
                    weight: 'bold'
                },
                color: '#222'
            },
            tooltip: {
                callbacks: {
                    title: function(context) {
                        return context[0].label;
                    },
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += context.parsed.y.toLocaleString() + ' events';
                        return label;
                    }
                },
                titleFont: { size: 16 },
                bodyFont: { size: 14 },
                padding: 10,
                backgroundColor: 'rgba(0,0,0,0.7)',
                bodyColor: '#fff',
                titleColor: '#fff',
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Events',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#555'
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    color: '#666',
                    precision: 0
                },
                grid: {
                    color: 'rgba(200, 200, 200, 0.3)',
                    borderDash: [5, 5]
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: '#555'
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    color: '#666',
                    autoSkip: true,
                    maxRotation: 45,
                    minRotation: 0,
                }
            }
        }
    };

    // Prepare data for Event Type Breakdown Pie Chart
    const eventTypeBreakdownChartData = {
        labels: eventTypeBreakdown.map(data => data.event_type),
        datasets: [
            {
                label: 'Event Count',
                data: eventTypeBreakdown.map(data => data.event_count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)', // Red
                    'rgba(54, 162, 235, 0.8)', // Blue
                    'rgba(255, 206, 86, 0.8)', // Yellow
                    'rgba(75, 192, 192, 0.8)', // Green
                    'rgba(153, 102, 255, 0.8)', // Purple
                    'rgba(255, 159, 64, 0.8)', // Orange
                    'rgba(199, 199, 199, 0.8)', // Gray
                    'rgba(100, 100, 100, 0.8)', // Darker Gray for more types
                    'rgba(200, 0, 0, 0.8)', // Dark Red
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(100, 100, 100, 1)',
                    'rgba(200, 0, 0, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const eventTypeBreakdownChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    font: {
                        size: 14
                    },
                    color: '#444'
                }
            },
            title: {
                display: true,
                text: 'Event Type Breakdown',
                font: {
                    size: 18,
                    weight: 'bold'
                },
                color: '#222'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((acc, current) => acc + current, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                    }
                },
                titleFont: { size: 16 },
                bodyFont: { size: 14 },
                padding: 10,
                backgroundColor: 'rgba(0,0,0,0.7)',
                bodyColor: '#fff',
                titleColor: '#fff',
            },
            datalabels: {
                display: true,
                color: '#fff',
                font: {
                    weight: 'bold',
                    size: 12,
                },
                formatter: function(value, context) {
                    const total = context.dataset.data.reduce((acc, current) => acc + current, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${percentage}%`;
                },
                textShadowBlur: 2,
                textShadowColor: 'rgba(0, 0, 0, 0.5)'
            }
        }
    };

    return (
        <Layout>
            <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex-grow bg-gray-50 min-h-screen">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-8 text-center sm:text-left tracking-tight">
                    Analytics Dashboard for {user?.username}
                </h1>

                <section className="mb-8 p-6 rounded-xl shadow-lg bg-white border border-gray-100 flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-xl flex items-center justify-between transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl">
                        <div>
                            <p className="text-sm md:text-base opacity-80 mb-1">Total Page Views</p>
                            <p className="text-4xl md:text-5xl font-bold">{totalPageViews.toLocaleString()}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-eye opacity-60">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </div>

                    <div className="bg-gradient-to-br from-green-600 to-green-800 text-white p-6 rounded-xl shadow-xl flex items-center justify-between transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl">
                        <div>
                            <p className="text-sm md:text-base opacity-80 mb-1">Unique Visitors</p>
                            <p className="text-4xl md:text-5xl font-bold">{uniqueVisitorsCount.toLocaleString()}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-users opacity-60">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>

                    {/* Conversion Rate Card */}
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-xl shadow-xl flex items-center justify-between transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl">
                        <div>
                            <p className="text-sm md:text-base opacity-80 mb-1">Conversion Rate</p>
                            <p className="text-4xl md:text-5xl font-bold">{conversionRate}%</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up opacity-60">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                    </div>
                </div>

                {/* Popular Pages section with chart and custom legend - Now full width */}
                <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col lg:flex-row mb-8 w-full">
                    {/* Chart area - takes 2/3 width on large screens */}
                    <div className="lg:w-2/3">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Most Viewed Pages</h2>
                        {popularPages.length > 0 ? (
                            <div style={{ height: '400px' }}>
                                <Bar data={popularPagesChartData} options={popularPagesChartOptions} />
                            </div>
                        ) : (
                            <p className="text-gray-600 text-center py-10 text-base">No popular page data available for the selected date range.</p>
                        )}
                    </div>
                    {/* Custom Legend area - takes 1/3 width on large screens */}
                    {popularPages.length > 0 && (
                        <div className="lg:w-1/3 lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-200 mt-6 lg:mt-0">
                            <h3 className="text-xl font-semibold text-gray-700 mb-4">Page Details</h3>
                            <ul className="space-y-3">
                                {popularPages.map((page, index) => (
                                    <li key={index} className="flex items-start text-gray-800">
                                        <span className="font-bold text-blue-600 mr-2 min-w-[50px]">Page {index + 1}:</span>
                                        <div>
                                            <p className="font-medium text-gray-900">{page.page_name || page.page_url || 'Unknown'}</p>
                                            <p className="text-sm text-gray-600">{page.view_count.toLocaleString()} views</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Events Over Time</h2>
                        {eventsByDate.length > 0 ? (
                            <div style={{ height: '400px' }}>
                                <Line data={eventsOverTimeChartData} options={eventsOverTimeChartOptions} />
                            </div>
                        ) : (
                            <p className="text-gray-600 text-center py-10 text-base">No event data available for the selected date range to display trend.</p>
                        )}
                        <div className="mt-6 text-center">
                            <button
                                onClick={handleViewAllEvents}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                View All Events
                                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </section>

                    <section className="col-span-1 md:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Event Type Breakdown</h2>
                        {eventTypeBreakdown.length > 0 ? (
                            <div style={{ height: '400px' }}>
                                <Pie data={eventTypeBreakdownChartData} options={eventTypeBreakdownChartOptions} />
                            </div>
                        ) : (
                            <p className="text-gray-600 text-center py-10 text-base">No event type breakdown data available for the selected date range.</p>
                        )}
                    </section>
                </div>
            </div>
        </Layout>
    );
}

export default AnalyticsDashboardPage;
