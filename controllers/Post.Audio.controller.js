require('dotenv').config();
const db = require('../config/db.conf.js');
const { validationResult } = require('express-validator');
// const { transporter } = require('../helpers/transport.js');
const cloudinary = require('cloudinary').v2;
const path = require('path');
// const ffmpeg = require("fluent-ffmpeg");


exports.createAudioPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;

        // 2️⃣ Extract audio post details from request
        const { caption, type, boomplay, apple_music, spotify, audiomark, youtube_music } = req.body;

        let cloud_audio_upload, cloud_cover_photo;

        // Handle file uploads to Cloudinary
        if (req.files && req.files.cover_photo && req.files.audio_upload) {

            // Check if the audio upload is a valid MP3 file
            const fileExtension = path.extname(req.files.audio_upload.name).toLowerCase();
            if (fileExtension !== '.mp3') {
                return res.status(406).json({ error: 'Audio file must be in MP3 format' });
            }

            cloud_cover_photo = await cloudinary.uploader.upload(req.files.cover_photo.tempFilePath);
            cloud_audio_upload = await cloudinary.uploader.upload(req.files.audio_upload.tempFilePath, {
                resource_type: "video",
                transformation: [
                    { duration: 30 } // Trim to 30 seconds
                ]
            });
        } else {
            return res.status(400).json({ status: false, message: 'No files found' });
        }

        // 3️⃣ Insert into post_audio table
        const postResult = await db.query(
            `INSERT INTO post_audio 
            (profile_id, caption, type, audio_upload, cover_photo, apple_music, spotify, audiomark, boomplay, youtube_music)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`,
            [profileId, caption, type || 'music', cloud_audio_upload.secure_url, cloud_cover_photo.secure_url, apple_music || '', spotify || '', audiomark || '', boomplay || '', youtube_music || '']
        );

        console.log(postResult);
        res.status(201).json({ 
            status: true, 
            message: "Audio post created successfully!"
        });

    } catch (error) {
        console.error("❌ Error creating audio post:", error);
        res.status(500).json({ error: error.message });
    }
};

// const compressAudio = (inputPath, outputPath) => {
//     return new Promise((resolve, reject) => {
//         ffmpeg(inputPath)
//             .audioBitrate("128k") // Adjust bitrate for smaller file
//             .format("mp3")
//             .save(outputPath)
//             .on("end", () => resolve(outputPath))
//             .on("error", (err) => reject(err));
//     });
// };

