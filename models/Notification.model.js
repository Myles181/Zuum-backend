const db = require('../config/db.conf');

const createNotificationTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                type VARCHAR(50) NOT NULL,
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
