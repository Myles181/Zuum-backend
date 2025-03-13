require('dotenv').config();
const db = require('../config/db.conf.js');
const { validationResult } = require('express-validator');
// const { transporter } = require('../helpers/transport.js');
const cloudinary = require('cloudinary').v2;
// const ffmpeg = require("fluent-ffmpeg");
const { sendNotification } = require("../helpers/notification.service.js"); // Import sendNotification. To be used for emitting notifications



exports.createVideoPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;

        // 2️⃣ Extract video post details from request
        const { caption, public, location, tagged_people } = req.body;

        let cloud_video_upload;

        // Handle file uploads to Cloudinary
        if (req.files && req.files.video_upload) {
            cloud_video_upload = await cloudinary.uploader.upload(req.files.video_upload.tempFilePath, {
                resource_type: "video",
                folder: "video_uploads",
                format: "mp4",
                transformation: [
                    { width: 1080, height: 720, crop: "limit" },
                    { quality: "auto" },
                ]
            });
        } else {
            return res.status(400).json({ status: false, message: 'No files found' });
        }

        // 3️⃣ Insert into post_video table
        const postResult = await db.query(
            `INSERT INTO post_video 
            (profile_id, caption, public, video_upload, location)
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [profileId, caption, public, cloud_video_upload.secure_url, location]
        );

        // 🔹 Verify tagged_people exist before inserting
        if (tagged_people && Array.isArray(tagged_people) && tagged_people.length > 0) {
            // Get only valid profile IDs that exist
            const validProfiles = await db.query(
                `SELECT id FROM profile WHERE id = ANY($1::int[])`,
                [tagged_people]
            );

            const existingProfileIds = validProfiles.rows.map(row => row.id);

            if (existingProfileIds.length > 0) {
                const values = existingProfileIds.map(taggedId => `(${postId}, ${taggedId})`).join(",");
                
                await db.query(
                    `INSERT INTO post_video_tagged_people (post_id, tagged_person_id) VALUES ${values}`
                );
            }
        }

        console.log(postResult);
        res.status(201).json({ 
            status: true, 
            message: "Video post created successfully!"
        });

    } catch (error) {
        console.error("❌ Error creating video post:", error);
        res.status(500).json({ error: error.message });
    }
};

// const compressVideo = (inputPath, outputPath) => {
//     return new Promise((resolve, reject) => {
//         ffmpeg(inputPath)
//             .videoBitrate("128k") // Adjust bitrate for smaller file
//             .format("mp3")
//             .save(outputPath)
//             .on("end", () => resolve(outputPath))
//             .on("error", (err) => reject(err));
//     });
// };

exports.updateVideoPost = async (req, res) => {
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
        const postExists = await db.query(`SELECT profile_id FROM post_video WHERE id = $1`, [post_id]);
        if (postExists.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }
        // console.log(postExists.profile_id);
        if (postExists.rows[0].profile_id !== profileId) {
            return res.status(404).json({ status: false, message: "You do not have permission" });
        }

        // 2️⃣ Handle file uploads (if provided)
        let cloud_video_upload;

        if (req.files?.video_upload) {
            console.log("Upload Start time: ", Date())
            cloud_video_upload = await cloudinary.uploader.upload(req.files.video_upload.tempFilePath, {
                resource_type: "video",
                folder: "video_uploads",
                format: "mp4",
                transformation: [
                    { width: 1080, height: 720, crop: "limit" },
                    { quality: "auto" },
                ]
            });

            // Store a placeholder value until the webhook updates it
            updateFields.video_upload = cloud_video_upload.secure_url;
        }
        console.log("Upload End time: ", Date())

        // 3️⃣ Prepare dynamic update query
        const videoUpdates = [];
        const videoValues = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updateFields)) {
            if (value) {
                videoUpdates.push(`${key} = $${paramIndex++}`);
                videoValues.push(value);
            }
        }

        if (videoUpdates.length > 0) {
            videoValues.push(post_id);
            await db.query(
                `UPDATE post_video SET ${videoUpdates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
                videoValues
            );
        }

        res.status(200).json({
            status: true,
            message: "Video post updated successfully!"
        });

    } catch (error) {
        console.error("❌ Error updating video post:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteVideoPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const profileId = req.profile.id;
        const { post_id } = req.body;


        // 1️⃣ Check if post exists
        const postExists = await db.query(`SELECT id FROM post_video WHERE id = $1`, [post_id]);
        if (postExists.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }
        if (postExists[0].profile_id !== profileId) {
            return res.status(404).json({ status: false, message: "You do not have permission" });
        }

        // 3️⃣ Delete the comment
        await db.query(
            `DELETE FROM post_video WHERE id = $1`,
            [post_id]
        );

        return res.status(200).json({ status: true, message: "Post deleted successfully!" });

    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};


exports.reactToVideoPost = async (req, res) => {
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
            `SELECT id, likes, unlikes FROM post_video WHERE id = $1`, 
            [post_id]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ 
                status: false, 
                message: "Post not found." 
            });
        }

        const post = postResult.rows[0];
        const postOwnerId = post.user_id;
        let likesCount = post.likes;
        let unlikesCount = post.unlikes;

        // Check if user already reacted
        const reactionResult = await db.query(
            `SELECT id, "like", "unlike" FROM post_video_reactions 
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
                `UPDATE post_video_reactions 
                 SET like = $1, unlike = $2 
                 WHERE post_id = $3 AND post_reacter_id = $4`,
                [like, unlike, post_id, profileId]
            );

            // Update counter based on the change
            if (reaction.like && !like) likesCount--; // Removed like
            if (reaction.unlike && !unlike) unlikesCount--; // Removed unlike
            if (!reaction.like && like) likesCount++; // Added like
            if (!reaction.unlike && unlike) unlikesCount++; // Added unlike

            notificationMessage = like 
                ? `liked your video post.` 
                : `Unliked your video post.`;

        } else {
            // Insert new reaction
            await db.query(
                `INSERT INTO post_video_reactions (post_id, post_reacter_id, "like", "unlike")
                 VALUES ($1, $2, $3, $4)`,
                [post_id, profileId, like, unlike]
            );

            // Update counter for new reaction
            if (like) likesCount++;
            if (unlike) unlikesCount++;

            notificationMessage = like 
            ? `liked your video post.` 
            : `Unliked your video post.`;
        }
        const profilePic = req.profile.image ? req.profile.image : "https://res.cloudinary.com/dlanhtzbw/image/upload/v1675343188/Telegram%20Clone/no-profile_aknbeq.jpg";

        // Update the post counts
        await db.query(
            `UPDATE post_video
             SET likes = $1, unlikes = $2
             WHERE id = $3`,
            [likesCount, unlikesCount, post_id]
        );

          // Send real-time notification to post owner
          if (profileId !== postOwnerId) {
            sendNotification(postOwnerId, notificationMessage, profilePic, "reaction");
        }

        return res.status(hasExistingReaction ? 200 : 201).json({ 
            status: true, 
            message: hasExistingReaction 
                ? "Reaction updated successfully!" 
                : "Reaction added successfully!" 
        });

    } catch (error) {
        console.error("Error in reactToVideoPost:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};


exports.commentToVideoPost = async (req, res) => {
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
            `SELECT id, comments FROM post_video WHERE id = $1`,
            [post_id]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }

        const post = postResult.rows[0];
        let commentCount = post.comments;

        // 3️⃣ Insert the comment
        await db.query(
            `INSERT INTO post_video_comments (post_id, post_commenter_id, comment)
             VALUES ($1, $2, $3)`,
            [post_id, profileId, comment]
        );

        await db.query(
            `UPDATE post_video
            SET comments = $1
            WHERE id = $2`,
            [commentCount+1, post_id]
        );

        return res.status(201).json({ status: true, message: "Comment added successfully!" });

    } catch (error) {
        console.error("Error in commentToVideoPost:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 📝 Update a Comment on an Video Post
exports.updateCommentOnVideoPost = async (req, res) => {
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
            `SELECT id FROM post_video_comments WHERE id = $1 AND post_commenter_id = $2`,
            [comment_id, profileId]
        );

        if (commentResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Comment not found or unauthorized." });
        }

        // 3️⃣ Update the comment
        await db.query(
            `UPDATE post_video_comments SET comment = $1 WHERE id = $2`,
            [new_comment, comment_id]
        );

        return res.status(200).json({ status: true, message: "Comment updated successfully!" });

    } catch (error) {
        console.error("Error updating comment:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 🗑️ Delete a Comment on an Video Post
exports.deleteCommentOnVideoPost = async (req, res) => {
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
            `SELECT id, post_id FROM post_video_comments WHERE id = $1 AND post_commenter_id = $2`,
            [comment_id, profileId]
        );

        if (commentResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Comment not found or unauthorized." });
        }

        const postId = commentResult.rows[0].post_id;

        // Get current comment count
        const postResult = await db.query(
            `SELECT comments FROM post_video WHERE id = $1`,
            [postId]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Associated post not found." });
        }

        const currentCommentCount = postResult.rows[0].comments;

        // Delete the comment
        await db.query(
            `DELETE FROM post_video_comments WHERE id = $1`,
            [comment_id]
        );

        // Update the comment count
        await db.query(
            `UPDATE post_video
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


exports.shareVideoPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const profileId = req.profie.id;

        const { post_id, content } = req.body;

        // 2️⃣ Check if the post exists
        const postExists = await db.query(
            `SELECT id FROM post_video WHERE id = $1`,
            [post_id]
        );

        if (postExists.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post not found." });
        }

        const post = postResult.rows[0];
        let shareCount = post.shares;

        // 3️⃣ Insert the comment
        await db.query(
            `INSERT INTO post_video_share (post_id, post_sharer_id, caption)
             VALUES ($1, $2, $3)`,
            [post_id, profileId, content]
        );

        await db.query(
            `UPDATE post_video
            SET shares = $1
            WHERE id = $2`,
            [shareCount+1, post_id]
        );

        return res.status(201).json({ status: true, message: "Shared successfully!" });

    } catch (error) {
        console.error("Error in shareVideoPost:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 📝 Update a Share on an Video Post
exports.updateSharedVideoPost = async (req, res) => {
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
            `SELECT id FROM post_video_share WHERE id = $1 AND post_sharer_id = $2`,
            [share_id, profileId]
        );

        if (shareResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post share not found or unauthorized." });
        }

        // 3️⃣ Update the comment
        await db.query(
            `UPDATE post_video_share SET content = $1 WHERE id = $2`,
            [content, share_id]
        );

        return res.status(200).json({ status: true, message: "Post share updated successfully!" });

    } catch (error) {
        console.error("Error updating shared post:", error);
        return res.status(500).json({ status: false, error: error.message });
    }
};

