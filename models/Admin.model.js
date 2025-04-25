const db = require('../config/db.conf');

const createAdminTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                cover_photo VARCHAR(255),
                image VARCHAR(255),
                email_verified BOOLEAN DEFAULT false,
                is_admin BOOLEAN DEFAULT false,
                deactivated BOOLEAN DEFAULT false,
                deleted BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // console.log('✅ User table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};


module.exports = { createAdminTable };