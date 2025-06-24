// routes/analytics.js
const express = require('express');
const router = express.Router();
// Assuming your pool and authenticateToken are imported correctly
// Adjust paths as necessary for your project structure
const pool = require('../db'); // Your database connection pool
const authenticateToken = require('../middleware/authenticate_token'); // For protecting the routes

// --- Helper function for date adjustment ---
// This function converts 'YYYY-MM-DD' strings from the frontend date picker
// to UTC timestamps suitable for querying a database that stores UTC.
const adjustDateForQuery = (dateString, type = 'start') => {
    if (!dateString) return null;

    try {
        // Create a Date object from the dateString.
        // It's important to understand how 'new Date(dateString)' behaves:
        // - 'YYYY-MM-DD' without time part usually parses in local time.
        // - 'YYYY-MM-DDTHH:MM:SSZ' (with Z) parses as UTC.
        // To ensure we get the *start* or *end* of the *UTC day* corresponding to the local date picker input,
        // we first parse the date string as a local date (which new Date('YYYY-MM-DD') does).
        // Then we explicitly construct a UTC date using the year, month, day components of that local date,
        // and set the time components to 00:00:00 UTC or 23:59:59 UTC.
        const localDate = new Date(dateString); // Parses 'YYYY-MM-DD' as local time, e.g., 2025-06-23 00:00:00 (local)

        if (isNaN(localDate.getTime())) {
            console.warn(`Backend: adjustDateForQuery received an invalid date string: "${dateString}". Returning null.`);
            return null;
        }

        let utcDate;
        if (type === 'start') {
            // For start of day, we want YYYY-MM-DD 00:00:00 UTC
            utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0));
        } else { // type === 'end'
            // For end of day, we want YYYY-MM-DD 23:59:59 UTC
            utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 23, 59, 59, 999));
        }

        // Format for MySQL DATETIME/TIMESTAMP: 'YYYY-MM-DD HH:MM:SS'
        // Given your database timestamps like "2025-06-23T08:35:16.000Z", they are UTC.
        // So, we need to compare against UTC times.
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = utcDate.getUTCDate().toString().padStart(2, '0');
        const hours = utcDate.getUTCHours().toString().padStart(2, '0');
        const minutes = utcDate.getUTCMinutes().toString().padStart(2, '0');
        const seconds = utcDate.getUTCSeconds().toString().padStart(2, '0');

        // This format 'YYYY-MM-DD HH:MM:SS' is standard for MySQL DATETIME/TIMESTAMP comparison
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    } catch (e) {
        console.error(`Backend: Error in adjustDateForQuery for "${dateString}":`, e);
        return null;
    }
};

