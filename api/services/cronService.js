const cron = require('node-cron');
const db = require('../config/database');
const { sendAbandonedCartEmail } = require('./emailService');

/**
 * 1. Abandoned Cart Recovery check
 * Finds users with inactive cart items for > 24 hours and sends recovery emails.
 */
const runAbandonedCartRecovery = async () => {
    console.log('[Cron] Running Abandoned Cart Recovery check...');
    try {
        // Find users who have items in their cart that haven't been updated for > 24 hours
        // and haven't received an abandoned cart email yet.
        const [rows] = await db.query(`
            SELECT c.user_id, u.email, u.first_name, MAX(c.updated_at) as last_updated
            FROM cart_items c
            JOIN users u ON c.user_id = u.id
            WHERE c.abandoned_email_sent = 0
            GROUP BY c.user_id, u.email, u.first_name
            HAVING MAX(c.updated_at) < NOW() - INTERVAL 1 DAY
        `);

        if (rows.length === 0) {
            console.log('[Cron] No abandoned carts found.');
            return { success: true, sentCount: 0, message: 'No abandoned carts found' };
        }

        let sentCount = 0;
        for (const user of rows) {
            // Fetch cart items for this user
            const [cartItems] = await db.query(`
                SELECT c.quantity, p.name as product_name, p.price
                FROM cart_items c
                JOIN products p ON c.product_id = p.id
                WHERE c.user_id = ? AND c.abandoned_email_sent = 0
            `, [user.user_id]);

            if (cartItems.length > 0) {
                await sendAbandonedCartEmail(user.email, user.first_name || 'ลูกค้า', cartItems);

                // Mark as sent
                await db.query(`
                    UPDATE cart_items 
                    SET abandoned_email_sent = 1 
                    WHERE user_id = ? AND abandoned_email_sent = 0
                `, [user.user_id]);
                
                console.log(`[Cron] Marked abandoned cart emails sent for user: ${user.user_id}`);
                sentCount++;
            }
        }
        return { success: true, sentCount, message: `Processed recovery emails for ${sentCount} user(s)` };
    } catch (error) {
        console.error('[Cron] Error running Abandoned Cart check:', error.message);
        throw error;
    }
};

/**
 * 2. Co-purchase Aggregation
 * Aggregates order pairs into product_co_purchases for smart recommendations.
 */
const runCoPurchaseAggregation = async () => {
    console.log('[Cron] Running Co-purchase Aggregation...');
    try {
        // Find all product pairs that appear in the same orders
        const [pairs] = await db.query(`
            SELECT oi1.product_id AS product_a, oi2.product_id AS product_b, COUNT(*) AS pair_count
            FROM order_items oi1
            JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
            GROUP BY oi1.product_id, oi2.product_id
            HAVING pair_count >= 1
        `);

        if (pairs.length === 0) {
            console.log('[Cron] No co-purchase pairs found.');
            return { success: true, updatedCount: 0, message: 'No co-purchase pairs found' };
        }

        // Upsert both directions (A->B and B->A)
        let upsertCount = 0;
        for (const pair of pairs) {
            await db.query(
                `INSERT INTO product_co_purchases (product_id, co_product_id, co_count)
                 VALUES (?, ?, ?), (?, ?, ?)
                 ON DUPLICATE KEY UPDATE co_count = VALUES(co_count), updated_at = NOW()`,
                [pair.product_a, pair.product_b, pair.pair_count,
                 pair.product_b, pair.product_a, pair.pair_count]
            );
            upsertCount++;
        }

        console.log(`[Cron] ✅ Co-purchase aggregation complete: ${upsertCount} pairs updated.`);
        return { success: true, updatedCount: upsertCount, message: `Co-purchase aggregation complete: ${upsertCount} pairs updated.` };
    } catch (error) {
        console.error('[Cron] Error running Co-purchase Aggregation:', error.message);
        throw error;
    }
};

/**
 * 3. Product View Count Refresh
 * Updates products.view_count from customer_behavior event logs of the last 90 days.
 */
const runProductViewCountRefresh = async () => {
    console.log('[Cron] Running Product View Count Refresh...');
    try {
        await db.query(`
            UPDATE products p
            LEFT JOIN (
                SELECT JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.productId')) AS pid, COUNT(*) AS cnt
                FROM customer_behavior
                WHERE event_type = 'view_product'
                  AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
                GROUP BY pid
            ) v ON p.id = v.pid
            SET p.view_count = COALESCE(v.cnt, 0)
        `);
        console.log('[Cron] ✅ Product view counts refreshed.');
        return { success: true, message: 'Product view counts refreshed successfully' };
    } catch (error) {
        console.error('[Cron] Error refreshing view counts:', error.message);
        throw error;
    }
};

/**
 * Scheduler entry point
 */
const startCronJobs = () => {
    // Run every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        try {
            await runAbandonedCartRecovery();
        } catch (e) {}
    });

    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        try {
            await runCoPurchaseAggregation();
        } catch (e) {}
    });

    // Run daily at 03:00 AM
    cron.schedule('0 3 * * *', async () => {
        try {
            await runProductViewCountRefresh();
        } catch (e) {}
    });

    console.log('[Cron] Jobs scheduled successfully.');
};

module.exports = {
    startCronJobs,
    runAbandonedCartRecovery,
    runCoPurchaseAggregation,
    runProductViewCountRefresh
};
