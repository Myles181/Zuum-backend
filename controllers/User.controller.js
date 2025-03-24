require('dotenv').config();
const db = require('../config/db.conf.js');
const { validationResult } = require('express-validator');
const { transporter } = require('../helpers/transport.js');
const { generateOtp, saveOtp } = require("../utils/otp-utils.js");
const cloudinary = require('cloudinary').v2;


exports.getProfile = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT 
                p.id,
                p.image,
                p.cover_image,
                p.bio,
                COALESCE(p.followers, 0) AS followers,
                COALESCE(p.following, 0) AS following,
                p.created_at,
                u.username,
                u.email,
                u.phone_number,
                u.identity,
                u.email_verified,
                u.is_admin,
                COALESCE(
                    (SELECT array_agg(follower_id)
                     FROM follow 
                     WHERE following_id = p.id AND active = true),
                    ARRAY[]::INTEGER[]
                ) AS followers_list,
                COALESCE(
                    (SELECT array_agg(following_id)
                     FROM follow 
                     WHERE follower_id = p.id AND active = true),
                    ARRAY[]::INTEGER[]
                ) AS following_list
            FROM profile p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = $1 AND u.deactivated = false
            `,
            [req.profile.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getProfileById = async (req, res) => {
    try {
        const profile_id = req.params.id; // Switch to URL param

        if (!profile_id) {
            return res.status(400).json({ error: "Profile ID is required" });
        }

        const result = await db.query(
            `
            SELECT 
                p.id,
                p.image,
                p.cover_image,
                p.bio,
                COALESCE(p.followers, 0) AS followers,
                COALESCE(p.following, 0) AS following,
                p.created_at,
                u.username,
                u.email,
                u.phone_number,
                u.identity,
                u.email_verified,
                COALESCE(
                    (SELECT array_agg(follower_id)
                     FROM follow 
                     WHERE following_id = p.id AND active = true),
                    ARRAY[]::INTEGER[]
                ) AS followers_list,
                COALESCE(
                    (SELECT array_agg(following_id)
                     FROM follow 
                     WHERE follower_id = p.id AND active = true),
                    ARRAY[]::INTEGER[]
                ) AS following_list
            FROM profile p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = $1 AND u.deactivated = false
            `,
            [profile_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.status(200).json({ data: result.rows[0] });

    } catch (error) {
        console.error("Error in getProfileById:", error); // Log for debugging
        res.status(500).json({ error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, phone_number, bio } = req.body;
        const userId = req.user.id;
        let imageUrl, coverImageUrl;
        let emailVerificationSent = false;

        console.log(req.body);

        // Handle file uploads to Cloudinary
        if (req.files && req.files.image) {
            console.log("I got here");
            const imageResult = await cloudinary.uploader.upload(req.files.image.tempFilePath);
            imageUrl = imageResult.secure_url;
        }
        if (req.files && req.files.cover_image) {
            const coverImageResult = await cloudinary.uploader.upload(req.files.cover_image.tempFilePath);
            coverImageUrl = coverImageResult.secure_url;
        }

        // Update users table if any user fields are provided
        if (username || email || phone_number) {
            const userUpdates = [];
            const userValues = [];
            let paramIndex = 1;

            if (username) {
                userUpdates.push(`username = $${paramIndex++}`);
                userValues.push(username);
            }
            if (email) {
                userUpdates.push(`email = $${paramIndex++}`);
                userValues.push(email);
                userUpdates.push(`email_verified = $${paramIndex++}`);
                userValues.push(false);
            }
            if (phone_number) {
                userUpdates.push(`phone_number = $${paramIndex++}`);
                userValues.push(phone_number);
            }

            userValues.push(userId);
            await db.query(
                `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${paramIndex}`,
                userValues
            );

            // Send email verification if email changed
            if (email) {
                const otp = generateOtp();
                await saveOtp(email, otp);

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Verify Your New Email',
                    text: `Your verification code is: ${otp}.  It will expire in 15 minutes`,
                });
                emailVerificationSent = true;
            }
        }

        // Update profile table if any profile fields are provided
        if (imageUrl || coverImageUrl || bio) {
            const profileUpdates = [];
            const profileValues = [];
            let paramIndex = 1;

            if (imageUrl) {
                profileUpdates.push(`image = $${paramIndex++}`);
                profileValues.push(imageUrl);
            }
            if (coverImageUrl) {
                profileUpdates.push(`cover_image = $${paramIndex++}`);
                profileValues.push(coverImageUrl);
            }
            if (bio) {
                profileUpdates.push(`bio = $${paramIndex++}`);
                profileValues.push(bio);
            }

            profileValues.push(userId);
            const profileResult = await db.query(
                `UPDATE profile SET ${profileUpdates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
                profileValues
            );

            if (profileResult.rows.length === 0) {
                return res.status(404).json({
                    status: false,
                    error: 'Profile not found',
                });
            }
        }

        await db.query('COMMIT');
        res.status(200).json({
            status: true,
            message: 'Profile updated successfully',
            emailVerificationSent,
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};


exports.deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            "UPDATE users SET deleted = true WHERE id = $1 AND deleted = false RETURNING *",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: false,
                error: "Profile not found or already deleted",
            });
        }

        res.status(200).json({
            status: true,
            message: "Profile deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};

exports.followProfile = async (req, res) => {
    try {
        const profile_id = req.profile.id;
        const { profileId, follow } = req.body;

        console.log(req.profile.id);

        // CHECK IF USER IS TRYING TO FOLLOW HIM SELF
        if (profileId === profile_id) return res.status(406).json({ message: 'You cannot follow yourself' });

        // CHECK IF THE PROFILE EXISTS
        const followedProfile = await db.query(`
            SELECT id, followers, following FROM profile
            WHERE id = $1`,
            [profileId]
        );

        if (followedProfile.rows.length === 0) {
            return res.status(404).json({ message: 'Profile ID does not exist' });
        }

        // CHECK IF THE USER HAS FOLLOWED BEFORE
        const followExists = await db.query(`
            SELECT * FROM follow
            WHERE follower_id = $1 AND following_id = $2`,
            [profile_id, profileId]
        );

        if (followExists.rows.length > 0) {
            // IF THE USER TRIES TO FOLLOW AN ALREADY FOLLOWED ACCOUNT AND VICE VERSA
            if (followExists.rows[0].active === follow) {
                return res.status(401).json({ message: 'No changes made' });
            }

            // UPDATE THE FOLLOW TABLE
            await db.query(`
                UPDATE follow
                SET active = $1
                WHERE id = $2`,
                [follow, followExists.rows[0].id]
            );

            // UPDATE FOLLOWERS COUNT
            const updatedFollowers = follow ? followedProfile.rows[0].followers + 1 : followedProfile.rows[0].followers - 1;
            const updatedFollowing = follow ? req.profile.following + 1 : req.profile.following - 1;

            // Update the followed profile followers count
            await db.query(`
                UPDATE profile
                SET followers = $1
                WHERE id = $2`,
                [updatedFollowers, profileId]
            );

            // Update the user following count
            await db.query(`
                UPDATE profile
                SET following = $1
                WHERE id = $2`,
                [updatedFollowing, profile_id]
            );

            // Get the username
            const user = await db.query(`
                SELECT username FROM users
                WHERE id = $1`,
                [req.profile.user_id]
            );

            // Update the notifcations
            const notificationMessage = follow
                ? `${user.rows[0].username} follows you`
                : `${user.rows[0].username} unfollowed you`;
            const notificationType = follow ? "FOLLOW" : "UNFOLLOW";

            await db.query(`
                INSERT INTO notifications (user_id, message, type, action_user_id, action_user_image)
                VALUES ($1, $2, $3, $4, $5)`,
                [profileId, notificationMessage, notificationType, profile_id, req.profile.image]
            );

        } else {
            // IF THE USER TRIED TO UNFOLLOW AN ACCOUNT THEY HAVEN'T FOLLOWED
            if (!follow) {
                return res.status(200).json({ message: 'You have not followed this account' });
            }

            // STORE THE FOLLOW HISTORY
            await db.query(`
                INSERT INTO follow (follower_id, following_id, active)
                VALUES ($1, $2, $3)`,
                [profile_id, profileId, true]
            );

            // UPDATE FOLLOWERS COUNT
            await db.query(
                `UPDATE profile 
                 SET followers = followers + 1 
                 WHERE id = $1`,
                [profileId]
            );

            await db.query(
                `UPDATE profile 
                 SET following = following + 1 
                 WHERE id = $1`,
                [profile_id]
            );

            // Get the username
            const user = await db.query(`
                SELECT username FROM users
                WHERE id = $1`,
                [req.profile.user_id]
            );

            // STORE FOLLOW NOTIFICATION
            await db.query(`
                INSERT INTO notifications (user_id, message, type, action_user_id, action_user_image)
                VALUES ($1, $2, $3, $4, $5)`,
                [profileId, `${user.rows[0].username} follows you`, "FOLLOW", profile_id, req.profile.image]
            );
        }

        return res.status(200).json({ message: 'Follow action successful' });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};

exports.getRoomId = async (req, res) => {
    const { profileId_1, profileId_2 } = req.body;
    try {
        let room, roomId;

        // Check if the profile id is available
        if (!profileId_1 || !profileId_2) return res.status(400).json({ message: 'Profile Ids missing' });

        // Check if the profile id exist
        const profile1Exists = await db.query(`
            SELECT id FROM profile
            WHERE id = $1`,
            [profileId_1]
        );
        if (profile1Exists.rowCount === 0) return res.status(404).json({ message: 'Profile1 not found' });

        const profile2Exists = await db.query(`
            SELECT id FROM profile
            WHERE id = $1`,
            [profileId_2]
        );

        if (profile2Exists.rowCount === 0) return res.status(404).json({ message: 'Profile2 not found' });

        // Check if roomId already exist
        room = await db.query(`
            SELECT * FROM rooms
            WHERE profileId_1 = $1 AND profileId_2 = $2`,
            [profileId_1, profileId_2]
        );

        // Check both ways
        if (room.rowCount === 0) {
            room = await db.query(`
                SELECT * FROM rooms
                WHERE profileId_1 = $1 AND profileId_2 = $2`,
                [profileId_2, profileId_1]
            );
        }
        if (room.rowCount > 0) return res.status(200).json({ room_id: room.rows[0].room_id });

        // generate room id
        while (true) {
            roomId = generateOtp();

            let result = await db.query(`
                SELECT room_id FROM rooms
                WHERE room_id = $1`,
                [roomId]
            );
            console.log("Room Id: ", roomId);
            console.log("Result: ", result.rowCount);
            if (result.rowCount === 0) break;
        }

        // Save the roomId
        await db.query(`
            INSERT INTO rooms (profileId_1, profileId_2, room_id)
            VALUES ($1, $2, $3)`,
            [profileId_1, profileId_2, roomId]
        );

        return res.status(200).json({ room_id: roomId });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};

exports.getMessages = async (req, res) => {
    return;
};