// --- POST Endpoint: Capture Analytics Events ---
// This route will receive analytics events from dummy websites.
// It does NOT require authenticateToken because the dummy websites are external clients
// and send their user_website_id directly in the payload.
router.post('/collect', async (req, res) => {
    // Ensure req.body is an array, or convert a single object to an array for consistent processing
    const events = Array.isArray(req.body) ? req.body : [req.body];
    console.log('Backend /collect: Received events payload:', events);

    if (!events || events.length === 0) {
        return res.status(400).json({ message: 'No analytics events provided.' });
    }

    try {
        const insertPromises = events.map(async (event) => {
            const { user_website_id, event_type, event_details, session_id, visitor_id, referrer, user_agent } = event;

            if (!user_website_id || !event_type || !session_id || !visitor_id) {
                console.warn('Backend /collect: Skipping malformed event due to missing required fields (user_website_id, event_type, session_id, or visitor_id):', event);
                return null;
            }

            const detailsJson = typeof event_details === 'object' ? JSON.stringify(event_details) : event_details;

            await pool.query(
                `INSERT INTO analytics_events (user_website_id, event_type, event_details, session_id, visitor_id, referrer, user_agent, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_website_id, event_type, detailsJson, session_id, visitor_id, referrer, user_agent, req.ip]
            );
            console.log(`Backend /collect: Successfully inserted event type '${event_type}' for user_website_id '${user_website_id}'.`);
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
        console.error('Backend /collect: Error inserting analytics events:', error);
        res.status(500).json({ message: 'Server error while processing analytics data.', error: error.message });
    }
});


// --- GET Endpoint: Retrieve All Analytics Events for the Authenticated User with Pagination ---
router.get('/events', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { startDate, endDate } = req.query;
    console.log(`Backend /events: Received startDate: "${startDate}", endDate: "${endDate}"`);

    console.log(`Backend /events: Attempting to fetch events for user ID: ${userId}, page: ${page}, limit: ${limit}`);

    try {
        let countQuery = `SELECT COUNT(*) AS total FROM analytics_events WHERE user_website_id = ?`;
        let dataQuery = `SELECT * FROM analytics_events WHERE user_website_id = ?`;
        const queryParams = [userId];
        const countParams = [userId];

        const adjustedStartDate = adjustDateForQuery(startDate, 'start');
        if (adjustedStartDate) {
            dataQuery += ` AND timestamp >= ?`;
            countQuery += ` AND timestamp >= ?`;
            queryParams.push(adjustedStartDate);
            countParams.push(adjustedStartDate);
        }
        const adjustedEndDate = adjustDateForQuery(endDate, 'end');
        if (adjustedEndDate) {
            dataQuery += ` AND timestamp <= ?`;
            countQuery += ` AND timestamp <= ?`;
            queryParams.push(adjustedEndDate);
            countParams.push(adjustedEndDate);
        }

        const [totalEventsResult] = await pool.query(countQuery, countParams);
        const totalEvents = totalEventsResult[0].total;
        const totalPages = Math.ceil(totalEvents / limit);
        console.log(`Backend /events: Total events found for user ${userId} with filters: ${totalEvents}`);

        dataQuery += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        console.log(`Backend /events DEBUG: Final SQL Data Query:`);
        console.log(dataQuery);
        console.log(`Backend /events DEBUG: Query Parameters for data:`, queryParams);

        const [rows] = await pool.query(dataQuery, queryParams);
        const events = Array.isArray(rows) ? rows : Array.from(rows);

        console.log(`Backend /events: Fetched ${events.length} events for user ${userId} (page ${page}).`);
        console.log("Backend /events DEBUG: Content of 'events' directly from DB (after conversion):", events.length > 0 ? events[0] : 'No events');
        console.log("Backend /events DEBUG: Type of 'events' directly from DB (after conversion):", typeof events, Array.isArray(events));

        const parsedEvents = events.map(event => {
            let parsedDetails = event.event_details;
            if (typeof event.event_details === 'string') {
                try {
                    parsedDetails = JSON.parse(event.event_details);
                } catch (parseError) {
                    console.error('Backend /events: Error parsing event_details JSON string (raw data will be passed):', parseError, 'Raw data:', event.event_details);
                }
            }
            return {
                ...event,
                event_details: parsedDetails
            };
        });

        console.log("Backend /events DEBUG: Content of 'parsedEvents' before sending:", parsedEvents.length > 0 ? parsedEvents[0] : 'No parsed events');
        console.log("Backend /events DEBUG: Length of 'parsedEvents' before sending:", parsedEvents.length);


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
        console.error('Backend /events: Error fetching all analytics events with pagination:', error);
        res.status(500).json({ message: 'Server error while fetching analytics data.', error: error.message });
    }
});


// --- GET Endpoint: Popular Pages Summary ---
router.get('/summary/popular-pages', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate, limit = 10 } = req.query;

    console.log(`Backend /summary/popular-pages: Received startDate: "${startDate}", endDate: "${endDate}"`);

    console.log(`Backend /summary/popular-pages: Attempting to fetch popular pages for user ID: ${userId}`);

    let query = `
        SELECT JSON_UNQUOTE(JSON_EXTRACT(event_details, '$.url')) AS page_url,
               JSON_UNQUOTE(JSON_EXTRACT(event_details, '$.page_name')) AS page_name,
               COUNT(*) AS view_count
        FROM analytics_events
        WHERE user_website_id = ? AND event_type = 'page_view'
    `;
    const params = [userId];

    const adjustedStartDate = adjustDateForQuery(startDate, 'start');
    if (adjustedStartDate) {
        query += ` AND timestamp >= ?`;
        params.push(adjustedStartDate);
    }
    const adjustedEndDate = adjustDateForQuery(endDate, 'end');
    if (adjustedEndDate) {
        query += ` AND timestamp <= ?`;
        params.push(adjustedEndDate);
    }

    query += `
        GROUP BY page_url, page_name
        ORDER BY view_count DESC
        LIMIT ?
    `;
    params.push(parseInt(limit));

    console.log(`Backend /popular-pages DEBUG: Final SQL Query:`);
    console.log(query);
    console.log(`Backend /popular-pages DEBUG: Query Parameters:`, params);

    try {
        const [rows] = await pool.query(query, params);
        const results = Array.isArray(rows) ? rows : Array.from(rows);

        console.log(`Backend /summary/popular-pages: Fetched ${results.length} popular pages for user ${userId}.`);
        console.log("Backend /popular-pages DEBUG: Content of 'results' directly from DB (after conversion):", results);
        console.log("Backend /popular-pages DEBUG: Length of 'results' directly from DB (after conversion):", results.length);

        res.status(200).json({
            message: 'Most popular pages fetched successfully.',
            data: results
        });

    } catch (error) {
        console.error('Backend /summary/popular-pages: Error fetching most popular pages:', error);
        res.status(500).json({ message: 'Server error while fetching popular pages.', error: error.message });
    }
});


// --- NEW GET Endpoint: Events Count by Date ---
router.get('/summary/events-by-date', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, eventType } = req.query; // eventType is optional

        console.log(`Backend /summary/events-by-date: Received startDate: "${startDate}", endDate: "${endDate}", eventType: "${eventType}"`);

        let query = `
            SELECT
                DATE(timestamp) AS event_date,
                COUNT(*) AS event_count
            FROM
                analytics_events ae
            WHERE
                ae.user_website_id = ?
        `; // Simplified WHERE clause - user_website_id directly corresponds to user.id in this context
        const queryParams = [userId];

        // Add date filtering
        const adjustedStartDate = adjustDateForQuery(startDate, 'start');
        if (adjustedStartDate) {
            query += ` AND ae.timestamp >= ?`;
            queryParams.push(adjustedStartDate);
        }
        const adjustedEndDate = adjustDateForQuery(endDate, 'end');
        if (adjustedEndDate) {
            query += ` AND ae.timestamp <= ?`;
            queryParams.push(adjustedEndDate);
        }

        // Optional: Filter by event type
        if (eventType) {
            query += ` AND ae.event_type = ?`;
            queryParams.push(eventType);
        }

        query += `
            GROUP BY
                event_date
            ORDER BY
                event_date ASC;
        `;

        console.log(`Backend /summary/events-by-date DEBUG: Final SQL Query:`);
        console.log(query);
        console.log(`Backend /summary/events-by-date DEBUG: Query Parameters:`, queryParams);

        const [rows] = await pool.query(query, queryParams);
        const eventsByDate = Array.isArray(rows) ? rows : Array.from(rows);

        console.log(`Backend /summary/events-by-date DEBUG: Fetched ${eventsByDate.length} date entries.`);
        console.log(`Backend /summary/events-by-date DEBUG: Content:`, eventsByDate);

        res.status(200).json({
            message: 'Events by date fetched successfully.',
            data: eventsByDate
        });

    } catch (error) {
        console.error('Backend /summary/events-by-date: Error fetching events by date:', error);
        res.status(500).json({ message: 'Server error while fetching events by date.', error: error.message });
    }
});

// --- GET Endpoint: Retrieve Filtered Analytics Events with Pagination ---
router.get('/events/filter', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { eventType, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`Backend /events/filter: Fetching filtered events for user ID: ${userId}`);

    let countQuery = 'SELECT COUNT(*) AS total FROM analytics_events WHERE user_website_id = ?';
    let dataQuery = 'SELECT * FROM analytics_events WHERE user_website_id = ?';
    const params = [userId];
    const countParams = [userId];

    if (eventType) {
        dataQuery += ' AND event_type = ?';
        countQuery += ' AND event_type = ?';
        params.push(eventType);
        countParams.push(eventType);
    }

    if (startDate) {
        dataQuery += ' AND timestamp >= ?';
        countQuery += ' AND timestamp >= ?';
        params.push(startDate);
        countParams.push(startDate);
    }

    if (endDate) {
        dataQuery += ' AND timestamp <= ?';
        countQuery += ' AND timestamp <= ?';
        params.push(endDate);
        countParams.push(endDate);
    }

    dataQuery += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
        const [totalEventsResult] = await pool.query(countQuery, countParams);
        const totalEvents = totalEventsResult[0].total;
        const totalPages = Math.ceil(totalEvents / limit);

        const [events] = await pool.query(dataQuery, params);

        const parsedEvents = events.map(event => {
            let parsedDetails = event.event_details;
            if (typeof event.event_details === 'string') {
                try {
                    parsedDetails = JSON.parse(event.event_details);
                } catch (parseError) {
                    console.error('Backend /events/filter: Error parsing event_details JSON string (raw data will be passed):', parseError, 'Raw data:', event.event_details);
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
        console.error('Backend /events/filter: Error fetching filtered analytics events with pagination:', error);
        res.status(500).json({ message: 'Server error while fetching filtered analytics data.', error: error.message });
    }
});


// --- GET Endpoint: Total Page Views Summary ---
router.get('/summary/page-views', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    console.log(`Backend /summary/page-views: Fetching total page views for user ID: ${userId}`);

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

        const totalPageViews = results[0] ? results[0].total_page_views : 0;
        console.log(`Backend /summary/page-views: Total page views for user ${userId}: ${totalPageViews}`);

        res.status(200).json({
            message: 'Total page views fetched successfully.',
            data: { total_page_views: totalPageViews }
        });

    } catch (error) {
        console.error('Backend /summary/page-views: Error fetching total page views:', error);
        res.status(500).json({ message: 'Server error while fetching total page views.', error: error.message });
    }
});

router.get('/summary/event-types-breakdown', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query; // Date filters are still relevant

        console.log(`Backend /summary/event-types-breakdown: Received startDate: "${startDate}", endDate: "${endDate}"`);

        let query = `
            SELECT
                event_type,
                COUNT(*) AS event_count
            FROM
                analytics_events ae
            WHERE
                ae.user_website_id = ?
        `;
        const queryParams = [userId];

        // Add date filtering
        const adjustedStartDate = adjustDateForQuery(startDate, 'start');
        if (adjustedStartDate) {
            query += ` AND ae.timestamp >= ?`;
            queryParams.push(adjustedStartDate);
        }
        const adjustedEndDate = adjustDateForQuery(endDate, 'end');
        if (adjustedEndDate) {
            query += ` AND ae.timestamp <= ?`;
            queryParams.push(adjustedEndDate);
        }

        query += `
            GROUP BY
                event_type
            ORDER BY
                event_count DESC;
        `;

        console.log(`Backend /summary/event-types-breakdown DEBUG: Final SQL Query:`);
        console.log(query);
        console.log(`Backend /summary/event-types-breakdown DEBUG: Query Parameters:`, queryParams);

        const [rows] = await pool.query(query, queryParams);
        const eventTypeBreakdown = Array.isArray(rows) ? rows : Array.from(rows);

        console.log(`Backend /summary/event-types-breakdown DEBUG: Fetched ${eventTypeBreakdown.length} event types.`);
        console.log(`Backend /summary/event-types-breakdown DEBUG: Content:`, eventTypeBreakdown);

        res.status(200).json({
            message: 'Event type breakdown fetched successfully.',
            data: eventTypeBreakdown
        });

    } catch (error) {
        console.error('Backend /summary/event-types-breakdown: Error fetching event types breakdown:', error);
        res.status(500).json({ message: 'Server error while fetching event types breakdown.', error: error.message });
    }
});

// --- GET Endpoint: Unique Visitors Summary ---
router.get('/summary/unique-visitors', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    console.log(`Backend /summary/unique-visitors: Fetching unique visitors for user ID: ${userId}`);

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
        console.log(`Backend /summary/unique-visitors: Unique visitors for user ${userId}: ${uniqueVisitorsCount}`);

        res.status(200).json({
            message: 'Unique visitors count fetched successfully.',
            data: { unique_visitors_count: uniqueVisitorsCount }
        });

    } catch (error) {
        console.error('Backend /summary/unique-visitors: Error fetching unique visitors count:', error);
        res.status(500).json({ message: 'Server error while fetching unique visitors count.', error: error.message });
    }
});

// --- GET Endpoint: Conversion Funnel Summary ---
router.get('/summary/conversion-funnel', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    console.log(`Backend /summary/conversion-funnel: Fetching conversion funnel for user ID: ${userId}`);

    let baseQueryParams = [userId];
    let dateFilterClause = '';

    // Adjust dates for conversion funnel if they are also to be filtered by date range
    const adjustedStartDate = adjustDateForQuery(startDate, 'start');
    if (adjustedStartDate) {
        dateFilterClause += ' AND timestamp >= ?';
        baseQueryParams.push(adjustedStartDate);
    }
    const adjustedEndDate = adjustDateForQuery(endDate, 'end');
    if (adjustedEndDate) {
        dateFilterClause += ' AND timestamp <= ?';
        baseQueryParams.push(adjustedEndDate);
    }

    try {
        // Step 1: Count unique visitors who added to cart
        const [addToCartResults] = await pool.query(
            `SELECT COUNT(DISTINCT visitor_id) AS add_to_cart_count
             FROM analytics_events
             WHERE user_website_id = ? AND event_type = 'add_to_cart'${dateFilterClause}`,
            baseQueryParams
        );
        const addToCartCount = addToCartResults[0] ? addToCartResults[0].add_to_cart_count : 0;
        console.log(`Backend /summary/conversion-funnel: Add to Cart Count: ${addToCartCount}`);

        // Step 2: Count unique visitors who started checkout AND previously added to cart
        // The subquery also needs to respect the dateFilterClause and additional user_website_id param
        const [checkoutStartResults] = await pool.query(
            `SELECT COUNT(DISTINCT ae_checkout.visitor_id) AS checkout_start_count
             FROM analytics_events ae_checkout
             WHERE ae_checkout.user_website_id = ?
               AND ae_checkout.event_type = 'checkout_start'${dateFilterClause}
               AND EXISTS (
                   SELECT 1
                   FROM analytics_events ae_add_to_cart
                   WHERE ae_add_to_cart.user_website_id = ?
                     AND ae_add_to_cart.visitor_id = ae_checkout.visitor_id
                     AND ae_add_to_cart.event_type = 'add_to_cart'${dateFilterClause}
                     AND ae_add_to_cart.timestamp <= ae_checkout.timestamp
               )`,
            // Pass parameters for both main query and subquery (userId, adjusted dates, userId, adjusted dates)
            [...baseQueryParams, ...baseQueryParams]
        );
        const checkoutStartCount = checkoutStartResults[0] ? checkoutStartResults[0].checkout_start_count : 0;
        console.log(`Backend /summary/conversion-funnel: Checkout Start Count: ${checkoutStartCount}`);


        const conversionRate = addToCartCount > 0
            ? (checkoutStartCount / addToCartCount) * 100
            : 0;

        res.status(200).json({
            message: 'Conversion funnel data fetched successfully.',
            data: {
                step1_add_to_cart: addToCartCount,
                step2_checkout_start: checkoutStartCount,
                conversion_rate_percent: parseFloat(conversionRate.toFixed(2))
            }
        });

    } catch (error) {
        console.error('Backend /summary/conversion-funnel: Error fetching conversion funnel:', error);
        res.status(500).json({ message: 'Server error while fetching conversion funnel.', error: error.message });
    }
});

module.exports = router;