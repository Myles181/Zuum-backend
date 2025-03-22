const db = require('../config/db.conf');

const createFollowTable = async () => {
    try {
        const client = await db.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS follow (
                id SERIAL PRIMARY KEY,
                follower_id INT NOT NULL,
                following_id INT NOT NULL,
                active BOOLEAN NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
                CONSTRAINT fk_follower FOREIGN KEY (follower_id) 
                REFERENCES profile(id) ON DELETE CASCADE,
                CONSTRAINT fk_following FOREIGN KEY (following_id) 
                REFERENCES profile(id) ON DELETE CASCADE
            )
        `);
        // console.log('✅ Follow table is ready!');
        client.release();
    } catch (err) {
        console.error('❌ Error creating Follow table:', err);
    }
};

module.exports = { createFollowTable };
