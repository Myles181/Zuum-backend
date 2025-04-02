const db = require('../config/db.conf');

// const createSubscriptionTable = async () => {
//     try {
//         const client = await db.connect();
//         await client.query(`
//             CREATE TABLE IF NOT EXISTS subscriptions (
//                 id SERIAL PRIMARY KEY,
//                 name VARCHAR(255) NOT NULL,
//                 amount INT NOT NULL,
//                 identity VARCHAR(10) NOT NULL,
//                 payment_reference VARCHAR(255),
//                 timestamp TIMESTAMPTZ NOT NULL,
//             )
//         `);
//         // console.log('✅ Subscriptions table is ready!');
//         client.release();
//     } catch (err) {
//         console.error('❌ Error creating table:', err);
//     }
// };

// const createPaymentsTable = async () => {
//     try {
//         const client = await db.connect();
//         await client.query(`
//             CREATE TABLE IF NOT EXISTS payments (
//                 id SERIAL PRIMARY KEY,
//                 subscription_id INT NOT NULL,
//                 reference VARCHAR(255) NOT NULL,
//                 status VARCHAR(255) DEFAULT 'pending',
//                 created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
//             )
//         `);
//         // console.log('✅ Payments table is ready!');
//         client.release();
//     } catch (err) {
//         console.error('❌ Error creating table:', err);
//     }
// };

// config/db.conf.js (add to existing file)
const createPaymentTables = async () => {
    const client = await db.connect();
    try {
        // Create payment_plans table
        await client.query(`
            CREATE TABLE IF NOT EXISTS payment_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                amount DECIMAL(15, 2) DEFAULT 0.00,
                frequency VARCHAR(20) DEFAULT 'annual',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create transactions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                payment_plan_id INT,
                tx_ref VARCHAR(50) NOT NULL UNIQUE,
                flw_ref VARCHAR(50),
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'NGN',
                status VARCHAR(20) DEFAULT 'pending',
                account_expiration TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_plan FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id)
            )
        `);

        console.log('✅ Payment tables created');
    } catch (err) {
        console.error('❌ Error creating payment tables:', err);
        throw err; // Re-throw to handle in caller if needed
    } finally {
        client.release();
    }
};

module.exports = { createPaymentTables }

