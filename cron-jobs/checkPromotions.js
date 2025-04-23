const pool = require('../config/db.conf.js');
const cron = require('node-cron');


const checkPromotionExpirations = async () => {
    const client = await pool.connect();
    try {
        // Fetch all active promotions
        const activePromotions = await client.query(`
            SELECT pt.id, pt.user_id, pt.post_id, pt.timeline, pt.type, pt.amount
            FROM promotion_transactions pt
            JOIN profile p ON p.user_id = pt.user_id
            WHERE pt.active = $1
        `);

        const currentDate = new Date();

        for (const sub of activePromotions.rows) {
            const timeLine = new Date(sub.timeline);

            if (currentDate > timeLine) {
                // Update subscription status to expired
                await client.query(`
                    UPDATE promotion_transactions
                    SET active = $1
                    WHERE id = $2`,
                    [false, sub.id]
                );

                // Get the correct table name
                let tableName;
                if (type === 'beat') {
                    tableName = 'post_audio_sell';
                    transactionType = 'promotion_audio_sell';
                } else if (type === 'audio') {
                    tableName = 'post_audio';
                    transactionType = 'promotion_audio';
                } else {
                    tableName = 'post_video';
                    transactionType = 'promotion_video';
                }

                // Update profile status to expired
                await client.query(`
                    UPDATE ${tableName}
                    SET promoted = $1
                    WHERE post_id = $2`,
                    [false, sub.post_id]
                );

                console.log(`Promotion for post ${sub.post_id} expired for user ${sub.user_id}`);

                // TODO: Optionally notify user (e.g., via email)
                
            }
        }
    } catch (error) {
        console.error('Error checking promotion expirations:', error);
    } finally {
        client.release();
    }
};

// Schedule the job to run every day at midnight (00:00)
const startCronJob = () => {
    cron.schedule('0 0 * * *', () => {
        console.log('Running daily post promotion expiration check...');
        checkPromotionExpirations();
    }, {
        scheduled: true,
        timezone: 'UTC' // Adjust timezone as needed (e.g., 'Africa/Lagos' for Nigeria)
    });
    console.log('Promotion expiration cron job scheduled');
};

module.exports = { startCronJob };