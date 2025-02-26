const db = require('../config/db.conf');

const createUserTable = async () => {
    try {
        const connection = await db.getConnection();
        await connection.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('✅ User table is ready!');
        connection.release();
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};

// Run this function before starting the server
createUserTable();

module.exports = db;
