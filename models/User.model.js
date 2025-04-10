const db = require('../config/db.conf');

const createUserTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                firstname VARCHAR(255) NOT NULL,
                lastname VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                google_id VARCHAR(255) UNIQUE,
                phonenumber VARCHAR(100),
                identity VARCHAR(8) NOT NULL DEFAULT 'artist',
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


const createOtpTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS otp (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(6) UNIQUE NOT NULL DEFAULT 'pending',
                status VARCHAR(10) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        // console.log('✅ OTP table is ready!');
        client.release();

    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
}
// Run this function before starting the server

module.exports = { createUserTable, createOtpTable };
