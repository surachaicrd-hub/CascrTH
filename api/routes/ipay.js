const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Configuration loaded from environment variables
const IPAY_MERCHANT_ID = process.env.IPAY_MERCHANT_ID || '8369';
const IPAY_CURR_CODE = process.env.IPAY_CURR_CODE || '764';
const IPAY_PAY_TYPE = process.env.IPAY_PAY_TYPE || 'N';
const IPAY_LANG = process.env.IPAY_LANG || 'T';
const IPAY_PAY_METHOD = process.env.IPAY_PAY_METHOD || 'CC';
const IPAY_GATEWAY_URL = process.env.IPAY_GATEWAY_URL || 'https://ipay.bangkokbank.com/b2c/eng/payment/payForm.jsp';

// The base frontend URL (where the user's browser should ultimately end up)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: Restore stock quantities when an order is cancelled or payment fails
async function restoreOrderStock(orderRef) {
    try {
        const [orderItems] = await db.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
            [orderRef]
        );
        for (const item of orderItems) {
            await db.query(
                'UPDATE products SET stock_quantity = stock_quantity + ?, is_out_of_stock = 0 WHERE id = ? AND stock_quantity IS NOT NULL',
                [item.quantity, item.product_id]
            );
        }
        if (orderItems.length > 0) {
            console.log(`[iPay Stock] Restored stock for ${orderItems.length} items from order ${orderRef}`);
        }
    } catch (err) {
        console.error(`[iPay Stock] Failed to restore stock for order ${orderRef}:`, err.message);
    }
}

/**
 * POST /api/payments/ipay/checkout
 * Generates the required parameters for the frontend to submit to Bangkok Bank iPay.
 * Expects { orderId } in the request body.
 */
