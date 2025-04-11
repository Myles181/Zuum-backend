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
                balance INT DEFAULT 0,
                subscription_status VARCHAR(20) DEFAULT NULL,
                transaction_id INT,

                followers INT DEFAULT 0,
                following INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_user FOREIGN KEY (user_id) 
                REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) 
                REFERENCES subscription_transactions(id) ON DELETE CASCADE
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
                profile_id INT NOT NULL,
                order_ref VARCHAR(255) NOT NULL,
                flw_ref VARCHAR(255) NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                account_number VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                expiry_date TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

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

const PromotionPlanTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS promotion_plans
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                duration TIMESTAMPZ DEFAULT CURRENT_TIMESTAMP
                created_at TIMESTAMPZ DEFAULT CURRENT_TIMESTAMP,
            `)
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
}

const PromotionTransactionTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS promotion_transactions (
                id SERIAL PRIMARY KEY,
                post_id INT UNIQUE NOT NULL,
                type VARCHAR(10) NOT NULL,
                amount INT NOT NULL DEFAULT 0.00,
                tx_ref VARCHAR(10) NOT NULL,
                created_at TIMESTAMPZ DEFAULT CURRENT_TIMESTAMP,
            )
                `);
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
}


module.exports = { createProfileTable, createVirtualAccountTable };
