// routes/analytics.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your database connection pool
const authenticateToken = require('../middleware/authenticate_token'); // For protecting the routes

// --- POST Endpoint: Capture Analytics Events ---
// This route will receive analytics events from authenticated users
// and store them in the analytics_events table.
router.post('/collect', authenticateToken, async (req, res) => {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    const userId = req.user.id;

    if (!events || events.length === 0) {
        return res.status(400).json({ message: 'No analytics events provided.' });
    }

    try {
        const insertPromises = events.map(async (event) => {
            const { event_type, event_details, session_id, visitor_id, referrer, user_agent, ip_address } = event;

            if (!event_type || !session_id || !visitor_id) {
                console.warn('Skipping malformed event due to missing required fields:', event);
                return null;
            }

            const detailsJson = typeof event_details === 'object' ? JSON.stringify(event_details) : event_details;

            await pool.query(
                `INSERT INTO analytics_events (user_website_id, event_type, event_details, session_id, visitor_id, referrer, user_agent, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, event_type, detailsJson, session_id, visitor_id, referrer, user_agent, ip_address]
            );
            return 1;
        });

        const results = await Promise.all(insertPromises);
        const successfulInserts = results.filter(r => r !== null).length;

        res.status(200).json({
            message: `Successfully received and processed ${successfulInserts} analytics event(s).`,
            receivedCount: events.length,
            insertedCount: successfulInserts
        });

    } catch (error) {
        console.error('Error inserting analytics events:', error);
        res.status(500).json({ message: 'Server error while processing analytics data.', error: error.message });
    }
});

// --- GET Endpoint: Retrieve All Analytics Events for the Authenticated User with Pagination ---
// Fetches all analytics events associated with the user's websites.
// Example: /api/analytics/events?page=1&limit=10
router.get('/events', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 20; // Default to 20 items per page
    const offset = (page - 1) * limit; // Calculate the offset for the SQL query

    try {
        // First, get the total count of events for this user (for pagination metadata)
        const [totalEventsResult] = await pool.query(
            'SELECT COUNT(*) AS total FROM analytics_events WHERE user_website_id = ?',
            [userId]
        );
        const totalEvents = totalEventsResult[0].total;
        const totalPages = Math.ceil(totalEvents / limit);

        // Then, fetch the paginated events
        const [events] = await pool.query(
            'SELECT * FROM analytics_events WHERE user_website_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );

        if (events.length === 0 && totalEvents === 0) {
            return res.status(200).json({ message: 'No analytics events found for this user.', data: [], pagination: { totalEvents: 0, totalPages: 0, currentPage: page, limit: limit } });
        }

        const parsedEvents = events.map(event => {
            let parsedDetails = event.event_details;
            if (typeof event.event_details === 'string') {
                try {
                    parsedDetails = JSON.parse(event.event_details);
                } catch (parseError) {
                    console.error('Error parsing event_details JSON string (raw data will be passed):', parseError, 'Raw data:', event.event_details);
                }
            }
            return {
                ...event,
                event_details: parsedDetails
            };
        });

        res.status(200).json({
            message: 'Analytics events fetched successfully.',
            data: parsedEvents,
            pagination: {
                totalEvents: totalEvents,
                totalPages: totalPages,
                currentPage: page,
                limit: limit
            }
        });

    } catch (error) {
        console.error('Error fetching all analytics events with pagination:', error);
        res.status(500).json({ message: 'Server error while fetching analytics data.', error: error.message });
    }
});

// --- GET Endpoint: Retrieve Filtered Analytics Events with Pagination ---
// Allows clients to filter events by event_type, startDate, and endDate, and also paginate.
// Example: /api/analytics/events/filter?eventType=page_view&startDate=2024-01-01&page=1&limit=5
router.get('/events/filter', authenticateToken, async (req, res) => { // Corrected path to '/events/filter'
    const userId = req.user.id;
    const { eventType, startDate, endDate } = req.query; // Filtering parameters
    const page = parseInt(req.query.page) || 1; // Pagination parameter
    const limit = parseInt(req.query.limit) || 20; // Pagination parameter
    const offset = (page - 1) * limit; // Calculate offset

    let countQuery = 'SELECT COUNT(*) AS total FROM analytics_events WHERE user_website_id = ?';
    let dataQuery = 'SELECT * FROM analytics_events WHERE user_website_id = ?';
    const params = [userId]; // Parameters for data retrieval
    const countParams = [userId]; // Parameters for count query (initially same as data params)

    // Dynamically add conditions to the SQL queries based on provided filters.
    if (eventType) {
        dataQuery += ' AND event_type = ?';
        countQuery += ' AND event_type = ?'; // Add to count query too!
        params.push(eventType);
        countParams.push(eventType);
    }

    if (startDate) {
        dataQuery += ' AND timestamp >= ?';
        countQuery += ' AND timestamp >= ?'; // Add to count query too!
        params.push(startDate);
        countParams.push(startDate);
    }

    if (endDate) {
        dataQuery += ' AND timestamp <= ?';
        countQuery += ' AND timestamp <= ?'; // Add to count query too!
        params.push(endDate);
        countParams.push(endDate);
    }

    dataQuery += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?'; // Add pagination to data query
    params.push(limit, offset); // Add limit and offset to data query parameters

    try {
        // First, get the total count of filtered events
        const [totalEventsResult] = await pool.query(countQuery, countParams);
        const totalEvents = totalEventsResult[0].total;
        const totalPages = Math.ceil(totalEvents / limit);

        // Then, fetch the paginated and filtered events
        const [events] = await pool.query(dataQuery, params);

        if (events.length === 0 && totalEvents === 0) {
            return res.status(200).json({ message: 'No matching analytics events found.', data: [], pagination: { totalEvents: 0, totalPages: 0, currentPage: page, limit: limit } });
        }

        const parsedEvents = events.map(event => {
            let parsedDetails = event.event_details;
            if (typeof event.event_details === 'string') {
                try {
                    parsedDetails = JSON.parse(event.event_details);
                } catch (parseError) {
                    console.error('Error parsing event_details JSON string (raw data will be passed):', parseError, 'Raw data:', event.event_details);
                }
            }
            return {
                ...event,
                event_details: parsedDetails
            };
        });

        res.status(200).json({
            message: 'Filtered analytics events fetched successfully.',
            data: parsedEvents,
            pagination: {
                totalEvents: totalEvents,
                totalPages: totalPages,
                currentPage: page,
                limit: limit
            }
        });

    } catch (error) {
        console.error('Error fetching filtered analytics events with pagination:', error);
        res.status(500).json({ message: 'Server error while fetching filtered analytics data.', error: error.message });
    }
});
router.get('/summary/page-views', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = `
        SELECT COUNT(*) AS total_page_views
        FROM analytics_events
        WHERE user_website_id = ? AND event_type = 'page_view'
    `;
    const params = [userId];

    if (startDate) {
        query += ' AND timestamp >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND timestamp <= ?';
        params.push(endDate);
    }

    try {
        const [results] = await pool.query(query, params);

        // results[0].total_page_views will be a string or number representing the count
        const totalPageViews = results[0] ? results[0].total_page_views : 0;

        res.status(200).json({
            message: 'Total page views fetched successfully.',
            data: { total_page_views: totalPageViews }
        });

    } catch (error) {
        console.error('Error fetching total page views:', error);
        // Pass error to centralized error handler
        res.status(500).json({ message: 'Server error while fetching total page views.', error: error.message });
    }
});
router.get('/summary/popular-pages', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate, limit = 10 } = req.query; // Default limit to 10

    let query = `
        SELECT JSON_UNQUOTE(JSON_EXTRACT(event_details, '$.url')) AS page_url,
               COUNT(*) AS page_views_count
        FROM analytics_events
        WHERE user_website_id = ? AND event_type = 'page_view'
    `;
    const params = [userId];

    if (startDate) {
        query += ' AND timestamp >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND timestamp <= ?';
        params.push(endDate);
    }

    query += `
        GROUP BY page_url
        ORDER BY page_views_count DESC
        LIMIT ?
    `;
    params.push(parseInt(limit)); // Ensure limit is an integer

    try {
        const [results] = await pool.query(query, params);

        if (results.length === 0) {
            return res.status(200).json({ message: 'No popular pages data found for the given criteria.', data: [] });
        }

        res.status(200).json({
            message: 'Most popular pages fetched successfully.',
            data: results
        });

    } catch (error) {
        console.error('Error fetching most popular pages:', error);
        // Pass error to centralized error handler
        res.status(500).json({ message: 'Server error while fetching popular pages.', error: error.message });
    }
});
router.get('/summary/unique-visitors', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = `
        SELECT COUNT(DISTINCT visitor_id) AS unique_visitors_count
        FROM analytics_events
        WHERE user_website_id = ?
    `;
    const params = [userId];

    if (startDate) {
        query += ' AND timestamp >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND timestamp <= ?';
        params.push(endDate);
    }

    try {
        const [results] = await pool.query(query, params);

        const uniqueVisitorsCount = results[0] ? results[0].unique_visitors_count : 0;

        res.status(200).json({
            message: 'Unique visitors count fetched successfully.',
            data: { unique_visitors_count: uniqueVisitorsCount }
        });

    } catch (error) {
        console.error('Error fetching unique visitors count:', error);
        res.status(500).json({ message: 'Server error while fetching unique visitors count.', error: error.message });
    }
});
router.get('/summary/conversion-funnel', authenticateToken, async (req, res) => {
    const userId = req.user.id.toString(); // Ensure userId is string for consistency if needed
    const { startDate, endDate } = req.query;

    let params = [userId];
    let dateFilter = '';
    if (startDate) {
        dateFilter += ' AND timestamp >= ?';
        params.push(startDate);
    }
    if (endDate) {
        dateFilter += ' AND timestamp <= ?';
        params.push(endDate);
    }

    try {
        // Step 1: Count unique visitors who added to cart
        const [addToCartResults] = await pool.query(
            `SELECT COUNT(DISTINCT visitor_id) AS add_to_cart_count
             FROM analytics_events
             WHERE user_website_id = ? AND event_type = 'add_to_cart'${dateFilter}`,
            params
        );
        const addToCartCount = addToCartResults[0] ? addToCartResults[0].add_to_cart_count : 0;

        // Step 2: Count unique visitors who started checkout AND previously added to cart
        // This query finds visitors who have both 'add_to_cart' and 'checkout_start' events
        // within the specified user_website_id and date range.
        const [checkoutStartResults] = await pool.query(
            `SELECT COUNT(DISTINCT a1.visitor_id) AS checkout_start_count
             FROM analytics_events a1
             WHERE a1.user_website_id = ? AND a1.event_type = 'checkout_start'${dateFilter}
             AND EXISTS (
                 SELECT 1
                 FROM analytics_events a2
                 WHERE a2.user_website_id = ? AND a2.visitor_id = a1.visitor_id AND a2.event_type = 'add_to_cart'${dateFilter}
                 -- Optional: add a condition to ensure add_to_cart happened before checkout_start
                 -- AND a2.timestamp <= a1.timestamp
             )`,
            [userId, ...params] // Pass userId again for the subquery
        );
        const checkoutStartCount = checkoutStartResults[0] ? checkoutStartResults[0].checkout_start_count : 0;

        // Calculate conversion rate
        const conversionRate = addToCartCount > 0
            ? (checkoutStartCount / addToCartCount) * 100
            : 0;

        res.status(200).json({
            message: 'Conversion funnel data fetched successfully.',
            data: {
                step1_add_to_cart: addToCartCount,
                step2_checkout_start: checkoutStartCount,
                conversion_rate_percent: parseFloat(conversionRate.toFixed(2)) // Format to 2 decimal places
            }
        });

    } catch (error) {
        console.error('Error fetching conversion funnel:', error);
        res.status(500).json({ message: 'Server error while fetching conversion funnel.', error: error.message });
    }
});
module.exports = router;