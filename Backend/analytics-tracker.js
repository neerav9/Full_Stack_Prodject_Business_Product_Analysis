// analytics-tracker.js
(function() {
    const ANALYTICS_API_URL = 'http://localhost:5000/api/analytics/collect'; // !!! IMPORTANT: CHANGE THIS TO YOUR ACTUAL BACKEND URL IN PRODUCTION !!!

    // --- Helper Functions ---

    // Generates a simple unique ID (for session and visitor)
    function generateUniqueId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Gets or sets a cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${d.toUTCString()}`;
        document.cookie = `<span class="math-inline">\{name\}\=</span>{value}; ${expires}; path=/; SameSite=Lax`;
    }

    // --- Core Tracking Logic ---

    let visitorId = getCookie('_my_analytics_visitor_id');
    if (!visitorId) {
        visitorId = generateUniqueId();
        setCookie('_my_analytics_visitor_id', visitorId, 365); // Persist for 1 year
    }

    let sessionId = getCookie('_my_analytics_session_id');
    // If no session ID or session is old (e.g., 30 mins), create a new one
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    let lastActivity = parseInt(getCookie('_my_analytics_last_activity') || '0');

    if (!sessionId || (Date.now() - lastActivity > SESSION_TIMEOUT_MS)) {
        sessionId = generateUniqueId();
        setCookie('_my_analytics_session_id', sessionId, 0); // Session cookie (expires on browser close)
    }
    setCookie('_my_analytics_last_activity', Date.now().toString(), 0); // Update last activity for session timeout

    // Function to send events to your backend
    async function sendEvent(eventType, eventDetails = {}) {
        const eventData = {
            event_type: eventType,
            event_details: eventDetails,
            session_id: sessionId,
            visitor_id: visitorId,
            referrer: document.referrer || '',
            user_agent: navigator.userAgent,
            // We DON'T send IP address from client for privacy/complexity.
            // The server can capture it from req.ip if configured.
        };

        try {
            // IMPORTANT: The client-side tracking script DOES NOT include the JWT here.
            // The website owner (our platform user) will need to configure their server-side
            // setup (e.g., a proxy, or an API call from their server) to include THEIR
            // authentication token when sending data to ANALYTICS_API_URL.
            // For direct testing, you might manually add an Authorization header if you're
            // simulating a logged-in user in your browser's dev tools for testing purposes.
            // In a real-world scenario, the data would ideally be sent from the client's
            // *backend* to ours, or a secured client-side proxy.
            const response = await fetch(ANALYTICS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // In a real integration, the client's own backend might forward this,
                    // including their platform JWT. For direct browser-to-our-backend,
                    // this `authenticateToken` middleware will require the owner's JWT.
                    // For *testing from a simple HTML file*, you'd temporarily remove
                    // `authenticateToken` from the `/collect` route or manually add a token.
                    // We will discuss proper integration later.
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                console.error('Failed to send analytics event:', response.status, response.statusText);
            } else {
                // console.log('Analytics event sent:', eventType);
            }
        } catch (error) {
            console.error('Error sending analytics event:', error);
        }
    }

    // --- Event Listeners ---

    // Track page views
    window.addEventListener('load', () => {
        sendEvent('page_view', {
            url: window.location.href,
            title: document.title,
        });
    });

    // Track clicks (example - you'd add more specific selectors for production)
    document.addEventListener('click', (event) => {
        // Example: Track clicks on specific elements like buttons or links
        const target = event.target;
        if (target.tagName === 'BUTTON' || target.tagName === 'A') {
            sendEvent('click', {
                element_tag: target.tagName,
                element_id: target.id || '',
                element_class: target.className || '',
                element_text: target.innerText.substring(0, 100), // Limit text length
                url: target.href || ''
            });
        }
    });

    // Expose a global function for custom events (optional)
    window.myAnalytics = {
        trackCustomEvent: (eventName, details) => {
            sendEvent(eventName, details);
        }
    };

    console.log('My Analytics Tracker initialized!');

})();