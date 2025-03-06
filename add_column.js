const { Pool } = require('pg'); // PostgreSQL client
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('./config/db.keys');

const pool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT || 5432,
    ssl: {
        rejectUnauthorized: false,
    },
});


async function addColumn() {
    // Get arguments: table name, column name, data type, and constraints
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log("Usage: node add_column.js <table> <column> <data_type> [constraints]");
        process.exit(1);
    }

    const [table, column, dataType, ...constraints] = args;
    const constraintString = constraints.join(" "); // Combine optional constraints

    // Construct the SQL query
    const query = `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${dataType} ${constraintString};`;

    try {
        await pool.connect();
        await pool.query(query);
        console.log(`✅ Column '${column}' added to table '${table}' successfully.`);
    } catch (error) {
        console.error("❌ Error adding column:", error.message);
    } finally {
        await pool.end();
    }
}

addColumn();
