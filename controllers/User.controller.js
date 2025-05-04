require('dotenv').config();
const db = require('../config/db.conf.js');
const { validationResult } = require('express-validator');
const { transporter } = require('../helpers/transport.js');
const { createVirtualAccount } = require('../helpers/createVirtualAccount.js');
const { generateOtp, saveOtp } = require("../utils/otp-utils.js");
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');


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
                p.subscription_status,
                p.created_at,
                u.username,
                u.firstname,
                u.lastname,
                u.middlename,
                u.email,
                u.phonenumber,
                u.identity,
                u.email_verified,
                u.is_admin,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', follower_p.id,
                            'username', follower_u.username,
                            'image', follower_p.image
                        )
                    )
                    FROM follow f
                    LEFT JOIN profile follower_p ON f.follower_id = follower_p.id
                    LEFT JOIN users follower_u ON follower_p.user_id = follower_u.id
                    WHERE f.following_id = p.id AND f.active = true AND follower_u.deactivated = false),
                    '[]'::json
                ) AS followers_list,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', following_p.id,
                            'username', following_u.username,
                            'image', following_p.image
                        )
                    )
                    FROM follow f
                    LEFT JOIN profile following_p ON f.following_id = following_p.id
                    LEFT JOIN users following_u ON following_p.user_id = following_u.id
                    WHERE f.follower_id = p.id AND f.active = true AND following_u.deactivated = false),
                    '[]'::json
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
                u.firstname,
                u.lastname,
                u.middlename,
                u.email,
                u.phonenumber,
                u.identity,
                u.email_verified,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', follower_p.id,
                            'username', follower_u.username,
                            'image', follower_p.image
                        )
                    )
                    FROM follow f
                    LEFT JOIN profile follower_p ON f.follower_id = follower_p.id
                    LEFT JOIN users follower_u ON follower_p.user_id = follower_u.id
                    WHERE f.following_id = p.id AND f.active = true AND follower_u.deactivated = false),
                    '[]'::json
                ) AS followers_list,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', following_p.id,
                            'username', following_u.username,
                            'image', following_p.image
                        )
                    )
                    FROM follow f
                    LEFT JOIN profile following_p ON f.following_id = following_p.id
                    LEFT JOIN users following_u ON following_p.user_id = following_u.id
                    WHERE f.follower_id = p.id AND f.active = true AND following_u.deactivated = false),
                    '[]'::json
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
        const { firstname, lastname, middlename, username, email, phonenumber, bio } = req.body;
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
        if (username || email || phonenumber || firstname || middlename || lastname) {
            const userUpdates = [];
            const userValues = [];
            let paramIndex = 1;

            if (username) {
                userUpdates.push(`username = $${paramIndex++}`);
                userValues.push(username);
            }
            if (firstname) {
                userUpdates.push(`firstname = $${paramIndex++}`);
                userValues.push(firstname);
            }
            if (lastname) {
                userUpdates.push(`lastname = $${paramIndex++}`);
                userValues.push(lastname);
            }
            if (middlename) {
                userUpdates.push(`middlename = $${paramIndex++}`);
                userValues.push(middlename);
            }
            if (email) {
                userUpdates.push(`email = $${paramIndex++}`);
                userValues.push(email);
                userUpdates.push(`email_verified = $${paramIndex++}`);
                userValues.push(false);
            }
            if (phonenumber) {
                userUpdates.push(`phonenumber = $${paramIndex++}`);
                userValues.push(phonenumber);
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

// controllers/userController.js
exports.getChatRooms = async (req, res) => {
    const userId = req.profile.id; // Logged-in user’s ID from auth middleware

    try {
        // Fetch all rooms where userId is profileId_1 or profileId_2
        const roomsResult = await db.query(
            `SELECT room_id, profileId_1, profileId_2 
             FROM rooms 
             WHERE profileId_1 = $1 OR profileId_2 = $1`,
            [userId]
        );

        // Validate: No rooms found
        if (roomsResult.rowCount === 0) {
            console.log(`No chat rooms found for user ${userId}`);
            return res.status(200).json([]);
        }

        console.log(roomsResult.rows);

        // Shape the response
        const rooms = await Promise.all(
            roomsResult.rows.map(async (row) => {
              const recipient_id = row.profileid_1 === userId ? row.profileid_2 : row.profileid_1;
              const recipient_profile = await db.query(`
                SELECT u.username, p.image
                FROM profile p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.id = $1 AND u.deactivated = false
              `, [recipient_id]); // Pass recipient_id as a parameter
              console.log("Recipient Id: ", recipient_id);
              console.log("Recipient Profile: ", recipient_profile.rows[0]);
              return {
                room_id: row.room_id,
                user_id: userId,
                recipient_profile_image: recipient_profile.rows[0].image,
                recipient_profile_username: recipient_profile.rows[0].username,
                recipient_id,
              };
            })
          );

          console.log(rooms);

        // Send response
        console.log(`Fetched ${rooms.length} chat rooms for user ${userId}`);
        return res.status(200).json(rooms);

    } catch (error) {
        console.error(`Error fetching chat rooms for user ${userId}:`, error);
        return res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
};

exports.CreateVirtualAccount = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array()[0].msg });
    }

    const user = req.user;

    // GET PROFILE
    const profile = await db.query(`
        SELECT id FROM profile
        WHERE user_id = $1`,
        [user.id]
    );

    if (!profile.rowCount === 0) return res.status(404).json({ message: 'Profile does not exist' });

    try {

        // If any of the fields are empty send an error
        if (!user.firstname) return res.status(406).json({ message: 'Firstname field is empty' });
        if (!user.lastname) return res.status(406).json({ message: 'Lastname field is empty' });
        if (!user.middlename) return res.status(406).json({ message: 'Middlename field is empty' });
        if (!user.phonenumber) return res.status(406).json({ message: 'Phonenumber field is empty' });

        // Get the payment plan
        const paymentPlan = await db.query(`
            SELECT * FROM payment_plans
            WHERE name = $1`,
            [user.identity]
        );

        console.log(process.env.BVN);

        // Create the virtual account
        const virtualAccount = await createVirtualAccount(
            email=user.email,
            tx_ref=`fluxel-${user.id}-${Date.now()}`,
            phonenumber=user.phonenumber,
            firstname=user.firstname,
            lastname=user.lastname,
            bvn=process.env.BVN,
            amount=paymentPlan.rows[0].amount,
        );

        await db.query(`
            INSERT INTO virtual_accounts (profile_id, order_ref, flw_ref, bank_name, account_number, expiry_date, amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [profile.rows[0].id, virtualAccount.data.order_ref, virtualAccount.data.flw_ref,
            virtualAccount.data.bank_name, virtualAccount.data.account_number, virtualAccount.data.expiry_date, parseFloat(virtualAccount.data.amount)]
        );

        return res.status(200).json({ message: 'Virtual account created successfully',
            virtual_account: {
                bank_name: virtualAccount.data.bank_name,
                account_number: virtualAccount.data.account_number,
                expiry_date: virtualAccount.data.expiry_date,
                amount: virtualAccount.data.amount,
            }
        });

    } catch (error) {
        console.log("Error creating virtual account: ", error.message);
        return res.status(500).json({ error: error.message });
    }
};

exports.GetVirtualAccount = async (req, res) => {
    const profile = req.profile;

    try {
        // Get virtual account
        const virtual_accounts = await db.query(`
            SELECT * FROM virtual_accounts
            WHERE profile_id = $1`,
            [profile.id]
        );

        if (virtual_accounts.rowCount === 0) return res.status(404).json({ message: 'No virtual account found' });

        return res.status(200).json({ message: 'Retreived successfully', virtual_account: virtual_accounts.rows[0] });
    } catch (error) {
        console.log("Error message: ", error.message);
        return res.status(500).json({ message: error.message });
    }
};

exports.addUsersToLabel = async (req, res) => {
    const { member_id, invitation_message } = req.body;
    const profile = req.profile;
    let label_id;

    try {
        // Check if the member exist
        const userExist = await db.query(`
            SELECT id FROM profile WHERE id = $
            `, [member_id]
        );

        if (userExist.rowCount === 0) return res.status(404).json({ message: 'User does not exist' });

        // INVITE
        const memberExists = await db.query(`
            SELECT * FROM label WHERE member_id = $1 AND owner_id = $2`,
            [member_id, profile.id]
        );

        if (memberExists.rowCount === 0) {
            // Invite or add the user to label
            label_id = await db.query(`
                INSERT INTO label (owner_id, member_id, invitation_message)
                VALUES ($1, $2, $3) RETURNING id`, [profile.id, member_id, invitation_message]
            );
        } else if (memberExists.rows.status === 'pending'){
            // Return statement that user hasn't accepted
            return res.status(406).json({ message: 'Pending invitation' });
        } else if (memberExists.rows.status === 'ex-member') {
            // Re-invite the ex-member
            label_id = await db.query(`
                UPDATE label
                SET status = 'pending' WHERE member_id = $1
                RETURNING id`, [member_id]
            );
        } else if (memberExists.rows.status === 'active') {
            // Return statement that user is already a member
            return res.status(406).json({ message: 'User is already a member' });
        } else if (memberExists.rows.status === 'decline') {
            const declinedAt = new Date(memberExists.rows[0].updated_at);  // assuming 'updated_at' is available
            const now = new Date();
            const thirtyDaysLater = new Date(declinedAt);
            thirtyDaysLater.setDate(declinedAt.getDate() + 30);

            if (now < thirtyDaysLater) {
                return res.status(406).json({
                    message: `User declined the invitation. You can send a new invite after ${thirtyDaysLater.toDateString()}.`
                });
            } else {
                label_id = await db.query(`
                    UPDATE label
                    SET status = 'pending' WHERE member_id = $1
                    RETURNING id`, [member_id]
                );
            }
        }

        // Email the user of member and add push notification
        // Read the label.html template dynamically
        const emailTemplatePath = path.join(__dirname, 'templates/label.html');
        fs.readFile(emailTemplatePath, 'utf8', (err, htmlContent) => {
            if (err) {
                console.error('Error reading email template:', err);
                return res.status(500).json({ error: 'Error generating email content.' });
            }

            // Read the label.html template dynamically (LABEL_NAME, INVITATION_MESSAGE, INVITATION_LINK, CURRENT_YEAR)
            const updatedHtml = htmlContent
                .replace('{{LABEL_NAME}}', userExist.rows.label_name)
                .replace('{{INVITATION_LINK}}', `${process.env.FRONTEND_URL}/${label_id}/label_invitation`)
                .replace('{{INVITATION_MESSAGE}}', invitation_message)
                .replace('{{CURRENT_YEAR}}', new Date().getFullYear());

            // Send OTP via Email with the updated template
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Label Invitation",
                html: updatedHtml,  // Use the updated HTML template
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ error: 'Error sending email.' });
                } else {
                    console.log('Email sent:', info.response);
                }
            });
        });

        return res.status(200).json({ message: 'Request sent successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    };
};

exports.getLabelMembers = async (req, res) => {
    const profile = req.profile;

    try {
        const user = await db.query(`
            SELECT identity FROM users WHERE id = $1`,
            [profile.user_id]
        );
        if (user.rows.identity !== 'record_label') return res.status(401).json({ message: 'Unauthorized' });

        // Get label members
        const labelMembers = await db.query(`
            SELECT * FROM label
            WHERE owner_id = $1 AND status = 'active'`,
            [profile.id]
        );

        if (labelMembers.rowCount === 0) return res.status(200).json({ message: 'No label members found', label_members: [] });

        return res.status(200).json({ message: 'Label members retrieved successfully', label_members: labelMembers.rows });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    };
};

exports.acceptLabelRequest = async (req, res) => {
    const { label_id, accept } = req.body;
    const profile = req.profile;

    try {
        // Check if label request exists and belongs to this user
        const labelRequest = await db.query(`
            SELECT * FROM label WHERE id = $1 AND member_id = $2 AND status = 'pending'
        `, [label_id, profile.id]);

        if (labelRequest.rowCount === 0) {
            return res.status(404).json({ message: 'Label invitation not found or not authorized' });
        }

        // Determine new status
        const status = accept === true ? 'active' : 'decline';

        // Update the label request
        await db.query(`
            UPDATE label
            SET status = $1, updated_at = NOW()
            WHERE id = $2
        `, [status, label_id]
        );

        const message = accept ? 'Label invitation accepted successfully' : 'Label invitation declined successfully';

        return res.status(200).json({ message });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.getUserLabels = async (req, res) => {
    const profile = req.profile;

    try {
        // Get user labels
        const userLabels = await db.query(`
            SELECT * FROM label
            WHERE member_id = $1 AND status = 'active'`,
            [profile.id]
        );

        if (userLabels.rowCount === 0) return res.status(200).json({ message: 'No labels found', labels: [] });

        return res.status(200).json({ message: 'Labels retrieved successfully', labels: userLabels.rows });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    };
}

exports.RequestDistribution = async (req, res) => {
    const { description, caption, genre } = req.body;
    let {  social_links } = req.body; // social_links is expected to be a JSON string
    const profile = req.profile;

    try {
        // Validate fields
        social_links = JSON.parse(social_links); // Parse social_links from string to object
        if (!caption || !description || !genre || !social_links || typeof social_links !== 'object') {
            return res.status(400).json({ message: 'Required fields missing or invalid social_links format' });
        }

        const user = await db.query(`SELECT identity FROM users WHERE id = $1`, [profile.user_id]);

        const activeLinks = Object.values(social_links).filter(link => link && link.trim() !== '');
        const finalAmount = activeLinks.length * 15000;

        // Ensure audio file is valid
        if (!req.files || !req.files.audio_upload || !req.files.cover_photo) {
            return res.status(400).json({ message: 'Audio upload and cover photo are required' });
        }

        const fileExtension = path.extname(req.files.audio_upload.name).toLowerCase();
        if (fileExtension !== '.mp3') {
            return res.status(406).json({ error: 'Audio file must be in MP3 format' });
        }

        // Handle payment (except dev)
        if (user.rows[0].identity !== 'dev') {
            if (profile.balance < finalAmount) {
                return res.status(409).json({ message: 'Insufficient funds' });
            }

            await db.query(
                `UPDATE profile SET balance = balance - $1 WHERE id = $2`,
                [finalAmount, profile.id]
            );
        }

        // Upload files to Cloudinary
        const cloud_cover_photo = await cloudinary.uploader.upload(req.files.cover_photo.tempFilePath);
        const cloud_audio_upload = await cloudinary.uploader.upload(req.files.audio_upload.tempFilePath, {
            resource_type: "video",
            folder: "distribution_uploads",
            format: "mp3",
            chunk_size: 10000000,
        });

        // Save request
        await db.query(`
            INSERT INTO distribution_requests 
            (profile_id, caption, description, audio_upload, cover_photo, amount, paid, social_links)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                profile.id,
                caption,
                description,
                cloud_audio_upload.secure_url,
                cloud_cover_photo.secure_url,
                finalAmount,
                true,
                JSON.stringify(social_links)
            ]
        );

        return res.status(200).json({
            message: 'Music Distribution request successful',
            charge: finalAmount,
            links_used: activeLinks.length,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};


exports.getDistributionRequests = async (req, res) => {
    const profile = req.profile;

    const results = await db.query(`
        SELECT * FROM distribution_requests
        WHERE profile_id = $1`, [profile.id]
    );

    if (results.rowCount === 0) return res.status(200).json({ message: 'No distribution requests found', results: [] });
    return res.status(200).json({ message: 'Distribution requests found', results: results.rows });
};

exports.editDistributionRequest = async (req, res) => {
    const { description, caption, genre, social_links } = req.body;
    const profile = req.profile;
    const { request_id } = req.params;

    try {
        // Fetch the existing distribution request
        const result = await db.query(
            `SELECT * FROM distribution_requests WHERE id = $1 AND profile_id = $2`,
            [request_id, profile.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Distribution request not found' });
        }

        const existingRequest = result.rows[0];
        const existingLinks = existingRequest.social_links;

        // Validate social_links
        if (social_links) {
            if (typeof social_links !== 'object' || Array.isArray(social_links)) {
                return res.status(400).json({ message: 'social_links must be an object' });
            }

            const newKeys = Object.keys(social_links);
            const oldKeys = Object.keys(existingLinks);

            // Check for added or removed keys
            const keysAdded = newKeys.filter(key => !oldKeys.includes(key));
            const keysRemoved = oldKeys.filter(key => !newKeys.includes(key));

            if (keysAdded.length > 0 || keysRemoved.length > 0) {
                return res.status(400).json({
                    message: 'You cannot add or remove social link keys, only edit the existing ones',
                });
            }

            // Merge updated values into existing
            for (const key of oldKeys) {
                if (social_links[key] && social_links[key].trim() !== '') {
                    existingLinks[key] = social_links[key].trim();
                }
            }
        }

        // Update the record
        await db.query(`
            UPDATE distribution_requests 
            SET caption = $1,
                description = $2,
                genre = $3,
                social_links = $4,
                updated_at = NOW(),
                read = $7
            WHERE id = $5 AND profile_id = $6
        `, [
            caption || existingRequest.caption,
            description || existingRequest.description,
            genre || existingRequest.genre,
            JSON.stringify(existingLinks),
            request_id,
            profile.id,
            false
        ]);

        return res.status(200).json({
            message: 'Distribution request updated successfully',
            updated_links: existingLinks,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

exports.mediaPromotion = async (req, res) => {
    const { description, caption, genre, media_links } = req.body;
    const profile = req.profile;

    try {
        // Validate fields
        if (!caption || !description || !genre || !media_links || typeof media_links !== 'object') {
            return res.status(400).json({ message: 'Required fields missing or invalid media_links format' });
        }

        const user = await db.query(`SELECT identity FROM users WHERE id = $1`, [profile.user_id]);

        const activeLinks = Object.values(media_links).filter(link => link && link.trim() !== '');
        const finalAmount = activeLinks.length * 15000;

        // Ensure audio file is valid
        if (!req.files || !req.files.audio_upload || !req.files.cover_photo) {
            return res.status(400).json({ message: 'Audio upload and cover photo are required' });
        }

        const fileExtension = path.extname(req.files.audio_upload.name).toLowerCase();
        if (fileExtension !== '.mp3') {
            return res.status(406).json({ error: 'Audio file must be in MP3 format' });
        }

        // Handle payment (except dev)
        if (user.rows[0].identity !== 'dev') {
            if (profile.balance < finalAmount) {
                return res.status(409).json({ message: 'Insufficient funds' });
            }

            await db.query(
                `UPDATE profile SET balance = balance - $1 WHERE id = $2`,
                [finalAmount, profile.id]
            );
        }

        // Upload files to Cloudinary
        const cloud_cover_photo = await cloudinary.uploader.upload(req.files.cover_photo.tempFilePath);
        const cloud_audio_upload = await cloudinary.uploader.upload(req.files.audio_upload.tempFilePath, {
            resource_type: "video",
            folder: "distribution_uploads",
            format: "mp3",
            chunk_size: 10000000,
        });

        // Save request
        await db.query(`
            INSERT INTO mediapromotion_requests 
            (profile_id, caption, description, audio_upload, cover_photo, amount, paid, media_links)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                profile.id,
                caption,
                description,
                cloud_audio_upload.secure_url,
                cloud_cover_photo.secure_url,
                finalAmount,
                true,
                JSON.stringify(media_links)
            ]
        );

        return res.status(200).json({
            message: 'Music Promotion request successful',
            charge: finalAmount,
            links_used: activeLinks.length,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};

exports.editMusicPromotion = async (req, res) => {
    const { description, caption, genre, media_links } = req.body;
    const profile = req.profile;
    const { request_id } = req.params;

    try {
        // Fetch the existing distribution request
        const result = await db.query(
            `SELECT * FROM musicpromotion_requests WHERE id = $1 AND profile_id = $2`,
            [request_id, profile.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Music Promotion request not found' });
        }

        const existingRequest = result.rows[0];
        const existingLinks = existingRequest.media_links;

        // Validate social_links
        if (social_links) {
            if (typeof media_links !== 'object' || Array.isArray(media_links)) {
                return res.status(400).json({ message: 'media_links must be an object' });
            }

            const newKeys = Object.keys(media_links);
            const oldKeys = Object.keys(existingLinks);

            // Check for added or removed keys
            const keysAdded = newKeys.filter(key => !oldKeys.includes(key));
            const keysRemoved = oldKeys.filter(key => !newKeys.includes(key));

            if (keysAdded.length > 0 || keysRemoved.length > 0) {
                return res.status(400).json({
                    message: 'You cannot add or remove media link keys, only edit the existing ones',
                });
            }

            // Merge updated values into existing
            for (const key of oldKeys) {
                if (media_links[key] && media_links[key].trim() !== '') {
                    existingLinks[key] = media_links[key].trim();
                }
            }
        }

        // Update the record
        await db.query(`
            UPDATE musicpromotion_requests 
            SET caption = $1,
                description = $2,
                genre = $3,
                media_links = $4,
                updated_at = NOW(),
                read = $7
            WHERE id = $5 AND profile_id = $6
        `, [
            caption || existingRequest.caption,
            description || existingRequest.description,
            genre || existingRequest.genre,
            JSON.stringify(existingLinks),
            request_id,
            profile.id,
            false
        ]);

        return res.status(200).json({
            message: 'Music promotion request updated successfully',
            updated_links: existingLinks,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Something went wrong',
            error: error.message,
        });
    }
}

exports.getMusicPromotionRequests = async (req, res) => {
    const profile = req.profile;

    const results = await db.query(`
        SELECT * FROM musicpromotion_requests
        WHERE profile_id = $1`, [profile.id]
    );

    if (results.rowCount === 0) return res.status(200).json({ message: 'No music promotion requests found', results: [] });
    return res.status(200).json({ message: 'Music promotion requests found', results: results.rows });
};
