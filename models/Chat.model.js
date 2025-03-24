const db = require('../config/db.conf');

const createMessageTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER,
                room_id VARCHAR(50),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (sender_id) REFERENCES profile(id),
                FOREIGN KEY (receiver_id) REFERENCES profile(id)
            )
        `);
        // console.log('✅ User table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

const createRoomsTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                profileId_1 INTEGER NOT NULL,
                profileId_2 INTEGER NOT NULL,
                room_id VARCHAR(6),
                created_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (profileId_1) REFERENCES profile(id),
                FOREIGN KEY (profileId_2) REFERENCES profile(id)
            )
        `);
        // console.log('✅ User table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

module.exports = { createMessageTable, createRoomsTable };
