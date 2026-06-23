const db = require('../config/database');

/**
 * LINE Messaging API Service
 * Handles all communication with LINE Platform
 */

const LINE_API_BASE = 'https://api.line.me/v2/bot';

/**
 * Get LINE credentials from DB
 */
async function getLineCredentials() {
    const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'line_credentials'");
    if (rows.length === 0 || !rows[0].setting_value) return null;
    try {
        const creds = JSON.parse(rows[0].setting_value);
        if (!creds.channel_access_token) return null;
        return creds;
    } catch (e) {
        return null;
    }
}

/**
 * Make authenticated request to LINE API
 */
async function lineApiRequest(endpoint, method = 'GET', body = null) {
    const creds = await getLineCredentials();
    if (!creds) throw new Error('LINE credentials not configured');

    const url = endpoint.startsWith('http') ? endpoint : `${LINE_API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${creds.channel_access_token}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    
    // Some LINE API endpoints return 200 with empty body
    const text = await response.text();
    if (!response.ok) {
        const errorMsg = text ? JSON.parse(text).message : `HTTP ${response.status}`;
        throw new Error(`LINE API Error: ${errorMsg}`);
    }
    
    return text ? JSON.parse(text) : {};
}

/**
 * Send broadcast message to all followers
 * @param {Array} messages - Array of LINE message objects
 */
async function sendBroadcast(messages) {
    return lineApiRequest('/message/broadcast', 'POST', { messages });
}

/**
 * Send push message to specific user
 * @param {string} userId - LINE user ID
 * @param {Array} messages - Array of LINE message objects
 */
async function sendPush(userId, messages) {
    return lineApiRequest('/message/push', 'POST', { to: userId, messages });
}

/**
 * Get user profile by LINE user ID
 * @param {string} userId - LINE user ID
 * @returns {Object} User profile { displayName, userId, pictureUrl, statusMessage }
 */
async function getProfile(userId) {
    return lineApiRequest(`/profile/${userId}`);
}

/**
 * Get message quota info (how many messages remaining)
 */
async function getMessageQuota() {
    try {
        const quota = await lineApiRequest('/message/quota');
        const consumption = await lineApiRequest('/message/quota/consumption');
        return {
            type: quota.type, // 'limited' or 'none' (unlimited)
            value: quota.value || null, // total quota for this month
            totalUsage: consumption.totalUsage || 0
        };
    } catch (e) {
        return { type: 'unknown', value: null, totalUsage: 0, error: e.message };
    }
}

/**
 * Get follower count
 */
async function getFollowerCount() {
    try {
        // Use the followers count API (requires specific permission)
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const result = await lineApiRequest(`/insight/followers?date=${today}`);
        return result.followers || 0;
    } catch (e) {
        // Fallback: count from our DB
        const [rows] = await db.query('SELECT COUNT(*) as count FROM line_users WHERE is_active = 1');
        return rows[0].count || 0;
    }
}

/**
 * Handle incoming webhook events from LINE
 * Stores/updates user info in our database
 */
async function handleWebhookEvent(event) {
    try {
        const eventType = event.type;
        const userId = event.source?.userId;

        if (!userId) return;

        if (eventType === 'follow' || eventType === 'message') {
            // User followed or sent a message — save/update their profile
            try {
                const profile = await getProfile(userId);
                await db.query(`
                    INSERT INTO line_users (line_user_id, display_name, picture_url, status_message, is_active)
                    VALUES (?, ?, ?, ?, TRUE)
                    ON DUPLICATE KEY UPDATE 
                        display_name = VALUES(display_name),
                        picture_url = VALUES(picture_url),
                        status_message = VALUES(status_message),
                        is_active = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                `, [userId, profile.displayName || '', profile.pictureUrl || '', profile.statusMessage || '']);
                console.log(`[LINE Webhook] Saved/Updated user: ${profile.displayName} (${userId})`);
            } catch (profileErr) {
                // If we can't get profile, at least save the user ID
                await db.query(`
                    INSERT INTO line_users (line_user_id, is_active)
                    VALUES (?, TRUE)
                    ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP
                `, [userId]);
            }
        } else if (eventType === 'unfollow') {
            // User unfollowed — mark inactive
            await db.query('UPDATE line_users SET is_active = FALSE WHERE line_user_id = ?', [userId]);
            console.log(`[LINE Webhook] User unfollowed: ${userId}`);
        }
    } catch (err) {
        console.error('[LINE Webhook] Error processing event:', err.message);
    }
}

/**
 * Build a Flex Message for product recommendation
 * @param {Object} product - Product object from DB
 * @param {Object} aiContent - AI-generated content { headline, intro, call_to_action }
 * @param {string} storeUrl - Base URL of the store
 * @returns {Object} LINE Flex Message object
 */
function buildProductFlexMessage(product, aiContent, storeUrl) {
    const productUrl = `${storeUrl}/products/${product.slug || product.id}`;
    
    let imageUrl = product.image_url;
    if (!imageUrl && product.images) {
        try {
            const parsed = JSON.parse(product.images);
            if (parsed.length > 0) imageUrl = parsed[0];
        } catch (e) {}
    }

    const price = Number(product.price || 0).toLocaleString('th-TH');
    const originalPrice = product.original_price ? Number(product.original_price).toLocaleString('th-TH') : null;

    return {
        type: 'flex',
        altText: aiContent.headline || `แนะนำ: ${product.name}`,
        contents: {
            type: 'bubble',
            size: 'giga',
            hero: imageUrl ? {
                type: 'image',
                url: imageUrl,
                size: 'full',
                aspectRatio: '20:13',
                aspectMode: 'cover',
                action: { type: 'uri', label: 'ดูสินค้า', uri: productUrl }
            } : undefined,
            body: {
                type: 'box',
                layout: 'vertical',
                spacing: 'md',
                contents: [
                    {
                        type: 'text',
                        text: aiContent.headline || product.name,
                        weight: 'bold',
                        size: 'xl',
                        wrap: true,
                        color: '#1a1a1a'
                    },
                    {
                        type: 'text',
                        text: aiContent.intro || product.short_description || '',
                        size: 'sm',
                        color: '#666666',
                        wrap: true
                    },
                    {
                        type: 'separator',
                        margin: 'lg'
                    },
                    {
                        type: 'box',
                        layout: 'horizontal',
                        margin: 'lg',
                        contents: [
                            {
                                type: 'text',
                                text: 'ราคา',
                                size: 'sm',
                                color: '#999999',
                                flex: 0
                            },
                            {
                                type: 'text',
                                text: `฿${price}`,
                                size: 'xl',
                                color: '#059669',
                                weight: 'bold',
                                align: 'end'
                            }
                        ]
                    },
                    ...(originalPrice ? [{
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            { type: 'filler' },
                            {
                                type: 'text',
                                text: `฿${originalPrice}`,
                                size: 'xs',
                                color: '#aaaaaa',
                                decoration: 'line-through',
                                align: 'end'
                            }
                        ]
                    }] : [])
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: aiContent.call_to_action || 'ดูรายละเอียดเพิ่มเติม',
                            uri: productUrl
                        },
                        style: 'primary',
                        color: '#10b981',
                        height: 'md'
                    }
                ]
            }
        }
    };
}

module.exports = {
    getLineCredentials,
    sendBroadcast,
    sendPush,
    getProfile,
    getMessageQuota,
    getFollowerCount,
    handleWebhookEvent,
    buildProductFlexMessage
};
