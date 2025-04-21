const express = require('express');
const { tokenRequired, tokenProfileRequired } = require('../middleware/Auth.middleware')
const { updateProfileValidator, followProfileValidator, virtualAccountValidator } = require('../middleware/User.middleware');
const { transactionHistoryController } = require('../controllers/Payment.controller');
const { getProfile, updateProfile, deleteProfile, followProfile, getProfileById, getRoomId, getChatRooms } = require('../controllers/User.controller');
const router = express.Router();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     description: Retrieves the profile information for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Profile ID
 *                 image:
 *                   type: string
 *                   description: Profile image URL
 *                 cover_image:
 *                   type: string
 *                   description: Cover image URL
 *                 bio:
 *                   type: string
 *                   description: User biography
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: Profile creation timestamp
 *                 username:
 *                   type: string
 *                   description: User's username
 *                 firstname:
 *                   type: string
 *                   description: User's firstname
 *                 lastname:
 *                   type: string
 *                   description: User's lastname
 *                 middlename:
 *                   type: string
 *                   description: User's middlename
 *                 email:
 *                   type: string
 *                   description: User's email
 *                 phone_number:
 *                   type: string
 *                   description: User's phone number
 *                 identity:
 *                   type: string
 *                   description: User's identity type
 *                 email_verified:
 *                   type: boolean
 *                   description: Whether email is verified
 *                 is_admin:
 *                   type: boolean
 *                   description: Whether user is an admin
 *               example:
 *                 id: 1
 *                 image: "https://example.com/image.jpg"
 *                 cover_image: "https://example.com/cover.jpg"
 *                 bio: "Software developer"
 *                 username: "Myles"
 *                 email: "example@gmail.com"
 *                 phone_number: 08049387362
 *                 identity: "artist"
 *                 email_verified: true
 *                 is_admin: false
 *                 created_at: "2025-03-07T12:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.get('/profile', tokenProfileRequired, getProfile);


/**
 * @swagger
 * /api/user/profile/{id}:
 *   get:
 *     summary: Get user profile by id
 *     tags: [Profile]
 *     description: Retrieves the profile information for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to retrieve notifications for
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Profile ID
 *                 image:
 *                   type: string
 *                   description: Profile image URL
 *                 cover_image:
 *                   type: string
 *                   description: Cover image URL
 *                 bio:
 *                   type: string
 *                   description: User biography
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: Profile creation timestamp
 *                 username:
 *                   type: string
 *                   description: User's username
 *                 email:
 *                   type: string
 *                   description: User's email
 *                 phone_number:
 *                   type: string
 *                   description: User's phone number
 *                 identity:
 *                   type: string
 *                   description: User's identity type
 *                 email_verified:
 *                   type: boolean
 *                   description: Whether email is verified
 *                 is_admin:
 *                   type: boolean
 *                   description: Whether user is an admin
 *               example:
 *                 id: 1
 *                 image: "https://example.com/image.jpg"
 *                 cover_image: "https://example.com/cover.jpg"
 *                 bio: "Software developer"
 *                 username: "Myles"
 *                 email: "example@gmail.com"
 *                 phone_number: 08049387362
 *                 identity: "artist"
 *                 email_verified: true
 *                 is_admin: false
 *                 created_at: "2025-03-07T12:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.get('/profile/:id', tokenProfileRequired, getProfileById);


/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     description: Updates the authenticated user's profile and user details. Email updates trigger a verification email.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username
 *               email:
 *                 type: string
 *                 description: New email (triggers verification)
 *               phone_number:
 *                 type: string
 *                 description: New phone number
 *               bio:
 *                 type: string
 *                 description: New biography
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *               cover_image:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file
 *           required: [] 
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 emailVerificationSent:
 *                   type: boolean
 *                   description: Indicates if an email verification was sent
 *               example:
 *                 message: "Profile updated successfully"
 *                 emailVerificationSent: true
 *       400:
 *         description: Validation errors
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.put('/profile', tokenRequired, ...updateProfileValidator, updateProfile);

/**
 * @swagger
 * /api/user/profile:
 *   delete:
 *     summary: Delete user profile
 *     description: Deletes the authenticated user's profile. Does not affect the user account itself.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *               example:
 *                 status: true
 *                 message: "Profile deleted successfully"
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */
router.delete('/profile', tokenRequired, deleteProfile);

/**
 * @swagger
 * /api/user/follow:
 *   post:
 *     summary: Follow or unfollow a user profile
 *     description: Allows an authenticated user to follow or unfollow another user profile.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileId:
 *                 type: integer
 *                 description: The ID of the profile to follow or unfollow.
 *                 example: 123
 *               follow:
 *                 type: boolean
 *                 description: Set to true to follow, false to unfollow.
 *                 example: true
 *     responses:
 *       200:
 *         description: Follow action successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Follow action successful"
 *       401:
 *         description: No changes made (already followed/unfollowed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "No changes made"
 *       404:
 *         description: Profile ID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Profile ID does not exist"
 *       406:
 *         description: User cannot follow themselves
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "You cannot follow yourself"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.post('/follow', tokenProfileRequired, ...followProfileValidator, followProfile);

/**
 * @swagger
 * /api/user/get-room-id:
 *   post:
 *     summary: Get the room id of the profiles
 *     description: Get the room id of the profiles
 *     tags: [Profile] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileId_1:
 *                 type: integer
 *                 description: The ID of the profile to follow or unfollow.
 *                 example: 123
 *               profileId_2:
 *                 type: integer
 *                 description: The ID of the profile to follow or unfollow.
 *                 example: 123
 *     responses:
 *       200:
 *         description: Get the room id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *               example:
 *                 room_id: "123456"
 *       400:
 *         description: Required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Profile Ids missing"
 *       404:
 *         description: Profile ID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Profile1 not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.post('/get-room-id', getRoomId);


/**
 * @swagger
 * /api/user/get-rooms:
 *   get:
 *     summary: Get the room id of the profiles
 *     description: Get the room id of the profiles
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Get rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room_id:
 *                   type: string
 *                 recipient_id:
 *                   type: string
 *               example:
 *                 room_id: "123456"
 *                 recipient_id: "283"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.get('/get-rooms', tokenProfileRequired, getChatRooms);


/**
 * @swagger
 * /api/user/transactions:
 *   get:
 *     summary: Get all transaction history for the authenticated user
 *     description: Returns a list of transactions including promotions, audio sales, and subscriptions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 *                         example: "promotion_audio"
 *                       status:
 *                         type: string
 *                         example: "successful"
 *                       postId:
 *                         type: string
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 error:
 *                   type: string
 *               example:
 *                 status: false
 *                 error: "Internal server error"
 */
router.get('/transactions', tokenRequired, transactionHistoryController);

module.exports = router;