// 🗑️ Delete a Share on an Video Post
exports.deleteSharedVideoPost = async (req, res) => {
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
            `SELECT id, post_id FROM post_video_share WHERE id = $1 AND post_sharer_id = $2`,
            [share_id, profileId]
        );

        if (shareResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Post share not found or unauthorized." });
        }
        const postId = shareResult.rows[0].post_id;

        // Get current comment count
        const postResult = await db.query(
            `SELECT shares FROM post_video WHERE id = $1`,
            [postId]
        );

        if (postResult.rowCount === 0) {
            return res.status(404).json({ status: false, message: "Associated post not found." });
        }

        const currentShareCount = postResult.rows[0].shares;

        // 3️⃣ Delete the comment
        await db.query(
            `DELETE FROM post_video_share WHERE id = $1`,
            [share_id]
        );

        await db.query(
            `UPDATE post_video
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


// Get all video posts for the authenticated user
exports.getUserVideoPosts = async (req, res) => {
    try {
        const profileId = req.profile.id; // Fixed typo: req.profie -> req.profile
        
        // Query to get all video posts from this user
        const userPostsResult = await db.query(
            `SELECT * FROM post_video 
            WHERE profile_id = $1
            ORDER BY created_at DESC`,
            [profileId]
        );
        
        if (userPostsResult.rowCount === 0) {
            return res.status(200).json({ 
                status: true, 
                message: "No video posts found for this user",
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
        console.error("❌ Error getting user video posts:", error);
        res.status(500).json({ status: false, error: error.message });
    }
};

// Get a specific video post with all associated data
exports.getVideoPostById = async (req, res) => {
    console.log("Fetching video post by ID");
    try {
        const { postId } = req.params; // Assuming the post ID is passed as a URL parameter
        
        // Query to get the main post with username from users table
        const postResult = await db.query(
            `SELECT p.*, u.username, pr.image AS profile_picture 
             FROM post_video p
             JOIN profile pr ON p.profile_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE p.id = $1`,
            [postId]
        );
        
        if (postResult.rowCount === 0) {
            return res.status(404).json({ 
                status: false, 
                message: "Video post not found" 
            });
        }
        
        const post = postResult.rows[0];

        // Query to get comments with commenter information
        const commentsResult = await db.query(
            `SELECT c.*, u.username, pr.image AS profile_picture 
             FROM post_video_comments c
             JOIN profile pr ON c.post_commenter_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at DESC`,
            [postId]
        );
        
        // Query to get reactions with reactor information
        const reactionsResult = await db.query(
            `SELECT r.*, u.username, pr.image AS profile_picture 
             FROM post_video_reactions r
             JOIN profile pr ON r.post_reacter_id = pr.id
             JOIN users u ON pr.user_id = u.id
             WHERE r.post_id = $1`,
            [postId]
        );
        
        // Query to get shares with sharer information
        const sharesResult = await db.query(
            `SELECT s.*, u.username, pr.image
             FROM post_video_shares s
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
        console.error("❌ Error getting video post details:", error);
        res.status(500).json({ status: false, error: error.message });
    }
};

// Get all video posts with pagination
exports.getVideoPosts = async (req, res) => {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        console.log("")

        // Query to get posts with creator information
        const postsResult = await db.query(
            `SELECT p.*, u.username, pf.image, COUNT(*) OVER() AS total_count
            FROM post_video p
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
        console.error("❌ Error getting video posts:", error);
        res.status(500).json({ status: false, error: error.message });
    }
};