exports.updateAudioPost = async (req, res) => {
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
        const postExists = await db.query(`SELECT profile_id FROM post_audio WHERE id = $1`, [post_id]);
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

            // Check if the audio upload is a valid MP3 file
            const fileExtension = path.extname(req.files.audio_upload.name).toLowerCase();
            if (fileExtension !== '.mp3') {
                return res.status(400).json({ error: 'Audio file must be in MP3 format' });
            }

            console.log("Upload Start time: ", Date())
            cloud_audio_upload = await cloudinary.uploader.upload(req.files.audio_upload.tempFilePath, {
                resource_type: "video",
                transformation: [
                    { duration: 30 } // Trim to 30 seconds
                ]
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
                `UPDATE post_audio SET ${audioUpdates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
                audioValues
            );
        }

        res.status(200).json({
            status: true,
            message: "Audio post updated successfully!"
        });

    } catch (error) {
        console.error("❌ Error updating audio post:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAudioPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;
        const { post_id } = req.body;


        // 1️⃣ Check if post exists
        const postExists = await db.query(`SELECT id FROM post_audio WHERE id = $1`, [post_id]);
        if (postExists.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }
        if (postExists[0].profile_id !== profileId) {
            return res.status(404).json({ status: false, message: "You do not have permission" });
        }

        // 3️⃣ Delete the comment
        await db.query(
            `DELETE FROM post_audio WHERE id = $1`,
            [post_id]
        );

        return res.status(200).json({ status: true, message: "Post deleted successfully!" });

    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

exports.reactToAudioPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const profileId = req.profile.id;
        const { post_id, like, unlike } = req.body;

        // Ensure like and unlike aren’t equal
        if (like === unlike) {
            return res.status(400).json({ message: "Like and unlike cannot be equal" });
        }

        // Check if post exists
        const postResult = await db.query(
            `SELECT id, profile_id, likes, unlikes, profile_id FROM post_audio WHERE id = $1`,
            [post_id]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ message: "Post not found" });
        }

        const post = postResult.rows[0];
        let likesCount = post.likes;
        let unlikesCount = post.unlikes;

        // Check existing reaction
        const reactionResult = await db.query(
            `SELECT id, "like", "unlike" FROM post_audio_reactions 
             WHERE post_id = $1 AND post_reacter_id = $2`,
            [post_id, profileId]
        );

        const hasExistingReaction = reactionResult.rowCount > 0;
        let notificationMessage = null;
        let notificationType = "POST_AUDIO";

        // Get the username
        const user = await db.query(`
            SELECT username FROM users
            WHERE id = $1`,
            [req.profile.user_id]
        );

        if (hasExistingReaction) {
            const reaction = reactionResult.rows[0];

            // No change, bail early
            if (reaction.like === like && reaction.unlike === unlike) {
                return res.status(400).json({ message: "Reaction has not changed" });
            }

            // Update reaction
            await db.query(
                `UPDATE post_audio_reactions 
                 SET "like" = $1, "unlike" = $2
                 WHERE post_id = $3 AND post_reacter_id = $4`,
                [like, unlike, post_id, profileId]
            );

            // Adjust counts and set notification
            if (reaction.like && !like) {
                likesCount--;
                if (unlike) notificationMessage =  `${user.rows[0].username} unliked your post`; // Like → Unlike
            } else if (reaction.unlike && !unlike) {
                unlikesCount--;
                if (like) notificationMessage = `${user.rows[0].username} liked your post`; // Unlike → Like
            } else if (!reaction.like && like) {
                likesCount++;
                notificationMessage = `${user.rows[0].username} liked your post`; // Off → Like
            } else if (!reaction.unlike && unlike) {
                unlikesCount++;
                notificationMessage = `${user.rows[0].username} unliked your post`; // Off → Unlike
            }

        } else {
            // New reaction
            await db.query(
                `INSERT INTO post_audio_reactions (post_id, post_reacter_id, "like", "unlike")
                 VALUES ($1, $2, $3, $4)`,
                [post_id, profileId, like, unlike]
            );

            if (like) {
                likesCount++;
                notificationMessage = `${user.rows[0].username} liked your post`;
            } else if (unlike) {
                unlikesCount++;
                notificationMessage = `${user.rows[0].username} unliked your post`;
            }
        }

        // Update post counts
        await db.query(
            `UPDATE post_audio
             SET likes = $1, unlikes = $2
             WHERE id = $3`,
            [likesCount, unlikesCount, post_id]
        );

        // Send notification if there’s a change worth notifying
        if (notificationMessage) {
            await db.query(
                `INSERT INTO notifications (user_id, message, type, action_user_id, action_user_image, post_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [post.profile_id, notificationMessage, notificationType, profileId, req.profile.image, post_id]
            );
        }

        return res.status(hasExistingReaction ? 200 : 201).json({
            message: hasExistingReaction
                ? "Reaction updated successfully"
                : "Reaction added successfully"
        });

    } catch (error) {
        console.error("Error in reactToAudioPost:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.commentToAudioPost = async (req, res) => {
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
            `SELECT id, comments, profile_id FROM post_audio WHERE id = $1`,
            [post_id]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }

        const post = postResult.rows[0];
        let commentCount = post.comments;

        // 3️⃣ Insert the comment
        await db.query(
            `INSERT INTO post_audio_comments (post_id, post_commenter_id, comment) 
             VALUES ($1, $2, $3)`,
            [post_id, profileId, comment]
        );

        await db.query(
            `UPDATE post_audio
            SET comments = $1
            WHERE id = $2`,
            [commentCount+1, post_id]
        );

        // Get the username
        const user = await db.query(`
            SELECT username FROM users
            WHERE id = $1`,
            [req.profile.user_id]
        );

        await db.query(`
            INSERT INTO notifications (user_id, message, type, action_user_id, action_user_image, post_id)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [postResult.rows[0].profile_id, `${user.rows[0].username} commented on your post`, "POST_AUDIO", profileId, req.profile.image, post_id]
        );

        return res.status(201).json({ status: true, message: "Comment added successfully!" });

    } catch (error) {
        console.error("Error in commentToAudioPost:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 📝 Update a Comment on an Audio Post
exports.updateCommentOnAudioPost = async (req, res) => {
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
            `SELECT id FROM post_audio_comments WHERE id = $1 AND post_commenter_id = $2`,
            [comment_id, profileId]
        );

        if (commentResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Comment not found or unauthorized." });
        }

        // 3️⃣ Update the comment
        await db.query(
            `UPDATE post_audio_comments SET comment = $1 WHERE id = $2`,
            [new_comment, comment_id]
        );

        return res.status(200).json({ status: true, message: "Comment updated successfully!" });

    } catch (error) {
        console.error("Error updating comment:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 🗑️ Delete a Comment on an Audio Post
exports.deleteCommentOnAudioPost = async (req, res) => {
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
            `SELECT id, post_id FROM post_audio_comments WHERE id = $1 AND post_commenter_id = $2`,
            [comment_id, profileId]
        );

        if (commentResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Comment not found or unauthorized." });
        }

        const postId = commentResult.rows[0].post_id;

        // Get current comment count
        const postResult = await db.query(
            `SELECT comments FROM post_audio WHERE id = $1`,
            [postId]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Associated post not found." });
        }

        const currentCommentCount = postResult.rows[0].comments;

        // Delete the comment
        await db.query(
            `DELETE FROM post_audio_comments WHERE id = $1`,
            [comment_id]
        );

        // Update the comment count
        await db.query(
            `UPDATE post_audio
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

exports.shareAudioPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const profileId = req.profile.id;

        const { post_id, content } = req.body;

        // 2️⃣ Check if the post exists
        const postExists = await db.query(
            `SELECT id, profile_id FROM post_audio WHERE id = $1`,
            [post_id]
        );

        if (postExists.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }

        const post = postExists.rows[0];
        let shareCount = post.shares || 0;

        // Check if share exist
        const shareExists = await db.query(
            `SELECT id FROM post_audio_share
             WHERE post_sharer_id = $1`,
            [profileId]
        );

        if (shareExists.rowCount > 0) return res.status(406).json({ staus: false, message: "You have already shared this post" })

        // 3️⃣ Insert the comment
        await db.query(
            `INSERT INTO post_audio_share (post_id, post_sharer_id, caption)
             VALUES ($1, $2, $3)`,
            [post_id, profileId, content]
        );

        await db.query(
            `UPDATE post_audio
            SET shares = $1
            WHERE id = $2`,
            [shareCount+1, post_id]
        );

        // Get the username
        const user = await db.query(`
            SELECT username FROM users
            WHERE id = $1`,
            [req.profile.user_id]
        );

        await db.query(`
            INSERT INTO notifications (user_id, message, type, action_user_id, action_user_image, post_id)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [postExists.rows[0].profile_id, `${user.rows[0].username} shared your post`, "POST_AUDIO", profileId, req.profile.image, post_id]
        );

        return res.status(201).json({ status: true, message: "Shared successfully!" });

    } catch (error) {
        console.error("Error in shareAudioPost:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 📝 Update a Share on an Audio Post
exports.updateSharedAudioPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const profileId = req.profile.id;
        const { share_id, content } = req.body;

        // 2️⃣ Check if the comment exists and belongs to the user
        const shareResult = await db.query(
            `SELECT id FROM post_audio_share WHERE id = $1 AND post_sharer_id = $2`,
            [share_id, profileId]
        );

        if (shareResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post share not found or unauthorized." });
        }

        // 3️⃣ Update the comment
        await db.query(
            `UPDATE post_audio_share SET caption = $1 WHERE id = $2`,
            [content, share_id]
        );

        return res.status(200).json({ status: true, message: "Post share updated successfully!" });

    } catch (error) {
        console.error("Error updating shared post:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 🗑️ Delete a Share on an Audio Post
exports.deleteSharedAudioPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const profileId = req.profile.id;
        const { share_id } = req.body;

        // 2️⃣ Check if the post share exists and belongs to the user
        const shareResult = await db.query(
            `SELECT id, post_id FROM post_audio_share WHERE id = $1 AND post_sharer_id = $2`,
            [share_id, profileId]
        );

        if (shareResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post share not found or unauthorized." });
        }
        const postId = shareResult.rows[0].post_id;

        // Get current comment count
        const postResult = await db.query(
            `SELECT shares FROM post_audio WHERE id = $1`,
            [postId]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Associated post not found." });
        }

        const currentShareCount = postResult.rows[0].shares;

        // 3️⃣ Delete the comment
        await db.query(
            `DELETE FROM post_audio_share WHERE id = $1`,
            [share_id]
        );

        await db.query(
            `UPDATE post_audio
            SET shares = $1
            WHERE id = $2`,
            [currentShareCount-1, postId]
        );

        return res.status(200).json({ status: true, message: "Post share deleted successfully!" });

    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// Get all audio posts for the authenticated user
exports.getUserAudioPosts = async (req, res) => {
    try {
        const profileId = req.profile.id; // Fixed typo: req.profie -> req.profile
        
        // Query to get all audio posts from this user
        const userPostsResult = await db.query(
            `SELECT * FROM post_audio 
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
exports.getAudioPostById = async (req, res) => {
    console.log("Fetching audio post by ID");
    try {
        const { postId } = req.params; // Assuming the post ID is passed as a URL parameter
        
        // Query to get the main post with username from users table
        const postResult = await db.query(
            `SELECT p.*, u.username, pr.image AS profile_picture 
             FROM post_audio p
             JOIN profile pr ON p.profile_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE p.id = $1`,
            [postId]
        );
        
        if (postResult.rowCount === 0) {
            return res.status(404).json({ 
                status: false, 
                message: "Audio post not found" 
            });
        }
        
        const post = postResult.rows[0];

        // Query to get comments with commenter information
        const commentsResult = await db.query(
            `SELECT c.*, u.username, pr.image AS profile_picture 
             FROM post_audio_comments c
             JOIN profile pr ON c.post_commenter_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at DESC`,
            [postId]
        );
        
        // Query to get reactions with reactor information
        const reactionsResult = await db.query(
            `SELECT r.*, u.username, pr.image AS profile_picture 
             FROM post_audio_reactions r
             JOIN profile pr ON r.post_reacter_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE r.post_id = $1`,
            [postId]
        );
        
        // Query to get shares with sharer information
        const sharesResult = await db.query(
            `SELECT s.*, u.username, pr.image
             FROM post_audio_share s
             JOIN profile pr ON s.post_sharer_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE s.post_id = $1
             ORDER BY s.created_at DESC`,
            [postId]
        );
        
        // Combine all data
        const postWithDetails = {
            ...post,
            comments: commentsResult.rows,
            reactions: reactionsResult.rows,
            shares: sharesResult.rows
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
exports.getAudioPosts = async (req, res) => {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        console.log("")

        // Query to get posts with creator information
        const postsResult = await db.query(
            `SELECT p.*, u.username, pf.image, COUNT(*) OVER() AS total_count
            FROM post_audio p
            JOIN profile pf ON p.profile_id = pf.id
            JOIN users u ON pf.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT $1 OFFSET $2;`,
            [limit, offset]
        );

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

exports.promoteAudioPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { amount,  } = req.body;
    } catch (error) {
        console.error("❌ Error :", error);
        res.status(500).json({ status: false, error: error.message });
    }
}
