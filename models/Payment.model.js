const db = require('../config/db.conf');

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
            CREATE TABLE IF NOT EXISTS subscription_transactions (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                payment_plan_id INT,
                tx_ref VARCHAR(50) NOT NULL UNIQUE,
                flw_ref VARCHAR(50),
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'NGN',
                status VARCHAR(20) DEFAULT 'pending',
                account_expiration TIMESTAMPTZ NOT NULL,
                expires_at TIMESTAMPZ,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_plan FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id)
            )
        `);

        // Create internal Transfer
        await client.query(`
            CREATE TABLE IF NOT EXISTS audio_sell_transactions (
                id SERIAL PRIMARY KEY,
                profile_id INT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'NGN',
                post_id INT NOT NULL,

                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES profile(id) ON DELETE CASCADE,
                CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES post_audio_sell(id) ON DELETE CASCADE
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

