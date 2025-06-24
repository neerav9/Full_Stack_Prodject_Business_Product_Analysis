import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// --- Helper to get/set Visitor ID ---
const getVisitorId = () => {
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = 'visitor-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitorId', visitorId);
    }
    return visitorId;
};

// --- Helper to get/set Session ID ---
const getSessionId = () => {
    // Session ID lives in sessionStorage, cleared when tab/browser closes
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
};

// --- Main Analytics Tracking Function ---
export const trackEvent = async (eventType, eventDetails = {}) => {
    try {
        // Retrieve JWT from localStorage for authentication
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('Analytics: No JWT token found. Event will not be sent to authenticated endpoint.');
            // Optionally, handle anonymous tracking here if your backend /collect
            // endpoint was designed to accept unauthenticated requests (it's not currently)
            return;
        }

        // Get IDs
        const visitorId = getVisitorId();
        const sessionId = getSessionId();

        // Get browser/device info (User Agent)
        const userAgent = navigator.userAgent;

        // Get referrer
        const referrer = document.referrer;

        // Note: IP Address will be captured by your backend based on the incoming request

        const eventData = {
            // user_website_id is derived from the JWT on the backend
            event_type: eventType,
            event_details: eventDetails, // This will be JSON in the DB
            session_id: sessionId,
            visitor_id: visitorId,
            user_agent: userAgent,
            referrer: referrer,
            // timestamp is automatically added by the database
        };

        // Send the event to your backend
        await axios.post(`${API_URL}/analytics/collect`, eventData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log(`Analytics event '${eventType}' tracked successfully.`, eventData);

    } catch (error) {
        console.error('Error tracking analytics event:', error.response ? error.response.data : error.message);
    }
};