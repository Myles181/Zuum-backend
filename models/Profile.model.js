const db = require('../config/db.conf');

const createProfileTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS profile (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNIQUE NOT NULL,
            image VARCHAR(255),
            cover_image VARCHAR(255),
            bio VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
        console.log('✅ Profile table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

// Run this function before starting the server

module.exports = {createProfileTable};
