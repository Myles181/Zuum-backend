exports.handleFlutterwaveWebhook = async (req, res) => {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    const receivedHash = req.headers['verif-hash'];

    if (!receivedHash || receivedHash !== secretHash) {
        console.log('Webhook verification failed');
        return res.status(401).json({ status: false, error: 'Invalid webhook signature' });
    }

    const { event, data } = req.body;
    console.log('Webhook Event:', event);
    console.log('Webhook Data:', JSON.stringify(data, null, 2));

    if (event === 'charge.completed') {
        try {
            const { tx_ref, status, flw_ref, meta } = data;
            const userId = meta?.user_id;

            if (meta?.payment_type === 'subscription') {
                const subscriptionQuery = await db.query(
                    `SELECT pp.frequency
                     FROM subscription_transactions st
                     LEFT JOIN payment_plans pp ON st.payment_plan_id = pp.id
                     WHERE st.user_id = $1
                     ORDER BY st.created_at DESC
                     LIMIT 1`,
                    [userId]
                );

                let interval = '30 days';
                if (subscriptionQuery.rows.length && subscriptionQuery.rows[0].frequency === 'annual') {
                    interval = '365 days';
                }

                // Update transaction status
                const result = await db.query(
                    `UPDATE subscription_transactions
                     SET status = $1, flw_ref = $2, updated_at = CURRENT_TIMESTAMP, expires_at = CURRENT_TIMESTAMP + INTERVAL $4
                     WHERE tx_ref = $3 RETURNING *`,
                    [status, flw_ref, tx_ref, interval]
                );

                if (result.rows.length === 0) {
                    console.log(`Transaction not found for tx_ref: ${tx_ref}`);
                } else {
                    const transaction = result.rows[0];
                    if (status === 'successful') {
                        // Update user profile
                        await db.query(
                            `UPDATE profile
                             SET subscription_status = 'completed', transaction_id = $2
                             WHERE user_id = $1`,
                            [userId, transaction.id]
                        );
                        console.log(`User ${userId} subscription updated successfully.`);
                    }
                }
            } else if (meta?.payment_type === 'deposit') {
                return;
            }
        } catch (error) {
            console.error('Webhook processing error:', error);
        }
    }

    res.status(200).json({ status: true, message: 'Webhook received' });
};
