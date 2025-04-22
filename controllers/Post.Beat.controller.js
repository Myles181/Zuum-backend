require('dotenv').config();
const db = require('../config/db.conf.js');
const { validationResult } = require('express-validator');
// const { transporter } = require('../helpers/transport.js');
const cloudinary = require('cloudinary').v2;
// const ffmpeg = require("fluent-ffmpeg");


// Helper function
function extractPublicId(fullUrl) {
    const parts = fullUrl.split('/');
    return parts.slice(-1)[0].split('.')[0]; // assumes filename.mp3
}


exports.createBeatPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;

        // 2️⃣ Extract audio post details from request
        const { caption, description, total_supply, amount, genre } = req.body;

        let cloud_audio_upload, cloud_cover_photo;

        // Handle file uploads to Cloudinary
        if (req.files && req.files.cover_photo && req.files.audio_upload) {
            console.log("Stat time:",Date.now());
            cloud_cover_photo = await cloudinary.uploader.upload(req.files.cover_photo.tempFilePath);
            cloud_audio_upload = await cloudinary.uploader.upload(req.files.audio_upload.tempFilePath, {
                resource_type: "video",
                folder: "beat_uploads",
                format: "mp3",
                chunk_size: 6000000,
            });
            console.log("End time:",Date.now());
        } else {
            return res.status(400).json({ status: false, message: 'No files found' });
        }

        // 3️⃣ Insert into post_beat table
        const postResult = await db.query(
            `INSERT INTO post_audio_sell 
            (profile_id, caption, description, audio_upload, cover_photo, amount, total_supply, genre)
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [profileId, caption, description, cloud_audio_upload.secure_url, cloud_cover_photo.secure_url, amount, total_supply, genre]
        );

        console.log(postResult);
        res.status(201).json({ 
            status: true, 
            message: "Beat post created successfully!"
        });

    } catch (error) {
        console.error("❌ Error creating audio post:", error);
        res.status(500).json({ error: error.message });
    }
};


exports.updateBeatPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const profileId = req.profile.id;
        const { post_id, ...updateFields } = req.body;

        // 1️⃣ Check if post exists
        console.log(post_id)
        const postExists = await db.query(`SELECT profile_id FROM post_audio_sell WHERE id = $1`, [post_id]);
        if (postExists.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }
        // console.log(postExists.profile_id);
        if (postExists.rows[0].profile_id !== profileId) {
            return res.status(404).json({ status: false, message: "You do not have permission" });
        }

        // 2️⃣ Handle file uploads (if provided)
        let cloud_audio_upload, cloud_cover_photo;

        if (req.files?.cover_photo) {
            cloud_cover_photo = await cloudinary.uploader.upload(req.files.cover_photo.tempFilePath);
            updateFields.cover_photo = cloud_cover_photo.secure_url;
        }

        if (req.files?.audio_upload) {
            console.log("Upload Start time: ", Date())
            cloud_audio_upload = await cloudinary.uploader.upload(req.files.audio_upload.tempFilePath, {
                resource_type: "video",  // Ensures large files like audio/video are processed properly
                chunk_size: 6000000,
            });
            // console.log(cloud_audio_upload);

            // Store a placeholder value until the webhook updates it
            updateFields.audio_upload = cloud_audio_upload.secure_url;
        }
        console.log("Upload End time: ", Date())

        // 3️⃣ Prepare dynamic update query
        const audioUpdates = [];
        const audioValues = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updateFields)) {
            if (value) {
                audioUpdates.push(`${key} = $${paramIndex++}`);
                audioValues.push(value);
            }
        }

        if (audioUpdates.length > 0) {
            audioValues.push(post_id);
            await db.query(
                `UPDATE post_audio_sell SET ${audioUpdates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
                audioValues
            );
        }

        res.status(200).json({
            status: true,
            message: "Beat post updated successfully!"
        });

    } catch (error) {
        console.error("❌ Error updating audio post:", error);
        res.status(500).json({ error: error.message });
    }
};


exports.deleteBeatPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;
        const { post_id } = req.body;


        // 1️⃣ Check if post exists
        const postExists = await db.query(`SELECT id FROM post_audio_sell WHERE id = $1`, [post_id]);
        if (postExists.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }
        if (postExists[0].profile_id !== profileId) {
            return res.status(404).json({ status: false, message: "You do not have permission" });
        }

        // 3️⃣ Delete the comment
        await db.query(
            `DELETE FROM post_audio_sell WHERE id = $1`,
            [post_id]
        );

        return res.status(200).json({ status: true, message: "Post deleted successfully!" });

    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};


