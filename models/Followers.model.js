const db = require('../config/db.conf');

const createFollowTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            follower_id INT NOT NULL,
            following_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            UNIQUE KEY unique_follow (follower_id, following_id),

            FOREIGN KEY (follower_id) REFERENCES profile(id) ON DELETE CASCADE,
            FOREIGN KEY (following_id) REFERENCES profile(id) ON DELETE CASCADE
        )`);
        console.log('✅ Follow table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};


module.exports = { createFollowTable };
