const db = require('../config/db.conf');

const createSubscriptionTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                amount INT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // console.log('✅ Subscriptions table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const createPaymentsTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                subscription_id INT NOT NULL,
                reference VARCHAR(255) NOT NULL,
                status VARCHAR(255) DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // console.log('✅ Payments table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};


module.exports = { createSubscriptionTable, createPaymentsTable }