exports.reactToBeatPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;
        const { post_id, like, unlike } = req.body;

        // Ensure like and unlike are not both true or false
        if (like === unlike) {
            return res.status(400).json({
                status: false,
                message: "Like and unlike cannot be equal."
            });
        }

        // Check if the post exists and get current counts
        const postResult = await db.query(
            `SELECT id, likes, unlikes FROM post_audio_sell WHERE id = $1`, 
            [post_id]
        );
        
        if (postResult.rowCount === 0) {
            return res.status(404).json({ 
                status: false, 
                message: "Post not found." 
            });
        }
        
        const post = postResult.rows[0];
        let likesCount = post.likes;
        let unlikesCount = post.unlikes;

        // Check if user already reacted
        const reactionResult = await db.query(
            `SELECT id, "like", "unlike" FROM post_beat_reactions 
             WHERE post_id = $1 AND post_reacter_id = $2`,
            [post_id, profileId]
        );

        const hasExistingReaction = reactionResult.rowCount > 0;
        
        if (hasExistingReaction) {
            const reaction = reactionResult.rows[0];
            
            // No change in reaction
            if (reaction.like === like && reaction.unlike === unlike) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Reaction has not changed" 
                });
            }
            
            // Update the reaction
            await db.query(
                `UPDATE post_beat_reactions 
                 SET like = $1, unlike = $2 
                 WHERE post_id = $3 AND post_reacter_id = $4`,
                [like, unlike, post_id, profileId]
            );
            
            // Update counter based on the change
            if (reaction.like && !like) likesCount--; // Removed like
            if (reaction.unlike && !unlike) unlikesCount--; // Removed unlike
            if (!reaction.like && like) likesCount++; // Added like
            if (!reaction.unlike && unlike) unlikesCount++; // Added unlike
            
        } else {
            // Insert new reaction
            await db.query(
                `INSERT INTO post_beat_reactions (post_id, post_reacter_id, "like", "unlike")
                 VALUES ($1, $2, $3, $4)`,
                [post_id, profileId, like, unlike]
            );
            
            // Update counter for new reaction
            if (like) likesCount++;
            if (unlike) unlikesCount++;
        }
        
        // Update the post counts
        await db.query(
            `UPDATE post_audio_sell
             SET likes = $1, unlikes = $2
             WHERE id = $3`,
            [likesCount, unlikesCount, post_id]
        );
        
        return res.status(hasExistingReaction ? 200 : 201).json({ 
            status: true, 
            message: hasExistingReaction 
                ? "Reaction updated successfully!" 
                : "Reaction added successfully!" 
        });
        
    } catch (error) {
        console.error("Error in reactToBeatPost:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};


exports.commentToBeatPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;

        const { post_id, comment } = req.body;

        // 2️⃣ Check if the post exists
        const postResult = await db.query(
            `SELECT id, comments FROM post_audio_sell WHERE id = $1`,
            [post_id]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }

        const post = postResult.rows[0];
        let commentCount = post.comments;

        // 3️⃣ Insert the comment
        await db.query(
            `INSERT INTO post_beat_comments (post_id, post_commenter_id, comment) 
             VALUES ($1, $2, $3)`,
            [post_id, profileId, comment]
        );

        await db.query(
            `UPDATE post_audio_sell
            SET comments = $1
            WHERE id = $2`,
            [commentCount+1, post_id]
        );

        return res.status(201).json({ status: true, message: "Comment added successfully!" });

    } catch (error) {
        console.error("Error in commentToBeatPost:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};


// 📝 Update a Comment on an Beat Post
exports.updateCommentOnBeatPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;
        const { comment_id, new_comment } = req.body;

        // 2️⃣ Check if the comment exists and belongs to the user
        const commentResult = await db.query(
            `SELECT id FROM post_beat_comments WHERE id = $1 AND post_commenter_id = $2`,
            [comment_id, profileId]
        );

        if (commentResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Comment not found or unauthorized." });
        }

        // 3️⃣ Update the comment
        await db.query(
            `UPDATE post_beat_comments SET comment = $1 WHERE id = $2`,
            [new_comment, comment_id]
        );

        return res.status(200).json({ status: true, message: "Comment updated successfully!" });

    } catch (error) {
        console.error("Error updating comment:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 🗑️ Delete a Comment on an Beat Post
exports.deleteCommentOnBeatPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;
        const { comment_id } = req.body;

        // Check if the comment exists and belongs to the user
        const commentResult = await db.query(
            `SELECT id, post_id FROM post_beat_comments WHERE id = $1 AND post_commenter_id = $2`,
            [comment_id, profileId]
        );

        if (commentResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Comment not found or unauthorized." });
        }

        const postId = commentResult.rows[0].post_id;

        // Get current comment count
        const postResult = await db.query(
            `SELECT comments FROM post_audio_sell WHERE id = $1`,
            [postId]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Associated post not found." });
        }

        const currentCommentCount = postResult.rows[0].comments;

        // Delete the comment
        await db.query(
            `DELETE FROM post_beat_comments WHERE id = $1`,
            [comment_id]
        );

        // Update the comment count
        await db.query(
            `UPDATE post_audio_sell
             SET comments = $1
             WHERE id = $2`,
            [Math.max(0, currentCommentCount - 1), postId]
        );

        return res.status(200).json({ status: true, message: "Comment deleted successfully!" });

    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

exports.purchaseBeatPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const profile = req.profile;
        const { postId, amount } = req.body;

        // Find the post
        const postResult = await db.query(
            `SELECT * FROM post_audio_sell
            WHERE id = $1`,
            [postId]
        );

        if (postResult.rowCount === 0) return res.status(404).json({ message: 'Post does not exist' });
        else if (postResult.rows[0].total_buyers >= postResult.rows[0].total_supply) return res.status(404).json({ message: 'Post is sold out' });

        // Check if amount is equivalent to the beat amount
        if (postResult.rows[0].amount !== amount) return res.status(400).json({ message: 'Incorrect amount' });

        // Check if the user if a dev
        const userDev = await db.query(`SELECT identity FROM users WHERE id = $1`, [profile.user_id]);

        if (userDev.rows[0].identity === "dev") {
            console.log("This user is a dev");

            // Add the audio in users purchased beats
            await db.query(`
                INSERT INTO audio_purchases (profile_id, post_id, audio_upload, amount_paid)
                VALUES ($1, $2, $3, $4)`, [profile.id, postId, postResult.rows[0].audio_upload, amount]
            );

            await db.query(`
                UPDATE post_audio_sell
                SET total_buyers = total_buyers + 1
                WHERE id = $1`, [postId]
            );

            return res.status(200).json({ status: true, message: "Beat post purchased successfully!" });

        }

        // Check if user balance is upto 
        if (profile.balance < amount) return res.status(400).json({ status: false, message: "Insufficient balance" });

        // Add the audio in users purchased beats
        await db.query(`
            INSERT INTO audio_purchases (profile_id, post_id, audio_upload, amount_paid)
            VALUES ($1, $2, $3, $4)`, [profile.id, postId, postResult.rows[0].audio_upload, amount]
        );

        // Remove the amount from the user
        await db.query(`
            UPDATE profile
            SET balance = balance - $1
            WHERE id = $2`, [amount, profile.id]
        );

        // Add the amount to the user earnings
        await db.query(`
            UPDATE profile
            SET balance = balance + $1
            WHERE id = $2`, [amount, postResult.rows[0].profile_id]
        );

        // Add to the post's purchase count
        await db.query(`
            UPDATE post_audio_sell
            SET total_buyers = total_buyers + 1
            WHERE id = $1`, [postId]
        );

        // Add to the transactions
        const beat_owner = await db.query(`
            SELECT user_id FROM profile WHERE id = $1`, [postResult.rows[0].profile_id]
        );
        await db.query(`
            INSERT INTO audio_sell_transactions (user_id, purchaser_id, amount, currency, post_id)
            VALUES ($1, $2, $3, $4)`, [beat_owner.rows[0].user_id, profile.user_id, amount, "NGN", postId])

        // Send a success response
        return res.status(200).json({ status: true, message: "Beat post purchased successfully!" });

    } catch (error) {
        console.error("Error :", error);
        return res.status(500).json({ status: false, error: error.message });
    }
}

exports.getPurchasedBeats = async (req, res) => {
    try {
        const profile = req.profile;

        const purchasesResult = await db.query(
            `SELECT * FROM audio_purchases WHERE profile_id = $1`,
            [profile.id]
        );
        if (purchasesResult.rowCount === 0) {
            return res.status(200).json({ audios: [] });
        }

        const purchasedBeats = purchasesResult.rows;

        // Extract beat IDs
        const postIds = purchasedBeats.map(p => p.post_id);

        // Get audio post details
        const audioPostDetailsResult = await db.query(`
            SELECT p.*, pf.image, u.username AS artist 
            FROM post_audio_sell p
            JOIN profile pf ON p.profile_id = pf.id
            JOIN users u ON pf.user_id = u.id
            WHERE p.id = ANY($1::int[])`,
            [postIds]
        );

        const beatDetails = audioPostDetailsResult.rows;

        // Combine both sets of data
        const combinedData = beatDetails.map(beat => {
            const purchase = purchasedBeats.find(p => p.post_id === beat.id);

            return {
                id: beat.id,
                caption: beat.caption,
                artist: beat.artist,
                cover_photo: beat.cover_photo,
                amount: beat.amount,
                purchased_date: purchase?.created_at,
                duration: beat.duration || null,  // If you plan to add this field later
                genre: beat.genre || null,        // If you plan to add this field later
                downloads_remaining: beat.total_supply - beat.total_buyers || 0, // You can add this to `audio_purchases` table
                audio_upload: purchase?.audio_upload || beat.audio_upload
            };
        });

        return res.status(200).json({ audios: combinedData });

    } catch (error) {
        console.error("❌ Error getting purchased beats:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};


// Get all audio posts for the authenticated user
exports.getUserBeatPosts = async (req, res) => {
    try {
        const profileId = req.profile.id; // Fixed typo: req.profie -> req.profile
        
        // Query to get all audio posts from this user
        const userPostsResult = await db.query(
            `SELECT * FROM post_audio_sell 
            WHERE profile_id = $1
            ORDER BY created_at DESC`,
            [profileId]
        );
        
        if (userPostsResult.rowCount === 0) {
            return res.status(200).json({ 
                status: true, 
                message: "No audio posts found for this user",
                posts: [] 
            });
        }
        
        // Return the posts
        return res.status(200).json({
            status: true,
            posts: userPostsResult.rows
        });
        
    } catch (error) {
        console.log("I'm here");
        console.error("❌ Error getting user audio posts:", error);
        res.status(500).json({ status: false, error: error.message });
    }
};

// Get a specific audio post with all associated data
exports.getBeatPostById = async (req, res) => {
    console.log("Fetching audio post by ID");
    try {
        const { postId } = req.params; // Assuming the post ID is passed as a URL parameter

        // Query to get the main post with username from users table
        const postResult = await db.query(
            `SELECT p.*, u.username, pr.image AS profile_picture 
             FROM post_audio_sell p
             JOIN profile pr ON p.profile_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE p.id = $1`,
            [postId]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ 
                status: false, 
                message: "Beat post not found" 
            });
        }

        let post = postResult.rows[0];

        const cloudinaryBase = "https://res.cloudinary.com/dkvj3fbg9/video/upload";
        const publicId = extractPublicId(post.audio_upload);

        // 👇 Create 30-second trimmed preview link
        const previewAudioUrl = `${cloudinaryBase}/du_30/beat_uploads/${publicId}.mp3`;

        post.audio_upload = previewAudioUrl;

        // Query to get comments with commenter information
        const commentsResult = await db.query(
            `SELECT c.*, u.username, pr.image AS profile_picture 
             FROM post_beat_comments c
             JOIN profile pr ON c.post_commenter_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at DESC`,
            [postId]
        );

        // Query to get reactions with reactor information
        const reactionsResult = await db.query(
            `SELECT r.*, u.username, pr.image AS profile_picture 
             FROM post_beat_reactions r
             JOIN profile pr ON r.post_reacter_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE r.post_id = $1`,
            [postId]
        );

        // Combine all data
        const postWithDetails = {
            ...post,
            comments: commentsResult.rows,
            reactions: reactionsResult.rows
        };

        return res.status(200).json({
            status: true,
            post: postWithDetails
        });

    } catch (error) {
        console.error("❌ Error getting audio post details:", error);
        res.status(500).json({ status: false, error: error.message });
    }
};

// Get all audio posts with pagination
exports.getBeatPosts = async (req, res) => {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        console.log("")

        // Query to get posts with creator information
        let postsResult = await db.query(
            `SELECT 
                p.*, 
                u.username, 
                pf.image, 
                COUNT(*) OVER() AS total_count,
                CASE 
                    WHEN ap.id IS NOT NULL THEN true 
                    ELSE false 
                END AS has_purchased
             FROM post_audio_sell p
             JOIN profile pf ON p.profile_id = pf.id
             JOIN users u ON pf.user_id = u.id
             LEFT JOIN audio_purchases ap ON ap.post_id = p.id AND ap.profile_id = $3
             ORDER BY p.created_at DESC
             LIMIT $1 OFFSET $2;`,
            [limit, offset, req.profile.id]  // $1 = limit, $2 = offset, $3 = current user profile ID
        );

        for (const post of postsResult.rows) {
            const cloudinaryBase = "https://res.cloudinary.com/dkvj3fbg9/video/upload";
            const publicId = extractPublicId(post.audio_upload);

            // 👇 Create 30-second trimmed preview link
            const previewAudioUrl = `${cloudinaryBase}/du_30/beat_uploads/${publicId}.mp3`;

            post.audio_upload = previewAudioUrl;
        }

        // Extract total count from the first row
        const totalPosts = postsResult.rows.length > 0 ? parseInt(postsResult.rows[0].total_count) : 0;
        const totalPages = Math.ceil(totalPosts / limit);

        // Return the posts with pagination info
        return res.status(200).json({
            status: true,
            posts: postsResult.rows,
            pagination: {
                total: totalPosts,
                totalPages,
                currentPage: page,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error("❌ Error getting audio posts:", error);
        res.status(500).json({ status: false, error: error.message });
    }
};
