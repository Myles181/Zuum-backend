exports.handleFlutterwaveWebhook = async (req, res) => {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    const receivedHash = req.headers['verif-hash'];

    // Verify webhook authenticity
    if (!receivedHash || receivedHash !== secretHash) {
        console.log('Webhook verification failed');
        return res.status(401).json({ status: false, error: 'Invalid webhook signature' });
    }

    const { event, data } = req.body;

    if (event === 'charge.completed') {
        try {
            const { tx_ref, status, flw_ref, meta } = data;

            // For Subscription Plan
            if (meta?.payment_type === 'subscription') {
                console.log(`Processing subscription payment data for tx_ref: ${tx_ref}: ${data}`);

                const subscriptionQuery = await db.query(
                    `SELECT pp.frequency
                     FROM subscription_transactions st
                     LEFT JOIN payment_plans pp ON st.payment_plan_id = pp.id
                     WHERE st.user_id = $1
                     ORDER BY st.created_at DESC
                     LIMIT 1`,
                    [userId]
                );
                let interval;
                if (subscriptionQuery.rows.length === 0 || !subscriptionQuery.rows[0].frequency) {
                    // Default to 30 days if no plan or frequency found
                    interval = '30 days';
                } else {
                    const frequency = subscriptionQuery.rows[0].frequency;
                    interval = frequency === 'annual' ? '365 days' : '30 days'; // Adjust as needed
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
                        // Update profile status
                        await db.query(
                            `UPDATE profile
                             SET subscription_status = 'completed', transaction_id = $2
                             WHERE user_id = $1`,
                            [meta?.user_id, transaction.id]
                        );
                        console.log(`Transaction updated: ${tx_ref} - ${status}`);
                        // TODO: Notify user (e.g., email)
                    }
                }
            } 
            
            else if (meta?.payment_type === 'beat_payment') {
                return;
            }
        } catch (error) {
            console.error('Webhook processing error:', error);
        }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ status: true, message: 'Webhook received' });
};