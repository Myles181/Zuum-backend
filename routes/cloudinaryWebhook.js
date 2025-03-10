const express = require("express");
const router = express.Router();
const db = require('../config/db.conf');

router.post("/cloudinary", async (req, res) => {
    try {
        const payload = req.body;

        console.log("📩 Cloudinary Webhook Received:", payload);

        // Ensure it's an upload notification and has a valid URL
        if (!payload || payload.notification_type !== "upload" || !payload.secure_url) {
            return res.status(400).json({ error: "Invalid webhook data" });
        }

        // Extract post_id from the public_id (assuming it's formatted as post_audio_{post_id})
        const postIdMatch = payload.public_id.match(/^post_audio_(\d+)$/);
        if (!postIdMatch) {
            return res.status(400).json({ error: "Invalid post ID format" });
        }

        const post_id = postIdMatch[1];
        let upload_model = 'post_audio';

        // Check if it's audio/beat/video
        if (await db.query(`SELECT * FROM post_audio WHERE id = $1`, [post_id])) upload_model = 'post_audio';
        else if (await db.query(`SELECT * FROM post_beat WHERE id = $1`, [post_id])) upload_model = 'post_beat';
        else if (await db.query(`SELECT * FROM post_video WHERE id = $1`, [post_id])) upload_model = 'post_video';
        

        // ✅ Update database with the actual audio/video/beat URL
        await db.query(`UPDATE $3 SET audio_upload = $1 WHERE id = $2`, [payload.secure_url, post_id, upload_model]);

        console.log(`✅ ${upload_model} post ${post_id} updated with Cloudinary URL: ${payload.secure_url}`);

        res.status(200).json({ message: "Webhook processed successfully" });
    } catch (err) {
        console.error("❌ Webhook Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
