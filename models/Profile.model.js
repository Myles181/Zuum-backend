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
                followers INT DEFAULT 0,
                following INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_user FOREIGN KEY (user_id) 
                REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Profile table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

// Run this function before starting the server
const createVirtualAccountTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS virtual_accounts (
                id SERIAL PRIMARY KEY,
                profile_id INT UNIQUE NOT NULL,
                order_ref VARCHAR(255) NOT NULL,
                flw_ref VARCHAR(255) NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                account_number VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_profile FOREIGN KEY (profile_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Virtual Account table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};



module.exports = { createProfileTable, createVirtualAccountTable };
