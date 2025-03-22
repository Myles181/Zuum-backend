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
                p.followers,
                p.created_at,
                u.username,
                u.email,
                u.phone_number,
                u.identity,
                u.email_verified,
                u.is_admin,
                u.deactivated
            FROM profile p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1
            `,
            [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

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
            SELECT id, followers FROM profile
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

            await db.query(`
                UPDATE profile
                SET followers = $1
                WHERE id = $2`,
                [updatedFollowers, profileId]
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
            await db.query(`
                UPDATE profile
                SET followers = $1
                WHERE id = $2`,
                [followedProfile.rows[0].followers + 1, profileId]
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
