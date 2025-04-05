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

            if (meta?.payment_type === 'subscription') {
                console.log(`Processing subscription payment data for tx_ref: ${tx_ref}: ${data}`);

            // Update transaction status
                const result = await db.query(
                    `UPDATE subscription_transactions
                    SET status = $1, flw_ref = $2, updated_at = CURRENT_TIMESTAMP 
                    WHERE tx_ref = $3 RETURNING *`,
                    [status, flw_ref, tx_ref]
                );

                if (result.rows.length === 0) {
                    console.log(`Transaction not found for tx_ref: ${tx_ref}`);
                } else {
                    // Update the payment status
                    await db.query(
                        `UPDATE profile
                        SET subscription_status = 'completed', transaction_id = $2
                        WHERE user_id = $1`,
                        [meta?.user_id, result.rows[0].id]
                    );
                    console.log(`Transaction updated: ${tx_ref} - ${status}`);
                    // TODO: Notify user (e.g., email) or update their subscription status
                }
            } else if (meta?.payment_type === 'beat_payment') {
                return;
            }
        } catch (error) {
            console.error('Webhook processing error:', error);
        }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ status: true, message: 'Webhook received' });
};