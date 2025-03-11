const { io } = require("../server"); // Import WebSocket instance
const db = require("../config/db.conf"); // DB connection

exports.sendNotification = async (userId, message, type) => {
    try {
        const client = await db.connect();
        await client.query(`
            INSERT INTO notifications (user_id, message, type) 
            VALUES ($1, $2, $3) RETURNING *`, [userId, message, type]);
        client.release();
        
        // Emit real-time notification
        io.to(userId.toString()).emit("new_notification", { message, type });

        console.log(`📢 Notification sent to user ${userId}: ${message}`);
    } catch (err) {
        console.error("❌ Error sending notification:", err);
    }
};
