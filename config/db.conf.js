const { Pool } = require('pg'); // PostgreSQL client
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('../config/db.keys');

const pool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT || 5432, // Default PostgreSQL port
    ssl: {
        rejectUnauthorized: false,
    },
});

// ✅ Test PostgreSQL connection
async function testDBConnection() {
    try {
        const client = await pool.connect();
        console.log("✅ PostgreSQL connected successfully");
        client.release();
    } catch (err) {
        console.error("❌ PostgreSQL connection error:", err);
    }
}

testDBConnection();

module.exports = pool;
