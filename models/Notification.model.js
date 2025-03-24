const db = require('../config/db.conf');

const createNotificationTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
                action_user_id INT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
                action_user_image VARCHAR(255),
                post_id INT,
                message TEXT NOT NULL,
                type VARCHAR(50) NOT NULL,
                read BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Notifications table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating notifications table:', err);
    }
};

module.exports = { createNotificationTable };
