const pool = require('../config/db.conf.js');
const cron = require('node-cron');


const checkSubscriptionExpirations = async () => {
    const client = await pool.connect();
    try {
        // Fetch all active subscriptions
        const activeSubscriptions = await client.query(`
            SELECT st.id, st.user_id, st.expires_at, st.payment_plan_id, st.tx_ref, p.subscription_status
            FROM subscription_transactions st
            JOIN profile p ON p.user_id = st.user_id
            WHERE st.status = 'successful' 
            AND p.subscription_status = 'completed'
        `);

        const currentDate = new Date();

        for (const sub of activeSubscriptions.rows) {
            const expiresAt = new Date(sub.expires_at);

            if (currentDate > expiresAt) {
                // Update subscription status to expired
                await client.query(`
                    UPDATE subscription_transactions
                    SET status = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2`,
                    ['expired', sub.id]
                );

                // Update profile status to expired
                await client.query(`
                    UPDATE profile
                    SET subscription_status = $1
                    WHERE user_id = $2`,
                    ['expired', sub.user_id]
                );

                console.log(`Subscription expired for user ${sub.user_id}, tx_ref: ${sub.tx_ref}`);
                // TODO: Optionally notify user (e.g., via email)
            }
        }
    } catch (error) {
        console.error('Error checking subscription expirations:', error);
    } finally {
        client.release();
    }
};

// Schedule the job to run every day at midnight (00:00)
const startCronJob = () => {
    cron.schedule('0 0 * * *', () => {
        console.log('Running daily subscription expiration check...');
        checkSubscriptionExpirations();
    }, {
        scheduled: true,
        timezone: 'UTC' // Adjust timezone as needed (e.g., 'Africa/Lagos' for Nigeria)
    });
    console.log('Subscription expiration cron job scheduled');
};

module.exports = { startCronJob };