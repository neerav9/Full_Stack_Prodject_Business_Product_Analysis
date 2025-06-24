// frontend/src/pages/ManualEventCreatorPage.js
import React, { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Papa from 'papaparse'; // Import PapaParse

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const DUMMY_WEBSITE_ID_FOR_TESTING = 14; // Corrected to match dummy website (e.g., index.html)

function ManualEventCreatorPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    // State for single event entry
    const [eventType, setEventType] = useState('page_view');
    const [pageName, setPageName] = useState('');
    const [pageUrl, setPageUrl] = useState('');
    const [visitorId, setVisitorId] = useState('');
    const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
    const [eventDetails, setEventDetails] = useState('{}');

    // State for bulk upload
    const [csvFile, setCsvFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [eventsSentCount, setEventsSentCount] = useState(0);
    const [totalEventsToUpload, setTotalEventsToUpload] = useState(0);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // For single event submission

    // Auto-fill visitor ID if user is logged in (optional, but convenient)
    React.useEffect(() => {
        if (!authLoading && isAuthenticated && user && !visitorId) {
            setVisitorId(`user-${user.id}-${Math.random().toString(36).substring(2, 9)}`);
        } else if (!authLoading && !isAuthenticated && !visitorId) {
            setVisitorId(`visitor-${Math.random().toString(36).substring(2, 11)}`);
        }
    }, [user, isAuthenticated, authLoading, visitorId]);

    const handleSingleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (!user || !isAuthenticated) {
            setError('You must be logged in to create events.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found. Please log in.');
                setLoading(false);
                return;
            }

            let parsedEventDetails = {};
            try {
                parsedEventDetails = JSON.parse(eventDetails);
            } catch (jsonError) {
                setError('Event Details must be valid JSON.');
                setLoading(false);
                return;
            }

            const payload = {
                user_website_id: DUMMY_WEBSITE_ID_FOR_TESTING, // Fixed for testing
                event_type: eventType,
                event_details: {
                    page_name: pageName,
                    url: pageUrl,
                    timestamp: timestamp,
                    ...parsedEventDetails
                },
                visitor_id: visitorId,
                user_id: user.id // This correctly associates with the user
            };

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.post(`${API_URL}/analytics/collect`, payload, config);
            setMessage(response.data.message || 'Single event sent successfully!');

        } catch (err) {
            console.error('Error sending single event:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : 'Failed to send single event.');
        } finally {
            setLoading(false);
        }
    };

    const handleCsvFileChange = (e) => {
        setCsvFile(e.target.files[0]);
        setUploadStatus('');
        setUploadError('');
        setEventsSentCount(0);
        setTotalEventsToUpload(0);
    };

    const handleBulkUpload = () => {
        if (!csvFile) {
            setUploadError('Please select a CSV file first.');
            return;
        }

        if (!user || !isAuthenticated) {
            setUploadError('You must be logged in to upload events.');
            return;
        }

        setUploadStatus('Parsing CSV file...');
        setUploadError('');
        setEventsSentCount(0);
        setTotalEventsToUpload(0); // Reset total until parsing is done

        const expectedHeaders = ['event_type', 'page_name', 'page_url', 'visitor_id', 'timestamp', 'event_details_json'];
        const token = localStorage.getItem('token');

        Papa.parse(csvFile, {
            header: true, // Treat first row as headers
            skipEmptyLines: true,
            worker: true, // Use a web worker for parsing large files
            dynamicTyping: false, // Keep all values as strings
            complete: async (results) => {
                if (results.errors.length > 0) {
                    setUploadError(`CSV parsing errors: ${results.errors.map(err => err.message).join('; ')}`);
                    setUploadStatus('');
                    return;
                }

                const data = results.data;

                if (data.length === 0) {
                    setUploadError('CSV file is empty or contains no data rows.');
                    setUploadStatus('');
                    return;
                }

                // Validate headers
                const parsedHeaders = Object.keys(data[0]);
                const missingHeaders = expectedHeaders.filter(header => !parsedHeaders.includes(header));
                if (missingHeaders.length > 0) {
                    setUploadError(`Missing required CSV headers: ${missingHeaders.join(', ')}. Please ensure your CSV has: ${expectedHeaders.join(', ')}`);
                    setUploadStatus('');
                    return;
                }

                setTotalEventsToUpload(data.length);
                let successfulUploads = 0;
                let failedUploads = 0;
                let currentIndex = 0;

                setUploadStatus(`Uploading 0 of ${data.length} events...`);

                for (const row of data) {
                    currentIndex++;
                    setUploadStatus(`Uploading ${currentIndex} of ${data.length} events...`);
                    try {
                        let parsedEventDetails = {};
                        const eventDetailsJsonString = row.event_details_json || '{}'; // Default to empty object if null/undefined

                        // Try to parse JSON. PapaParse usually handles quotes well,
                        // but sometimes Excel can add extra outer quotes or mess up escapes.
                        // We'll clean up potential outer quotes from Excel like '"{...}"' => "{...}"
                        let cleanJsonString = eventDetailsJsonString.trim();
                        if (cleanJsonString.startsWith('"') && cleanJsonString.endsWith('"')) {
                            cleanJsonString = cleanJsonString.substring(1, cleanJsonString.length - 1);
                        }
                        // Also, handle "" escaping if Excel does it, convert to "
                        cleanJsonString = cleanJsonString.replace(/""/g, '"');


                        try {
                            parsedEventDetails = JSON.parse(cleanJsonString);
                        } catch (jsonParseError) {
                            console.warn(`Skipping row due to invalid JSON in event_details_json: ${eventDetailsJsonString}. Cleaned: ${cleanJsonString}. Error: ${jsonParseError.message}`);
                            failedUploads++;
                            continue;
                        }

                        const payload = {
                            user_website_id: DUMMY_WEBSITE_ID_FOR_TESTING, // Fixed for testing
                            event_type: row.event_type,
                            event_details: {
                                page_name: row.page_name,
                                url: row.page_url,
                                timestamp: row.timestamp,
                                ...parsedEventDetails
                            },
                            visitor_id: row.visitor_id,
                            user_id: user.id
                        };

                        await axios.post(`${API_URL}/analytics/collect`, payload, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        successfulUploads++;
                        setEventsSentCount(successfulUploads);

                    } catch (err) {
                        console.error(`Error sending event from CSV row (${JSON.stringify(row)}). Error:`, err.response ? err.response.data : err.message);
                        failedUploads++;
                    }
                }

                if (failedUploads > 0) {
                    setUploadError(`Bulk upload finished with ${successfulUploads} successful and ${failedUploads} failed events. Check console for details.`);
                } else {
                    setUploadStatus(`Successfully uploaded all ${successfulUploads} events!`);
                }
                setTotalEventsToUpload(0); // Reset after completion
            },
            error: (err) => {
                setUploadError(`CSV parsing error: ${err.message}`);
                setUploadStatus('');
            }
        });
    };


    if (authLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center flex-grow p-6">
                    <p className="text-gray-600 text-lg">Loading authentication state...</p>
                </div>
            </Layout>
        );
    }

    if (!isAuthenticated) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center flex-grow p-6 text-red-600 text-lg">
                    <p className="font-semibold mb-2">You must be logged in to manually create or upload events.</p>
                    <Link to="/login" className="text-blue-700 hover:underline">Go to Login</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto flex-grow bg-gray-50 min-h-screen">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-8 text-center tracking-tight">
                    Manual Event Creator & Bulk Uploader
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Send single analytics events or upload multiple events via CSV for testing and data generation.
                </p>

                {/* Single Event Creator */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Send Single Event</h2>
                    {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

                    <form onSubmit={handleSingleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                            <select
                                id="eventType"
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                            >
                                <option value="page_view">Page View</option>
                                <option value="article_click">Article Click</option>
                                <option value="newsletter_subscribe">Newsletter Subscribe</option>
                                <option value="comment_submit">Comment Submit</option>
                                <option value="share_article">Share Article</option>
                                <option value="feature_highlight_click">Feature Highlight Click</option>
                                <option value="related_article_click">Related Article Click</option>
                                <option value="contact_form_submit">Contact Form Submit</option>
                                <option value="signup">Sign Up</option>
                                <option value="custom_event">Custom Event</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="pageName" className="block text-sm font-medium text-gray-700 mb-1">Page Name (or Title)</label>
                            <input
                                type="text"
                                id="pageName"
                                value={pageName}
                                onChange={(e) => setPageName(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                                placeholder="e.g., My Blog Home"
                            />
                        </div>

                        <div>
                            <label htmlFor="pageUrl" className="block text-sm font-medium text-gray-700 mb-1">Page URL</label>
                            <input
                                type="url"
                                id="pageUrl"
                                value={pageUrl}
                                onChange={(e) => setPageUrl(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                                placeholder="e.g., https://example.com/blog/home"
                            />
                        </div>

                        <div>
                            <label htmlFor="visitorId" className="block text-sm font-medium text-gray-700 mb-1">Visitor ID</label>
                            <input
                                type="text"
                                id="visitorId"
                                value={visitorId}
                                onChange={(e) => setVisitorId(e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
                                placeholder="e.g., visitor-abcde12345"
                            />
                        </div>

                        <div>
                            <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                            <input
                                type="datetime-local"
                                id="timestamp"
                                value={timestamp}
                                onChange={(e) => setTimestamp(e.target.value)}
                                required
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>

                        <div>
                            <label htmlFor="eventDetails" className="block text-sm font-medium text-gray-700 mb-1">Event Details (JSON)</label>
                            <textarea
                                id="eventDetails"
                                value={eventDetails}
                                onChange={(e) => setEventDetails(e.target.value)}
                                rows="5"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                placeholder='{"article_id": "123", "category": "tech"}'
                            ></textarea>
                            <p className="mt-1 text-sm text-gray-500">Must be valid JSON string. Page Name/URL/Timestamp will be merged into this automatically.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending Event...' : 'Send Single Event'}
                        </button>
                    </form>
                </div>

                {/* Bulk CSV Upload Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Bulk CSV Upload</h2>
                    <p className="text-gray-600 mb-4">
                        Upload a CSV file to send multiple events. Ensure your CSV has the header row: <code className="bg-gray-100 p-1 rounded">event_type,page_name,page_url,visitor_id,timestamp,event_details_json</code>
                    </p>
                    {uploadStatus && <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4">{uploadStatus} {totalEventsToUpload > 0 && `(${eventsSentCount}/${totalEventsToUpload})`}</div>}
                    {uploadError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{uploadError}</div>}

                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleCsvFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition duration-200"
                        />
                        <button
                            onClick={handleBulkUpload}
                            disabled={!csvFile || uploadStatus.startsWith('Uploading')}
                            className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploadStatus.startsWith('Uploading') ? 'Uploading...' : 'Upload CSV'}
                        </button>
                    </div>
                    {csvFile && !uploadStatus.startsWith('Uploading') && (
                        <p className="mt-2 text-sm text-gray-500">Selected file: {csvFile.name}</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default ManualEventCreatorPage;
