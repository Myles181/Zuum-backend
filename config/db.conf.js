const mysql = require('mysql2/promise');  // Use promise-based MySQL
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('../config/db.keys');

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ✅ Test connection
async function testDBConnection() {
    try {
        const connection = await pool.getConnection();
        console.log("✅ MySQL connected successfully");
        connection.release();
    } catch (err) {
        console.error("❌ MySQL connection error:", err);
    }
}

testDBConnection();

module.exports = pool;
