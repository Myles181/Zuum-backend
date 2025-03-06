const db = require('../config/db.conf');

const createProfileTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS profile (
                id SERIAL PRIMARY KEY,
                user_id INT UNIQUE NOT NULL,
                image VARCHAR(255),
                cover_image VARCHAR(255),
                bio VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                
                CONSTRAINT fk_user FOREIGN KEY (user_id) 
                REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Profile table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

// Run this function before starting the server

module.exports = { createProfileTable };