router.post('/checkout', async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({ success: false, error: 'Order ID is required' });
        }

        // Fetch the order to get the amount
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        
        if (orders.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const order = orders[0];
        
        // Ensure the order is still pending
        if (order.payment_status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Order is not in pending status' });
        }

        // Format amount (e.g., 2 decimal places if required by iPay)
        const amountStr = parseFloat(order.total_amount).toFixed(2);

        // Construct the URLs that the bank will redirect back to
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;
        
        const successUrl = `${baseUrl}/api/payments/ipay/success`;
        const failUrl = `${baseUrl}/api/payments/ipay/fail`;
        const cancelUrl = `${baseUrl}/api/payments/ipay/cancel`;

        // Fetch merchant ID setting from db if available
        const [settingsRows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = "payment_ipay_merchant_id"');
        const dbMerchantId = settingsRows.length > 0 ? settingsRows[0].setting_value : null;
        const merchantIdToUse = dbMerchantId || IPAY_MERCHANT_ID;

        const payload = {
            gatewayUrl: IPAY_GATEWAY_URL,
            formData: {
                merchantId: merchantIdToUse,
                amount: amountStr,
                orderRef: orderId,
                currCode: IPAY_CURR_CODE,
                successUrl: successUrl,
                failUrl: failUrl,
                cancelUrl: cancelUrl,
                payType: IPAY_PAY_TYPE,
                lang: IPAY_LANG,
                payMethod: IPAY_PAY_METHOD,
                remark: '-'
            }
        };

        res.json({ success: true, payload });

    } catch (err) {
        console.error('iPay Checkout Payload Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/payments/ipay/success
 * Bank redirects here when payment succeeds
 */
router.post('/success', async (req, res) => {
    try {
        // Bangkok Bank iPay usually sends parameters back via POST
        const { orderRef } = req.body;

        if (orderRef) {
            const [orders] = await db.query('SELECT payment_status FROM orders WHERE id = ?', [orderRef]);
            if (orders.length === 0) {
                return res.redirect(`${FRONTEND_URL}/checkout-failed?error=order_not_found`);
            }
            // Only update if current payment status is pending
            if (orders[0].payment_status === 'pending') {
                await db.query(
                    "UPDATE orders SET payment_status = 'paid', order_status = 'processing', updated_at = NOW() WHERE id = ?",
                    [orderRef]
                );
            }
        }

        // Redirect browser to the frontend success page
        res.redirect(`${FRONTEND_URL}/order-success/${orderRef}`);
    } catch (err) {
        console.error('iPay Success Callback Error:', err);
        res.redirect(`${FRONTEND_URL}/checkout-failed?error=internal_error`);
    }
});

/**
 * POST /api/payments/ipay/fail
 * Bank redirects here when payment fails
 */
router.post('/fail', async (req, res) => {
    try {
        const { orderRef } = req.body;

        if (orderRef) {
            const [orders] = await db.query('SELECT payment_status FROM orders WHERE id = ?', [orderRef]);
            if (orders.length > 0 && orders[0].payment_status === 'pending') {
                await db.query(
                    "UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = ?",
                    [orderRef]
                );
                // Restore stock since payment failed
                await restoreOrderStock(orderRef);
            }
        }

        res.redirect(`${FRONTEND_URL}/order-success/${orderRef}?error=payment_failed`);
    } catch (err) {
        console.error('iPay Fail Callback Error:', err);
        res.redirect(`${FRONTEND_URL}/`);
    }
});

/**
 * POST /api/payments/ipay/cancel
 * Bank redirects here when user cancels payment
 */
router.post('/cancel', async (req, res) => {
    try {
        const { orderRef } = req.body;

        if (orderRef) {
            const [orders] = await db.query('SELECT payment_status FROM orders WHERE id = ?', [orderRef]);
            if (orders.length > 0 && orders[0].payment_status === 'pending') {
                await db.query(
                    "UPDATE orders SET payment_status = 'cancelled', order_status = 'cancelled', updated_at = NOW() WHERE id = ?",
                    [orderRef]
                );
                // Restore stock since user cancelled payment
                await restoreOrderStock(orderRef);
            }
        }

        res.redirect(`${FRONTEND_URL}/order-success/${orderRef}?error=user_cancelled`);
    } catch (err) {
        console.error('iPay Cancel Callback Error:', err);
        res.redirect(`${FRONTEND_URL}/`);
    }
});

const { sendOrderStatusUpdate } = require('../services/emailService');

/**
 * POST /api/payments/ipay/webhook
 * Background webhook from Bangkok Bank iPay for Server-to-Server reliable updates
 */
router.post('/webhook', async (req, res) => {
    try {
        const { orderRef, successcode, AuthResCode, prc, secureHash, src } = req.body;
        console.log('[iPay Webhook] Received payload:', req.body);

        if (!orderRef) {
            return res.status(400).send('Missing orderRef');
        }

        // Retrieve secure hash configuration from settings if configured
        const [settingsRows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = "payment_ipay_secure_secret"');
        const secureSecret = settingsRows.length > 0 ? settingsRows[0].setting_value : null;

        if (secureSecret) {
            if (!secureHash) {
                console.error('[iPay Webhook] Security Alert: Webhook received without secureHash.');
                return res.status(400).send('Missing secureHash');
            }

            // AsiaPay/BBL iPay typical secure hash verification
            const crypto = require('crypto');
            const rawAmount = req.body.amt || req.body.amount || '';
            const currency = req.body.cur || req.body.currCode || '';
            const payRef = req.body.payRef || '';

            // Concatenate parameters: src|prc|successcode|ref|payRef|cur|amt|authStatus|secureSecret
            const hashPayload = [
                src || '',
                prc || '',
                successcode || '',
                orderRef,
                payRef,
                currency,
                rawAmount,
                AuthResCode || '',
                secureSecret
            ].join('|');

            const calculatedHashSha256 = crypto.createHash('sha256').update(hashPayload).digest('hex');
            const calculatedHashSha1 = crypto.createHash('sha1').update(hashPayload).digest('hex');

            const verified = (secureHash === calculatedHashSha256) || (secureHash === calculatedHashSha1);

            if (!verified) {
                console.error('[iPay Webhook] Security Alert: Invalid secureHash provided.', {
                    received: secureHash,
                    expectedSha256: calculatedHashSha256
                });
                return res.status(400).send('Invalid secureHash signature');
            }
            console.log('[iPay Webhook] Secure hash verified successfully.');
        }

        // Check success criteria
        const isSuccess = successcode === '0' || prc === '0' || AuthResCode === '00';

        if (isSuccess) {
            const [orders] = await db.query('SELECT payment_status FROM orders WHERE id = ?', [orderRef]);
            if (orders.length > 0 && orders[0].payment_status === 'pending') {
                await db.query(
                    "UPDATE orders SET payment_status = 'paid', order_status = 'processing', updated_at = NOW() WHERE id = ?",
                    [orderRef]
                );
                
                // Trigger email in background
                sendOrderStatusUpdate(orderRef, 'processing', 'paid').catch(e => console.error('[Webhook Email Error]:', e.message));
                console.log(`[iPay Webhook] Order ${orderRef} updated to paid.`);
            }
        } else {
             // Handle payment failure in background
              const [orders] = await db.query('SELECT payment_status FROM orders WHERE id = ?', [orderRef]);
              if (orders.length > 0 && orders[0].payment_status === 'pending') {
                  await db.query(
                      "UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = ?",
                      [orderRef]
                  );
                  // Restore stock since payment failed via webhook
                  await restoreOrderStock(orderRef);
                  console.log(`[iPay Webhook] Order ${orderRef} updated to failed.`);
              }
        }

        // Respond OK so the bank doesn't retry
        res.status(200).send('OK');
    } catch (err) {
        console.error('[iPay Webhook Error]:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
