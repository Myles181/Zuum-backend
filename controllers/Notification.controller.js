const db = require("../config/db.conf");
// const { sendNotification } = require("../helpers/notification.service");

// ✅ 1️⃣ Get Notifications for a User
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.profile.id;
        console.log(userId);
        const client = await db.connect();

        const result = await client.query(
            `SELECT *
             FROM notifications WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        client.release();

        return res.status(200).json({
            status: true,
            notifications: result.rows
        });

    } catch (err) {
        console.error("❌ Error fetching notifications:", err);
        return res.status(500).json({ status: false, error: err.message });
    }
};

// ✅ 2️⃣ Mark Notification as Read
exports.markNotificationAsRead = async (req, res) => {
    try {
        const profile_id = req.profile.id;
        const { notificationId } = req.params;
        const client = await db.connect();

        const result = await client.query(
            `UPDATE notifications SET read = true 
             WHERE id = $1 AND user_id = $2 
             RETURNING *`,
            [notificationId, profile_id]
        );
        client.release();

        if (result.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Notification not found" });
        }

        return res.status(200).json({ status: true, message: "Notification marked as read" });

    } catch (err) {
        console.error("❌ Error updating notification:", err);
        return res.status(500).json({ status: false, error: err.message });
    }
};

// ✅ 3️⃣ Delete a Notification
exports.deleteNotification = async (req, res) => {
    try {
        const profile_id = req.profile.id;
        const { notificationId } = req.params;
        const client = await db.connect();

        const result = await client.query(
            `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *`, 
            [notificationId, profile_id]
        );
        client.release();

        if (result.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Notification not found" });
        }

        return res.status(200).json({ status: true, message: "Notification deleted" });

    } catch (err) {
        console.error("❌ Error deleting notification:", err);
        return res.status(500).json({ status: false, error: err.message });
    }
};

// ✅ 4️⃣ (Optional) Send Notification Manually (For Testing)
// exports.sendManualNotification = async (req, res) => {
//     try {
//         const { userId, message, type } = req.body;

//         await sendNotification(userId, message, type);

//         return res.status(200).json({ status: true, message: "Notification sent successfully" });

//     } catch (err) {
//         console.error("❌ Error sending notification:", err);
//         return res.status(500).json({ status: false, error: err.message });
//     }
// };
